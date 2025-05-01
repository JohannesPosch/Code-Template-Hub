// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TemplateRepositoryManager } from './repository/template-repository-manager';
import { TemplateCommandHandler } from './template-command-handler';
import { TemplateManager } from './template/template-manager';
import { registerViews } from './view/views';
import { TemplateTreeProvider } from './view/template-tree-provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	try {
		// Initialize repository manager
		const repositoryManager = new TemplateRepositoryManager(context);
		await repositoryManager.initialize();

		// Initialize command handler
		const commandHandler = new TemplateCommandHandler(context, repositoryManager);
		await commandHandler.initialize();

		const templateTreeProvider = commandHandler['templateTreeProvider'] as TemplateTreeProvider;

		// Register views
		registerViews(context, templateTreeProvider);

		// Register disposables
		context.subscriptions.push(repositoryManager);

		// Check for author information
		const firstName = vscode.workspace.getConfiguration('codeTemplateHub.author').get<string>('firstName', '');
		const lastName = vscode.workspace.getConfiguration('codeTemplateHub.author').get<string>('lastName', '');
		const email = vscode.workspace.getConfiguration('codeTemplateHub.author').get<string>('email', '');

		// Get template count
		const templateManager = commandHandler['templateManager'] as TemplateManager;
		const templates = templateManager.getAllTemplates();
		// Show info notification
		if (templates.length > 0) {
			vscode.window.showInformationMessage(
				`Code Template Hub: ${templates.length} templates available`
			);
		} else {
			vscode.window.showInformationMessage(
				'Code Template Hub: No templates found. Add repositories in settings.'
			);
		}

		// If author info is missing, suggest configuring it
		if (!firstName && !lastName && !email) {
			const configureButton = 'Configure Now';
			const result = await vscode.window.showInformationMessage(
				'Code Template Hub: Author information is not configured. This is used in templates.',
				configureButton
			);

			if (result === configureButton) {
				await vscode.commands.executeCommand('codeTemplateHub.configureAuthorInfo');
			}
		}
	} catch (error) {
		vscode.window.showErrorMessage(
			`Failed to initialize Code Template Hub extension: ${error instanceof Error ? error.message : String(error)}`
		);
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
