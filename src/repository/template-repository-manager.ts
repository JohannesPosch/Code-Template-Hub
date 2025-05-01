
import * as vscode from 'vscode';
import * as path from 'path';
import { TemplateRepositoryConfig } from "./template-repository-config";
import { TemplateRepository } from "./template-repository";

/**
 * Manager for template repositories
 */
export class TemplateRepositoryManager
{
	/** Collection of managed repositories */
	private repositories: Map<string, TemplateRepository> = new Map();

	/** Base storage location for repositories */
	private readonly storageUri: vscode.Uri;

	/** Status bar item to show operations */
	private statusBarItem: vscode.StatusBarItem;

	/**
	 * Creates a new repository manager
	 * @param context Extension context
	 */
	constructor(private context: vscode.ExtensionContext) {
		this.storageUri = vscode.Uri.joinPath(context.globalStorageUri, 'templates');
		this.statusBarItem = vscode.window.createStatusBarItem(
			vscode.StatusBarAlignment.Left
		);
		this.statusBarItem.text = "$(repo) Template Hub";
		this.statusBarItem.command = 'codeTemplateHub.refreshTemplates';
	}

	/**
	 * Initializes the repository manager
	 */
	public async initialize(): Promise<void> {
		// Ensure storage directory exists
		try {
			await vscode.workspace.fs.stat(this.storageUri);
		} catch {
			await vscode.workspace.fs.createDirectory(this.storageUri);
		}

		// Load repositories from configuration
		await this.loadRepositories();

		// Clean up repositories that are no longer configured
		await this.cleanupRemovedRepositories();
	}

	/**
	 * Loads repositories from configuration
	 */
	private async loadRepositories(): Promise<void> {
		const configs = vscode.workspace.getConfiguration('codeTemplateHub')
			.get<TemplateRepositoryConfig[]>('repositories', []);

		this.statusBarItem.show();
		this.statusBarItem.text = "$(sync~spin) Loading Templates";

		// Clear previous repositories
		this.repositories.clear();

		// Create and initialize repositories
		var waitHandles: Promise<void>[] = [];

		for (const config of configs) {
			try {
				const repo = new TemplateRepository(config, this.storageUri);
				this.repositories.set(repo.id, repo);

				// Initialize repository (async but we don't wait)
				waitHandles.push(repo.initialize().catch(() => {
					// Error handling is done within the repository class
				}));
			} catch (error) {
				vscode.window.showErrorMessage(
					`Failed to configure repository ${config.url}: ${error}`
				);
			}
		}

		// Wait until all repositories are updated.
		await Promise.all(waitHandles);

		this.statusBarItem.text = "$(repo) Template Hub";
	}

	/**
	 * Clean up repositories that are no longer configured
	 */
	private async cleanupRemovedRepositories(): Promise<void> {
		try {

			// Create a set of expected directory names based on current configurations
			const expectedDirectories = new Set<string>();
			for (const repo of this.repositories.values()) {
				expectedDirectories.add(path.basename(repo.localPath));
			}

			// Show status during cleanup
			this.statusBarItem.text = "$(trash) Cleaning up removed repositories";

			// Get all directories in the storage location
			const entries = await vscode.workspace.fs.readDirectory(this.storageUri);

			// Keep track of deleted repos for notification
			let deletedCount = 0;

			// Check each directory in the storage location
			for (const [dirName, fileType] of entries) {
				if (fileType !== vscode.FileType.Directory) {
					continue; // Skip non-directories
				}

				// If this directory is not in our expected set, check if it's a git repo and delete it
				if (!expectedDirectories.has(dirName)) {
					const dirUri = vscode.Uri.joinPath(this.storageUri, dirName);

					// Check if this is a git repository (has .git directory)
					try {
						await vscode.workspace.fs.stat(vscode.Uri.joinPath(dirUri, '.git'));

						// This is a git repository and it's not in our expected directories, delete it
						console.log(`Deleting removed repository directory: ${dirUri.fsPath}`);
						await vscode.workspace.fs.delete(dirUri, { recursive: true });
						deletedCount++;

						// Log success
						console.log(`Successfully deleted repository directory: ${dirUri.fsPath}`);
					} catch {
						// Not a git repository or already deleted
					}
				}
			}

			// Reset status
			this.statusBarItem.text = "$(repo) Template Hub";

			// If we deleted any repositories, show notification
			if (deletedCount > 0) {
				vscode.window.showInformationMessage(
					`Cleaned up ${deletedCount} removed template repositories`
				);
			}
		} catch (error) {
			console.error("Error during repository cleanup:", error);
		}
	}

	/**
	 * Refreshes all repositories
	 */
	public async refreshRepositories(): Promise<void> {
		this.statusBarItem.text = "$(sync~spin) Refreshing Templates";

		const promises: Promise<void>[] = [];

		// Load repositories from configuration
		await this.loadRepositories();

		// Clean up repositories that are no longer configured
		await this.cleanupRemovedRepositories();

		// Update all repositories
		for (const repo of this.repositories.values()) {
			promises.push(
				repo.initialize().catch((error) => {
					vscode.window.showErrorMessage(
						`Failed to refresh repository ${repo.displayName}: ${error}`
					);
				})
			);
		}

		await Promise.allSettled(promises);
		this.statusBarItem.text = "$(repo) Template Hub";
	}

	/**
	 * Gets all repositories
	 */
	public getRepositories(): TemplateRepository[] {
		return Array.from(this.repositories.values());
	}

	/**
	 * Gets a repository by ID
	 */
	public getRepository(id: string): TemplateRepository | undefined {
		return this.repositories.get(id);
	}

	/**
	 * Disposes resources
	 */
	public dispose(): void {
		this.statusBarItem.dispose();
	}
}
