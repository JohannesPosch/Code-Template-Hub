
import * as vscode from 'vscode';
import * as path from 'path';
import { TemplateManager } from './template/template-manager';
import { TemplateRenderer } from './template/template-renderer';
import { TemplateRepositoryManager } from './repository/template-repository-manager';
import { Template } from './template/template';
import { TemplateTreeProvider } from './view/template-tree-provider';

/**
 * Class to handle template commands
 */
export class TemplateCommandHandler {
	private templateManager: TemplateManager;
	private templateRenderer: TemplateRenderer;
	private templateTreeProvider: TemplateTreeProvider;

	/**
	 * Creates a new template command handler
	 */
	constructor(
		private context: vscode.ExtensionContext,
		private repositoryManager: TemplateRepositoryManager
	) {
		this.templateManager = new TemplateManager(repositoryManager);
		this.templateRenderer = new TemplateRenderer();
		this.templateTreeProvider = new TemplateTreeProvider(this.templateManager, repositoryManager);

		// Register commands
		this.registerCommands();
	}

	/**
	 * Initializes the command handler
	 */
	public async initialize(): Promise<void> {
		await this.templateManager.initialize();
	}

	/**
	 * Register extension commands
	 */
	private registerCommands(): void {
		// Register create template command
		this.context.subscriptions.push(
			vscode.commands.registerCommand(
				'codeTemplateHub.createFromTemplate',
				this.createFromTemplate.bind(this)
			)
		);

		// Register refresh templates command
		this.context.subscriptions.push(
			vscode.commands.registerCommand(
				'codeTemplateHub.refreshTemplates',
				this.refreshTemplates.bind(this)
			)
		);

		// Register show template diagnostics command
		this.context.subscriptions.push(
			vscode.commands.registerCommand(
				'codeTemplateHub.showDiagnostics',
				this.showDiagnostics.bind(this)
			)
		);

		// Register configure author info command
		this.context.subscriptions.push(
			vscode.commands.registerCommand(
				'codeTemplateHub.configureAuthorInfo',
				this.configureAuthorInfo.bind(this)
			)
		);

		// Register configuration change listener
		vscode.workspace.onDidChangeConfiguration(async (e) => {
			if (e.affectsConfiguration('codeTemplateHub.repositories')) {
				vscode.commands.executeCommand('codeTemplateHub.refreshTemplates');
			}
		});
	}

	/**
	 * Command to create files from template
	 */
	private async createFromTemplate(uri?: vscode.Uri): Promise<void> {
		try {
			// Get target directory
			let targetDir: string;

			if (uri && uri.scheme === 'file') {
				const stat = await vscode.workspace.fs.stat(uri);
				targetDir = stat.type === vscode.FileType.Directory
					? uri.fsPath
					: path.dirname(uri.fsPath);
			} else if (vscode.window.activeTextEditor) {
				targetDir = path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
			} else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
				targetDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
			} else {
				vscode.window.showErrorMessage('No valid target directory found');
				return;
			}

			// Get available templates
			const templates = this.templateManager.getAllTemplates();

			if (templates.length === 0) {
				vscode.window.showErrorMessage('No templates found');
				return;
			}

			// Show template picker
			const selectedTemplate = await this.pickTemplate();
			if (!selectedTemplate) {
				return;
			}

			// Collect parameters
			const params = await this.templateRenderer.collectParameters(selectedTemplate);
			if (!params) {
				return; // User cancelled
			}

			// Render the template
			const createdFiles = await this.templateRenderer.renderTemplate(
				selectedTemplate,
				targetDir,
				params,
				{
					workspaceDir: (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined,
					executionDir: targetDir
				}
			);

			// Show success message
			vscode.window.showInformationMessage(
				`Created ${createdFiles.length} file(s) from template "${selectedTemplate.name}"`
			);

			// Open the first file
			if (createdFiles.length > 0) {
				const document = await vscode.workspace.openTextDocument(createdFiles[0]);
				await vscode.window.showTextDocument(document);
			}
		} catch (error) {
			vscode.window.showErrorMessage(
				`Failed to create from template: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Show template selection UI
	 */
	private async pickTemplate(): Promise<Template | undefined> {
		// Group templates by category
		const templatesByCategory = this.templateManager.getTemplatesByCategory();
		const categories = Array.from(templatesByCategory.keys()).filter(cat => cat !== 'All');

		// Create picker items
		type TemplateQuickPickItem = vscode.QuickPickItem & { template?: Template };

		const items: TemplateQuickPickItem[] = [];

		// Add category headers and templates
		for (const category of categories) {
			const categoryTemplates = templatesByCategory.get(category) || [];

			if (categoryTemplates.length > 0) {
				// Add category header
				items.push({
					label: category,
					kind: vscode.QuickPickItemKind.Separator
				});

				// Add templates in this category
				for (const template of categoryTemplates) {
					items.push({
						label: template.name,
						description: `(${template.repositoryName || 'Unknown repository'})`,
						detail: template.description,
						iconPath: template.icon ? new vscode.ThemeIcon(template.icon) : undefined,
						template: template
					});
				}
			}
		}

		// Show picker
		const selected = await vscode.window.showQuickPick(items, {
			title: 'Select Template',
			placeHolder: 'Choose a template to create files from'
		});

		return selected?.template;
	}

	/**
	 * Command to refresh templates
	 */
	private async refreshTemplates(): Promise<void> {
		try {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Refreshing Templates",
				cancellable: false
			}, async () => {
				await this.repositoryManager.refreshRepositories();
				await this.templateManager.refresh();

				await this.templateTreeProvider.refresh();

				vscode.window.showInformationMessage('Templates refreshed successfully');
			});
		} catch (error) {
			vscode.window.showErrorMessage(
				`Failed to refresh templates: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}

	/**
	 * Command to show template diagnostics
	 */
	private async showDiagnostics(): Promise<void> {
		const diagnostics = this.templateManager.getDiagnostics();

		// Create output channel
		const outputChannel = vscode.window.createOutputChannel('Template Diagnostics');
		outputChannel.clear();

		// Add header
		outputChannel.appendLine('# Code Template Hubs Extension Diagnostics');
		outputChannel.appendLine('');

		// Add repository information
		const repositories = this.repositoryManager.getRepositories();
		outputChannel.appendLine(`## Repositories (${repositories.length})`);

		for (const repo of repositories) {
			outputChannel.appendLine(`* ${repo.displayName} (${repo.status})`);
			outputChannel.appendLine(`  - URL: ${repo.config.url}`);
			outputChannel.appendLine(`  - Local Path: ${repo.localPath}`);
			outputChannel.appendLine(`  - Exists: ${repo.exists}`);
			if (repo.errorMessage) {
				outputChannel.appendLine(`  - Error: ${repo.errorMessage}`);
			}
			outputChannel.appendLine('');
		}

		// Add template information
		const templates = this.templateManager.getAllTemplates();
		outputChannel.appendLine(`## Templates (${templates.length})`);

		for (const template of templates) {
			outputChannel.appendLine(`* ${template.name}`);
			outputChannel.appendLine(`  - Description: ${template.description}`);
			outputChannel.appendLine(`  - Category: ${template.category || 'Uncategorized'}`);
			outputChannel.appendLine(`  - Files: ${template.files.length}`);
			outputChannel.appendLine('');
		}

		// Add diagnostics
		outputChannel.appendLine(`## Diagnostics (${diagnostics.length})`);

		for (const diag of diagnostics) {
			const repo = repositories.find(r => r.id === diag.repositoryId);
			const repoName = repo ? repo.displayName : diag.repositoryId;

			outputChannel.appendLine(`* [${diag.level.toUpperCase()}] ${repoName}: ${diag.message}`);
		}

		// Show the output channel
		outputChannel.show();
	}

	/**
	 * Command to configure author information
	 */
	private async configureAuthorInfo(): Promise<void> {
		try {
			// Get current settings
			const config = vscode.workspace.getConfiguration('codeTemplateHub.author');
			const firstName = config.get<string>('firstName', '');
			const lastName = config.get<string>('lastName', '');
			const email = config.get<string>('email', '');

			// Prompt for first name
			const newFirstName = await vscode.window.showInputBox({
				title: 'Author First Name',
				prompt: 'Enter your first name for use in templates',
				value: firstName
			});

			if (newFirstName === undefined) {
				return; // User cancelled
			}

			// Prompt for last name
			const newLastName = await vscode.window.showInputBox({
				title: 'Author Last Name',
				prompt: 'Enter your last name for use in templates',
				value: lastName
			});

			if (newLastName === undefined) {
				return; // User cancelled
			}

			// Prompt for email
			const newEmail = await vscode.window.showInputBox({
				title: 'Author Email',
				prompt: 'Enter your email for use in templates',
				value: email
			});

			if (newEmail === undefined) {
				return; // User cancelled
			}

			// Update settings
			await config.update('firstName', newFirstName, vscode.ConfigurationTarget.Global);
			await config.update('lastName', newLastName, vscode.ConfigurationTarget.Global);
			await config.update('email', newEmail, vscode.ConfigurationTarget.Global);

			vscode.window.showInformationMessage('Author information updated successfully');
		} catch (error) {
			vscode.window.showErrorMessage(
				`Failed to update author information: ${error instanceof Error ? error.message : String(error)}`
			);
		}
	}
}
