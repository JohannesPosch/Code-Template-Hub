import * as vscode from 'vscode';
import { Template } from '../template/template';
import { TemplateManager } from '../template/template-manager';
import { TemplateTreeItem } from './template-tree-item';
import { TemplateRepositoryManager } from '../repository/template-repository-manager';

/**
 * Template tree data provider
 */
export class TemplateTreeProvider implements vscode.TreeDataProvider<TemplateTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<TemplateTreeItem | undefined | null | void> = new vscode.EventEmitter<TemplateTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<TemplateTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	/**
	 * Creates a new template tree provider
	 */
	constructor(
		private templateManager: TemplateManager,
		private repositoryManager: TemplateRepositoryManager
	) {}

	/**
	 * Refresh the tree view
	 */
	public refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	/**
	 * Get the tree item representation for an element
	 */
	getTreeItem(element: TemplateTreeItem): vscode.TreeItem {
		return element;
	}

	/**
	 * Get the children of an element
	 */
	getChildren(element?: TemplateTreeItem): Thenable<TemplateTreeItem[]> {
		if (!element) {
			// Root level - return repositories
			const repositories = this.repositoryManager.getRepositories();

			return Promise.resolve(
				repositories.map(repo => new TemplateTreeItem(
					repo.displayName,
					vscode.TreeItemCollapsibleState.Expanded,
					undefined,
					repo
				))
			);
		} else if (element.repository) {
			// Repository level - return templates in this repository
			const templates = this.templateManager.getTemplatesFromRepository(element.repository.id);

			// Group templates by category
			const categories = new Map<string, Template[]>();

			for (const template of templates) {
				const category = template.category || 'Uncategorized';
				if (!categories.has(category)) {
					categories.set(category, []);
				}
				categories.get(category)?.push(template);
			}

			if (categories.size <= 1) {
				// If only one category (or none), show templates directly
				return Promise.resolve(
					templates.map(template => new TemplateTreeItem(
						template.name,
						vscode.TreeItemCollapsibleState.None,
						template
					))
				);
			} else {
				// If multiple categories, group templates by category
				const categoryItems: TemplateTreeItem[] = [];

				for (const [category, categoryTemplates] of categories.entries()) {
					const categoryItem = new TemplateTreeItem(
						category,
						vscode.TreeItemCollapsibleState.Expanded
					);
					categoryItem.contextValue = 'templateCategory';
					categoryItems.push(categoryItem);

					// Store category templates as a property of the category item
					(categoryItem as any).templates = categoryTemplates;
				}

				return Promise.resolve(categoryItems);
			}
		} else if ((element as any).templates) {
			// Category level - return templates in this category
			const templates = (element as any).templates as Template[];

			return Promise.resolve(
				templates.map(template => new TemplateTreeItem(
					template.name,
					vscode.TreeItemCollapsibleState.None,
					template
				))
			);
		}

		return Promise.resolve([]);
	}
}
