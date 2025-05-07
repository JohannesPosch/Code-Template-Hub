
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as dot from 'dot';

import * as vm from 'vm';
import { pathToFileURL } from 'url';
import { Template } from './template';
import { TemplateConfig } from './template-config';
import { TemplateRepositoryManager } from '../repository/template-repository-manager';
import { TemplateRepository } from '../repository/template-repository';
import { REPL_MODE_STRICT } from 'repl';
import { error } from 'console';

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
				if (await this.validateTemplate(template, repo)) {
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
	private async validateTemplate(template: Template, repo: TemplateRepository): Promise<boolean> {
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

				// Check selection options
				if (param.type === 'selectionMany' && (!param.options || !Array.isArray(param.options) || param.options.length === 0)) {
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

		// Validate variables
		if (template.variables) {
			if (!Array.isArray(template.variables)) {
				this.addDiagnostic(
					repo.id,
					`Template "${template.name}" has invalid variables property (must be an array)`,
					'warning'
				);
				return false;
			}

			for (const variable of template.variables) {
				// Check required fields
				if (!variable.name || !variable.value) {
					this.addDiagnostic(
						repo.id,
						`Template "${template.name}" has invalid variable definition (missing name or value)`,
						'warning'
					);
					return false;
				}

				// Check variable type if specified
				if (variable.type && !['js', 'dotjs'].includes(variable.type)) {
					this.addDiagnostic(
						repo.id,
						`Template "${template.name}" has invalid variable type: ${variable.type} (must be 'js' or 'dotjs')`,
						'warning'
					);
					return false;
				}

				// Validate dot.js by attempting to compile
				if (variable.type === 'dotjs') {
					try {
						// Try to compile the template
						dot.template(variable.value);
					} catch (error) {
						this.addDiagnostic(
							repo.id,
							`Template "${template.name}" has invalid dot.js syntax in variable "${variable.name}": ${error}`,
							'warning'
						);
						return false;
					}
				} else {
					// Basic JS syntax validation
					try {
						// Use Function constructor to check syntax
						// This doesn't execute the code, just checks syntax
						new Function(`return (${variable.value});`);
					} catch (error) {
						this.addDiagnostic(
							repo.id,
							`Template "${template.name}" has invalid JavaScript syntax in variable "${variable.name}": ${error}`,
							'warning'
						);
						return false;
					}
				}
			}
		}

		// Validate variablesScript if specified
		if (template.variablesScript) {
			if (typeof template.variablesScript !== 'string') {
				this.addDiagnostic(
					repo.id,
					`Template "${template.name}" has invalid variablesScript property (must be a string)`,
					'warning'
				);
				return false;
			}

			// Check if script file exists
			const scriptPath = path.join(repo.localPath, template.variablesScript);
			if (!fs.existsSync(scriptPath)) {
				this.addDiagnostic(
					repo.id,
					`Template "${template.name}" references non-existent variables script: ${template.variablesScript}`,
					'warning'
				);
				return false;
			}

			// Check if script file is JavaScript
			if (!scriptPath.endsWith('.js') && !scriptPath.endsWith('.cjs') && !scriptPath.endsWith('.mjs')) {
				this.addDiagnostic(
					repo.id,
					`Template "${template.name}" references a non-JavaScript file for variables script: ${template.variablesScript}`,
					'warning'
				);
				return false;
			}

			let variablesFunction = 'generateVariables';

			// If a specific function is specified, validate it
			if (template.variablesFunction) {
				if (typeof template.variablesFunction !== 'string') {
					this.addDiagnostic(
						repo.id,
						`Template "${template.name}" has invalid variablesFunction property (must be a string)`,
						'warning'
					);
					return false;
				}

				variablesFunction = template.variablesFunction;
			}

			// Now check the function prototype.
			const fnValid = await this.validateVariablesFunction(
				scriptPath,
				variablesFunction, // Default function name
				template.name,
				repo.id
			);

			// Just log info if default function not found, don't fail validation
			if (!fnValid) {
				this.addDiagnostic(
					repo.id,
					`Template "${template.name}": No 'generateVariables' function found in script.`,
					'info'
				);
				return false;
			}

			// Now that it is sure, that the variables function exists and is valid, load it and attach it.
			template.variablesFn = await this.loadFunction(scriptPath, variablesFunction, template.name, repo.id);
		}

		return true;
	}

	/**
	 * Validates that a function exists in a script file and has the expected signature
	 */
	private async validateVariablesFunction(
		scriptPath: string,
		functionName: string,
		templateName: string,
		repoId: string
	): Promise<boolean> {
		try {
			// Load the function by the name from the file and check if it is available.
			const fn = await this.loadFunction(scriptPath, functionName, templateName, repoId);
			if(fn === undefined)
			{
				// Not available, therefore return false.
				return false;
			}

			// Now check the amount of arguments
			if(fn.length !== 2)
			{
				// Error, invalid amount of arguments in the function
				this.addDiagnostic(
					repoId,
					`Template "${templateName}": Function "${functionName}" must take exactly 2 parameters, but got ${fn.length}.`,
					'warning');
				return false;
			}

			return true;
		} catch (error) {
			this.addDiagnostic(
				repoId,
				`Template "${templateName}": Error validating function "${functionName}": ${error}`,
				'warning'
			);
			return false;
		}
	}

	private async loadFunction(
		scriptPath: string,
		functionName: string,
		templateName: string,
		repoId: string
	): Promise<Function | undefined> {
		// Get the full path of the script file
		const fullPath = path.resolve(scriptPath);

		// Check whether the file exists
		if (!fs.existsSync(fullPath)) {
			this.addDiagnostic(
				repoId,
				`Template "${templateName}": Cannot find the variables sciprt file at: ${fullPath}`,
				'warning');
			return;
		}

		try {
			// Read the content of the script & compile it to something executable.
			const code = fs.readFileSync(fullPath, 'utf8');
			const script = new vm.Script(code, { filename: fullPath });

			const module = { exports: {} };
			const context = vm.createContext({ module, exports: module.exports, require, fetch });
			script.runInContext(context);

			// We expect module.exports to be an object with named functions
			const exported = module.exports;

			// If it's directly a function (default export case)
			if (typeof exported === 'function') {
				// We can only return this if functionName matches its name (if known)
				if (exported.name === functionName) {
					return exported;
				} else {
					this.addDiagnostic(
						repoId,
						`Template "${templateName}": Exported function does not match the expected name "${functionName}".`,
						'warning');
					return;
				}
			}

			// If it's an object, look up the named function
			if (typeof exported === 'object' && exported !== null) {
				const fn = (exported as Record<string, unknown>)[functionName];
				if (typeof fn === 'function') {
					return fn;
				} else {
					this.addDiagnostic(
						repoId,
						`Template "${templateName}": Function "${functionName}" not found or not a function in script.`,
						'warning');
					return;
				}
			}

			// If it's neither a function nor an object, it's invalid
			this.addDiagnostic(
				repoId,
				`Template "${templateName}": Script did not export a valid function or object.`,
				'warning');
			return;

		} catch (error) {
			this.addDiagnostic(
				repoId,
				`Template "${templateName}": Failed to load custom variables function: ${error}`,
				'warning');
			return;
		}
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
