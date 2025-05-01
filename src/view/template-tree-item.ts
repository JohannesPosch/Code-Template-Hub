import * as vscode from 'vscode';
import { Template } from '../template/template';
import { TemplateRepository } from '../repository/template-repository';

/**
 * Represents a node in the templates tree view
 */
export class TemplateTreeItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly template?: Template,
		public readonly repository?: TemplateRepository
	) {
		super(label, collapsibleState);

		if (template) {
			// This is a template node
			this.tooltip = template.description;
			this.description = template.category || '';
			this.iconPath = template.icon ? new vscode.ThemeIcon(template.icon) : undefined;
			this.command = {
				command: 'codeTemplateHub.createFromTemplateInView',
				title: 'Create Files from Template',
				arguments: [template]
			};
		} else if (repository) {
			// This is a repository node
			this.tooltip = repository.config.description || repository.displayName;
			this.description = repository.status === 'ready' ? '' : `(${repository.status})`;
			this.iconPath = new vscode.ThemeIcon(this.getIconForRepository(repository));
			this.contextValue = 'templateRepository';
		}
	}

	/**
	 * Get appropriate icon for repository based on status
	 */
	private getIconForRepository(repository: TemplateRepository): string {
		switch (repository.status) {
			case 'ready':
				return 'repo';
			case 'initializing':
			case 'updating':
				return 'sync';
			case 'error':
				return 'error';
			default:
				return 'repo';
		}
	}
}
