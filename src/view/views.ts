import * as vscode from 'vscode';
import * as path from 'path';
import { Template } from '../template/template';
import { TemplateManager } from '../template/template-manager';
import { TemplateTreeProvider } from './template-tree-provider';
import { TemplateRenderer } from '../template/template-renderer';
import { TemplateRepositoryManager } from '../repository/template-repository-manager';

/**
 * Register views for the extension
 */
export function registerViews(
	context: vscode.ExtensionContext,
	templateTreeProvider: TemplateTreeProvider
): void {
	// Register the tree view
	const treeView = vscode.window.createTreeView('codeTemplateHubExplorer', {
		treeDataProvider: templateTreeProvider
	});

	// Register command to refresh the tree view
	context.subscriptions.push(
		vscode.commands.registerCommand('codeTemplateHub.refreshTemplatesView', () => {
			templateTreeProvider.refresh();
		})
	);

	// Register command to create files from template in the view
	context.subscriptions.push(
		vscode.commands.registerCommand('codeTemplateHub.createFromTemplateInView', async (template: Template) => {
			// Determine target directory
			let targetDir: string | undefined;

			// If there's an active workspace folder, use that
			if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
				if (vscode.workspace.workspaceFolders.length === 1) {
					// Only one workspace folder, use it directly
					targetDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
				} else {
					// Multiple workspace folders, let user choose
					const folders = vscode.workspace.workspaceFolders.map(folder => ({
						label: folder.name,
						description: folder.uri.fsPath,
						uri: folder.uri
					}));

					const selected = await vscode.window.showQuickPick(folders, {
						placeHolder: 'Select workspace folder for template'
					});

					if (!selected) {
						return; // User cancelled
					}

					targetDir = selected.uri.fsPath;
				}
			} else if (vscode.window.activeTextEditor) {
				// No workspace folder, but there's an active editor
				targetDir = path.dirname(vscode.window.activeTextEditor.document.uri.fsPath);
			} else {
				// No workspace folder and no active editor, ask user to select a folder
				const selected = await vscode.window.showOpenDialog({
					canSelectFiles: false,
					canSelectFolders: true,
					canSelectMany: false,
					title: 'Select folder for template'
				});

				if (!selected || selected.length === 0) {
					return; // User cancelled
				}

				targetDir = selected[0].fsPath;
			}

			if (!targetDir) {
				vscode.window.showErrorMessage('No valid target directory found');
				return;
			}

			// Now execute the same logic as in createFromTemplate command
			try {
				// Collect parameters
				const templateRenderer = new TemplateRenderer();
				const params = await templateRenderer.collectParameters(template);
				if (!params) {
					return; // User cancelled
				}

				// Render the template
				const createdFiles = await templateRenderer.renderTemplate(
					template,
					targetDir,
					params
				);

				// Show success message
				vscode.window.showInformationMessage(
					`Created ${createdFiles.length} file(s) from template "${template.name}"`
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
		})
	);

	// Register the tree view for disposal
	context.subscriptions.push(treeView);
}
