import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as simpleGit from 'simple-git';
import { TemplateRepositoryConfig } from './template-repository-config';

/**
 * Represents the status of the repository
 */
export enum RepositoryStatus
{
	/** Repository is being initialized */
	INITIALIZING = 'initializing',

	/** Repository is ready for use */
	READY = 'ready',

	/** Repository is being updated */
	UPDATING = 'updating',

	/** Repository is not available */
	ERROR = 'error'
};

/**
 * Represents a managed template repository
 */
export class TemplateRepository
{
	/** Unique identifier for the repository */
	public readonly id: string;

	/** Local URI where repository is stored */
	public readonly localUri: vscode.Uri;

	/** Git instance for this repository */
	private git: simpleGit.SimpleGit;

	/** Status of the repository */
	private _status: RepositoryStatus;

	/** Error message if status is 'error' */
	private _errorMessage?: string;

	/** Whether the repository exists locally */
	private _exists: boolean = false;

	/**
	 * Creates a new template repository
	 * @param config Repository configuration
	 * @param baseStorageUri Base storage location for repositories
	 */
	constructor(
		public readonly config: TemplateRepositoryConfig,
		baseStorageUri: vscode.Uri
	) {
		this.id = this.generateId(config.url);
		const dirName = TemplateRepository.generateSafeDirectoryName(config.url);
		this.localUri = vscode.Uri.joinPath(baseStorageUri, dirName);
		this._status = RepositoryStatus.INITIALIZING;

		this.git = simpleGit.simpleGit();
	}

	/**
	 * Gets the current status of the repository
	 */
	public get status(): RepositoryStatus {
		return this._status;
	}

	/**
	 * Gets error message if repository is in error state
	 */
	public get errorMessage(): string | undefined {
		return this._errorMessage;
	}

	/**
	 * Gets the display name for the repository
	 */
	public get displayName(): string {
		if (this.config.name) {
			return this.config.name;
		}

		// Extract name from URL if not provided
		const urlParts = this.config.url.split('/');
		let name = urlParts[urlParts.length - 1].replace(/\.git$/, '');

		// Try to get user/repo format for GitHub repositories
		const githubMatch = this.config.url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
		if (githubMatch) {
			name = `${githubMatch[1]}/${githubMatch[2]}`;
		}

		return name;
	}

	/**
	 * Gets the local path of the repository
	 */
	public get localPath(): string {
		return this.localUri.fsPath;
	}

	/**
	 * Gets whether the repository exists locally
	 */
	public get exists(): boolean {
		return this._exists;
	}

	/**
	 * Initializes the repository (clone or pull)
	 */
	public async initialize(): Promise<void> {
		try {
			this._status = RepositoryStatus.INITIALIZING;

			// Check if repository directory exists and has .git folder
			try {
				await vscode.workspace.fs.stat(vscode.Uri.joinPath(this.localUri, '.git'));
				this._exists = true;
			} catch {
				this._exists = false;
			}

			if (this._exists) {
				await this.update();
			} else {
				await this.clone();
			}

			this._status = RepositoryStatus.READY;
		} catch (error) {
			this._status = RepositoryStatus.ERROR;
			this._errorMessage = error instanceof Error ? error.message : String(error);
			throw error;
		}
	}

	/**
	 * Updates the repository with latest changes
	 */
	public async update(): Promise<void> {
		try {
			this._status = RepositoryStatus.UPDATING;

			this.git = simpleGit.simpleGit(this.localPath);
			const branch = this.config.branch || 'main';

			// If token is provided and it's an HTTPS URL, configure git credentials
			if (this.config.token && this.config.url.startsWith('https://')) {
				// Extract domain from URL
				const domain = new URL(this.config.url).hostname;

				// Configure git to use the token for this operation
				await this.git.addConfig('credential.helper', 'store', false, 'global');

				// Store credentials temporarily for this operation
				const credentialInput = `protocol=https\nhost=${domain}\nusername=${this.config.token}\npassword=x-oauth-basic\n`;
				await vscode.workspace.fs.writeFile(
					vscode.Uri.file(path.join(os.homedir(), '.git-credentials')),
					Buffer.from(credentialInput)
				);
			}

			// Fetch latest changes
			await this.git.fetch('origin');

			// Get current branch
			const currentBranch = await this.git.revparse(['--abbrev-ref', 'HEAD']);

			// If different branch specified, checkout that one
			if (currentBranch !== branch) {
				await this.git.checkout(branch);
			}

			// Pull latest changes
			await this.git.pull('origin', branch);

			this._status = RepositoryStatus.READY;
		} catch (error) {
			this._status = RepositoryStatus.ERROR;
			this._errorMessage = error instanceof Error ? error.message : String(error);
			throw error;
		}
	}

	/**
	 * Clones the repository
	 */
	private async clone(): Promise<void> {
		try {
			// Ensure parent directory exists
			await vscode.workspace.fs.createDirectory(this.localUri.with({
				path: path.dirname(this.localUri.fsPath)
			}));

			// Remove directory if it exists but is not a git repo
			try {
				await vscode.workspace.fs.delete(this.localUri, { recursive: true });
			} catch {}

			// Clone the repository
			const repoUrl = await this.getAuthenticatedUrl();
			const branch = this.config.branch || 'main';

			this.git = simpleGit.simpleGit();

			// If token is provided and it's an HTTPS URL, configure git credentials
			if (this.config.token && this.config.url.startsWith('https://')) {
				// Extract domain from URL
				const domain = new URL(this.config.url).hostname;

				// Configure git to use the token for this operation
				// This is more secure than embedding it in the URL
				await this.git.addConfig('credential.helper', 'store', false, 'global');

				// Store credentials temporarily for this operation
				const credentialInput = `protocol=https\nhost=${domain}\nusername=${this.config.token}\npassword=x-oauth-basic\n`;
				await vscode.workspace.fs.writeFile(
					vscode.Uri.file(path.join(os.homedir(), '.git-credentials')),
					Buffer.from(credentialInput)
				);
			}

			await this.git.clone(repoUrl, this.localPath, ['--branch', branch]);

			this._exists = true;
		} catch (error) {
			this._status = RepositoryStatus.ERROR;
			this._errorMessage = error instanceof Error ? error.message : String(error);
			throw error;
		}
	}

	/**
	 * Gets authenticated URL based on auth type
	 */
	private async getAuthenticatedUrl(): Promise<string> {
		// If token is provided in config, use it for authentication
		if (this.config.token) {
			// For HTTPS URLs, insert the token
			if (this.config.url.startsWith('https://')) {
				// Format: https://token:x-oauth-basic@github.com/user/repo.git
				const urlObj = new URL(this.config.url);
				urlObj.username = this.config.token;
				urlObj.password = 'x-oauth-basic';
				return urlObj.toString();
			}
			// For SSH URLs, we can't embed the token in the URL
			// The token would be used via SSH agent or credentials helper
		}

		// Return original URL if no token or SSH URL
		return this.config.url;
	}

	/**
	 * Generate a unique ID for the repository based on its URL
	 */
	private generateId(url: string): string {
		// Create a hash from the URL
		let hash = 0;
		for (let i = 0; i < url.length; i++) {
			const char = url.charCodeAt(i);
			hash = ((hash << 5) - hash) + char;
			hash = hash & hash; // Convert to 32bit integer
		}
		return `repo-${Math.abs(hash).toString(16)}`;
	}

	/**
	 * Generate a safe directory name from the repository URL
	 */
	public static generateSafeDirectoryName(url: string): string {
		// Extract the repo name from the URL
		const repoName = url.split('/').pop()?.replace(/\.git$/, '') || 'repo';

		// Make it safe for file systems
		return repoName.replace(/[^\w\-]/g, '-');
	}

	/**
	 * Get template files from the repository
	 */
	public async getTemplateFiles(pattern: string = '**/*.dot.js'): Promise<vscode.Uri[]> {
		if (!this._exists || this._status === 'error') {
			throw new Error(`Repository ${this.displayName} is not available`);
		}

		const globPattern = new vscode.RelativePattern(this.localPath, pattern);
		const files = await vscode.workspace.findFiles(globPattern);
		return files;
	}
}
