
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Template } from './template';
import { TemplateConfig } from './template-config';
import { TemplateRepositoryManager } from '../repository/template-repository-manager';
import { TemplateRepository } from '../repository/template-repository';

/**
 * Class to manage template discovery and operations
 */
export class TemplateManager
{
	/** Map of repository ID to available templates */
	private templates: Map<string, Template[]> = new Map();

	/** Map of template name-repository pairs for uniqueness validation */
	private templateNameMap: Map<string, Set<string>> = new Map();

	/** The repository manager to use */
	private repositoryManager: TemplateRepositoryManager;

	/** Template diagnostics for logging and troubleshooting */
	private diagnostics: {
		repositoryId: string,
		message: string,
		level: 'info' | 'warning' | 'error'
	}[] = [];

	/**
	 * Creates a new template manager
	 * @param repositoryManager The repository manager to use
	 */
	constructor(repositoryManager: TemplateRepositoryManager)
	{
		this.repositoryManager = repositoryManager;
	}

	/**
	 * Initializes the template manager
	 */
	public async initialize(): Promise<void> {
		// Clear existing templates and diagnostics
		this.templates.clear();
		this.templateNameMap.clear();
		this.diagnostics = [];

		// Load templates from all repositories
		await this.discoverTemplates();
	}

	/**
	 * Discovers templates in all repositories
	 */
	private async discoverTemplates(): Promise<void> {
		const repositories = this.repositoryManager.getRepositories();

		for (const repo of repositories) {
			if (!repo.exists || repo.status !== 'ready') {
				this.addDiagnostic(repo.id, `Repository ${repo.displayName} is not ready`, 'warning');
				continue;
			}

			await this.loadTemplatesFromRepository(repo);
		}
	}

	/**
	 * Loads templates from a specific repository
	 */
	private async loadTemplatesFromRepository(repo: TemplateRepository): Promise<void> {
		try {
			// Check if templates.json exists
			const configUri = vscode.Uri.joinPath(repo.localUri, 'templates.json');

			try {
				await vscode.workspace.fs.stat(configUri);
			} catch {
				this.addDiagnostic(
					repo.id,
					`No templates.json found in repository ${repo.displayName}`,
					'info'
				);
				return;
			}

			// Read and parse templates.json
			const configContent = await fs.promises.readFile(configUri.fsPath, 'utf-8');
			const config = JSON.parse(configContent) as TemplateConfig;

			if (!config.templates || !Array.isArray(config.templates)) {
				this.addDiagnostic(
					repo.id,
					`Invalid templates.json structure in ${repo.displayName}`,
					'error'
				);
				return;
			}

			// Check for duplicate template names within the repository
			const templateNames = new Set<string>();
			for (const template of config.templates) {
				if (!template.name) {
					this.addDiagnostic(
						repo.id,
						`Template without name found in ${repo.displayName}`,
						'warning'
					);
					continue;
				}

				if (templateNames.has(template.name)) {
					this.addDiagnostic(
						repo.id,
						`Duplicate template name "${template.name}" in ${repo.displayName}`,
						'warning'
					);
					continue;
				}

				templateNames.add(template.name);
			}


			// Process and validate templates
			const validTemplates: Template[] = [];

			for (const template of config.templates) {
				if (this.validateTemplate(template, repo)) {
					// Add repository info to template
					const processedTemplate: Template = {
						...template,
						directory: repo.localPath,
						repositoryId: repo.id,
						repositoryName: repo.displayName
					};

					validTemplates.push(processedTemplate);

					// Track template name globally
					if (!this.templateNameMap.has(template.name)) {
						this.templateNameMap.set(template.name, new Set());
					}
					this.templateNameMap.get(template.name)!.add(repo.id);
				} else {
					this.addDiagnostic(
						repo.id,
						`Invalid template definition for "${template.name || 'unnamed'}"`,
						'warning'
					);
				}
			}

			// Store valid templates
			if (validTemplates.length > 0) {
				this.templates.set(repo.id, validTemplates);
				this.addDiagnostic(
					repo.id,
					`Loaded ${validTemplates.length} templates from ${repo.displayName}`,
					'info'
				);
			} else {
				this.addDiagnostic(
					repo.id,
					`No valid templates found in ${repo.displayName}`,
					'warning'
				);
			}
		} catch (error) {
			this.addDiagnostic(
				repo.id,
				`Failed to load templates from ${repo.displayName}: ${error instanceof Error ? error.message : String(error)}`,
				'error'
			);
		}
	}

	/**
	 * Validates a template definition
	 */
	private validateTemplate(template: Template, repo: TemplateRepository): boolean {
		// Check required fields
		if (!template.name || !Array.isArray(template.files) || template.files.length === 0) {
			return false;
		}

		// Validate files
		for (const file of template.files) {
			if (!file.source || !file.destination) {
				return false;
			}

			// Check if source file exists
			const sourcePath = path.join(repo.localPath, file.source);
			if (!fs.existsSync(sourcePath)) {
				this.addDiagnostic(
					repo.id,
					`Template "${template.name}" references non-existent file: ${file.source}`,
					'warning'
				);
				return false;
			}
		}

		// Validate parameters
		if (template.parameters) {
			for (const param of template.parameters) {
				if (!param.name || !param.displayName || !param.type) {
					return false;
				}

				// Check selection options
				if (param.type === 'selection' && (!param.options || !Array.isArray(param.options) || param.options.length === 0)) {
					return false;
				}

				// Check pattern
				if (param.pattern) {
					try {
						new RegExp(param.pattern);
					} catch {
						return false;
					}
				}
			}
		}

		return true;
	}

	/**
	 * Adds a diagnostic message
	 */
	private addDiagnostic(repositoryId: string, message: string, level: 'info' | 'warning' | 'error'): void {
		this.diagnostics.push({ repositoryId, message, level });

		// Also log to console
		switch (level) {
			case 'info':
				console.log(`[Template Manager] ${message}`);
				break;
			case 'warning':
				console.warn(`[Template Manager] ${message}`);
				break;
			case 'error':
				console.error(`[Template Manager] ${message}`);
				break;
		}
	}

	/**
	 * Gets all available templates
	 */
	public getAllTemplates(): Template[] {
		const result: Template[] = [];
		for (const templates of this.templates.values()) {
			result.push(...templates);
		}
		return result;
	}

	/**
	 * Gets templates from a specific repository
	 */
	public getTemplatesFromRepository(repositoryId: string): Template[] {
		return this.templates.get(repositoryId) || [];
	}

	/**
	 * Gets templates by category
	 */
	public getTemplatesByCategory(): Map<string, Template[]> {
		const result = new Map<string, Template[]>();

		// Add "All" category
		result.set("All", this.getAllTemplates());

		// Group by category
		for (const template of this.getAllTemplates()) {
			const category = template.category || 'Uncategorized';

			if (!result.has(category)) {
				result.set(category, []);
			}

			result.get(category)?.push(template);
		}

		return result;
	}

	/**
	 * Gets a specific template by name and repository ID
	 */
	public getTemplate(name: string, repositoryId: string): Template | undefined {
		const repoTemplates = this.templates.get(repositoryId);
		if (!repoTemplates) {
			return undefined;
		}

		return repoTemplates.find(t => t.name === name);
	}

	/**
	 * Gets diagnostics information
	 */
	public getDiagnostics(): Array<{repositoryId: string, message: string, level: 'info' | 'warning' | 'error'}> {
		return [...this.diagnostics];
	}

	/**
	 * Refreshes templates from all repositories
	 */
	public async refresh(): Promise<void> {
		await this.initialize();
	}
}
