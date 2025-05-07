import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as dot from 'dot';
import { Template } from './template';
import { TemplateParameter } from './template-parameter';
import { pathToFileURL } from 'url';

/**
 * Interface for template rendering parameters
 */
export interface TemplateRenderParams {
	[key: string]: any;
}

/**
 * Interface for author information
 */
export interface AuthorInfo
{
	/** The authors first name. */
	firstName: string;

	/** The authors last name. */
	lastName: string;

	/** The authors email address. */
	email: string;

	/** The authors full name. */
	fullName: string;
}

/**
 * Interface for organization information
 */
export interface OrganizationInfo
{
	/** The organizations name. */
	name: string;
}

/**
 * Class to handle template rendering
 */
export class TemplateRenderer {
	/**
	 * Constructor for template renderer
	 */
	constructor() {
		// Configure dot.js
		dot.templateSettings.strip = false;
		dot.templateSettings.varname = 'data';
	}

	/**
	 * Render a template to target location
	 * @param template The template to render
	 * @param targetDir The target directory
	 * @param params Parameters to pass to the template
	 */
	public async renderTemplate(
		template: Template,
		targetDir: string,
		params: TemplateRenderParams,
		context: {
			workspaceDir?: string;
			executionDir: string;
		}
	): Promise<string[]> {
		// Ensure template directory exists
		if (!template.directory) {
			throw new Error('Template directory is not defined');
		}

		// Ensure target directory exists
		await fs.promises.mkdir(targetDir, { recursive: true });

		// Add author information and date to parameters
		const baseParams = {
			...params,
			author: this.getAuthorInfo(),
			organization: this.getOrganizationInfo(),
			date: new Date()
		};

		// Generate custom variables - now we let errors propagate
		const enhancedParams = await this.generateCustomVariables(
			template,
			baseParams,
			context
		);

		const createdFiles: string[] = [];

		// Process each file in the template
		for (const file of template.files) {
			const sourcePath = path.join(template.directory, file.source);

			// Process destination path with parameters
			const destPath = this.processPath(file.destination, enhancedParams);
			if(destPath === undefined || !destPath.trim()){
				throw new Error(`Error destination path is empty`);
			}

			const fullDestPath = path.join(targetDir, destPath);

			// Ensure parent directory exists
			await fs.promises.mkdir(path.dirname(fullDestPath), { recursive: true });

			// Read source file content
			const sourceContent = await fs.promises.readFile(sourcePath, 'utf-8');

			// Process file content if needed
			const shouldProcess = file.process !== false; // Default to true
			let destContent: string;

			if (shouldProcess) {
				destContent = await this.processContent(sourceContent, enhancedParams);
			} else {
				destContent = sourceContent;
			}

			// Write processed content to destination
			await fs.promises.writeFile(fullDestPath, destContent, 'utf-8');

			createdFiles.push(fullDestPath);
		}

		return createdFiles;
	}

	/**
	 * Get author information from settings
	 */
	private getAuthorInfo(): AuthorInfo {
		const config = vscode.workspace.getConfiguration('codeTemplateHub.author');
		const firstName = config.get<string>('firstName', '');
		const lastName = config.get<string>('lastName', '');
		const email = config.get<string>('email', '');

		const fullName = firstName && lastName
			? `${firstName} ${lastName}`
			: firstName || lastName || '';

		return {
			firstName,
			lastName,
			email,
			fullName
		};
	}

	/**
	 * Get author information from settings
	 */
	private getOrganizationInfo(): OrganizationInfo {
		const config = vscode.workspace.getConfiguration('codeTemplateHub.organization');
		const name = config.get<string>('name', '');

		return {
			name
		};
	}

	/**
	 * Process a path string with parameters
	 */
	private processPath(pathTemplate: string, params: TemplateRenderParams): string {
		try {
			// Compile the template with dot.js
			const compiledTemplate = dot.template(pathTemplate);

			// Render with parameters
			return compiledTemplate(params);
		} catch (error) {
			throw new Error(`Error processing path template: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Process content with dot.js
	 */
	private async processContent(content: string, params: TemplateRenderParams): Promise<string> {
		try {
			// Compile template
			const compiledTemplate = dot.template(content);

			// Render with parameters
			return compiledTemplate(params);
		} catch (error) {
			throw new Error(`Error processing template: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Collect parameter values from user input
	 */
	public async collectParameters(
		template: Template,
		context: {
			workspaceDir?: string;  // Current workspace directory if any
			executionDir: string;   // Directory where command was executed
		}
	): Promise<TemplateRenderParams | undefined> {
		if (!template.parameters || template.parameters.length === 0) {
			return {};
		}

		let params: TemplateRenderParams = {};

		// Process parameters in order
		for (const param of template.parameters) {
			const value = await this.promptParameter(param, params, {
				utils: this.createUtilitiesObject(),
				workspaceDir: context.workspaceDir,
				executionDir: context.executionDir,
				templateDir: template.directory!
			});

			// User cancelled input
			if (value === undefined) {
				return undefined;
			}

			params = {
				...params,
				...value
			};
		}

		return params;
	}

	/**
	 * Prompt user for a parameter value
	 */
	private async promptParameter(
		param: TemplateParameter,
		params: TemplateRenderParams,
		context: {
			utils: any; // Utilities object for parameter processing;
			workspaceDir?: string;  // Current workspace directory if any
			executionDir: string;   // Directory where command was executed
			templateDir: string;   // Directory where the template is located
		}
	): Promise<TemplateRenderParams | undefined> {

		// Check if the parameter is visible based on the provided condition
		if (param.visibleIf) {

			// Create a function that evaluates the expression
			const condition = new Function(
				'data', 'context',
				`return (${param.visibleIf});`
			);

			// Execute the function
			const isVisible = condition(params, context);

			if (!isVisible) {
				return [{ key: param.name, value: param.default }];
			}
		}

		switch (param.type) {
			case 'string':
				return this.promptStringParameter(param);

			case 'boolean':
				return this.promptBooleanParameter(param);

			case 'selection':
				return this.promptSelectionParameter(param);

			case 'select_many':
				return this.promptSelectionManyParameter(param);

			default:
				throw new Error(`Unsupported parameter type: ${(param as any).type}`);
		}
	}

	/**
	 * Prompt for string parameter
	 */
	private async promptStringParameter(param: TemplateParameter): Promise<TemplateRenderParams | undefined> {
		const options: vscode.InputBoxOptions = {
			title: `Enter ${param.displayName}`,
			prompt: param.description,
			value: param.default?.toString() || '',
			validateInput: (value) => {
				if (param.required && !value.trim()) {
					return `${param.displayName} is required`;
				}

				if (param.pattern && value) {
					const regex = new RegExp(param.pattern);
					if (!regex.test(value)) {
						return param.patternErrorMessage || `Value doesn't match pattern: ${param.pattern}`;
					}
				}

				return null;
			}
		};

		return {
			[param.name]: await vscode.window.showInputBox(options)
		};
	}

	/**
	 * Prompt for boolean parameter
	 */
	private async promptBooleanParameter(param: TemplateParameter): Promise<TemplateRenderParams> {
		const result = await vscode.window.showQuickPick(
			[
				{ label: 'Yes', value: true },
				{ label: 'No', value: false }
			],
			{
				title: param.displayName,
				placeHolder: param.description,
				canPickMany: false
			}
		);

		return {
			[param.name]: result ? result.value : (param.default as boolean) || false
		};
	}

	/**
	 * Prompt for selection parameter
	 */
	private async promptSelectionParameter(param: TemplateParameter): Promise<TemplateRenderParams | undefined> {
		if (!param.options || param.options.length === 0) {
			throw new Error(`Selection parameter ${param.name} has no options`);
		}

		const items = param.options.map(opt => ({
			label: opt.label,
			value: opt.value
		}));

		const result = await vscode.window.showQuickPick(items, {
			title: param.displayName,
			placeHolder: param.description,
			canPickMany: false
		});

		return {
			[param.name]: result ? result.value : (param.default as string)
		};
	}

	private async promptSelectionManyParameter(param: TemplateParameter): Promise<TemplateRenderParams> {
		if(!param.options || param.options.length === 0) {
			throw new Error(`Selection parameter ${param.name} has no options`);
		}

		const items = param.options.map(opt => ({
			label: opt.label,
			value: opt.value
		}));

		const result = await vscode.window.showQuickPick(items, {
			title: param.displayName,
			placeHolder: param.description,
			canPickMany: true
		});

		// If no selection was made, return the values with their default values
		const unselectedOptions = param.options.filter(opt => !result?.some(res => res.value === opt.value));

		const resultValues: TemplateRenderParams = {};
		for (const opt of unselectedOptions) {
			resultValues[opt.value] = false;
		}

		if (result) {
			for (const res of result) {
				resultValues[res.value] = true;
			}
		}

		return { [param.name]: resultValues };
	}

	/**
	 * Process and generate custom variables for a template
	 */
	private async generateCustomVariables(
		template: Template,
		params: TemplateRenderParams,
		context: {
			workspaceDir?: string;  // Current workspace directory if any
			executionDir: string;   // Directory where command was executed
		}
	): Promise<TemplateRenderParams> {
		// Start with base parameters
		let enhancedParams = { ...params };

		// 1. Process script-based variables if specified
		if (template.variablesFn !== undefined) {

			// Create utilities object
			const utils = this.createUtilitiesObject();

			let scriptVariables;

			try	{
				scriptVariables = await template.variablesFn(params, {
					utils,
					workspaceDir: context.workspaceDir,
					executionDir: context.executionDir,
					templateDir: template.directory
				});
			} catch (error) {
				throw new Error(`Error executing variables function "${template.variablesFunction}": ${error}`);
			}

			// Validate the returned variables
			if (!scriptVariables || typeof scriptVariables !== 'object' || Array.isArray(scriptVariables)) {
				throw new Error(
					`Variables function "${template.variablesFunction}" did not return an object: ${typeof scriptVariables}`
					);
			}

			// Validate all keys are strings and values are non-undefined
			for (const key in scriptVariables) {
				if (typeof key !== 'string') {
					throw new Error(`Variable key from "${template.variablesFunction}" is not a string: ${key}`);
				}

				if (scriptVariables[key] === undefined) {
					throw new Error(`Variable "${key}" from "${template.variablesFunction}" has undefined value`);
				}
			}

			// Merge script variables into parameters
			enhancedParams = {
				...enhancedParams,
				...scriptVariables
			};
		}

		// 2. Process inline variables if specified
		if (template.variables && template.variables.length > 0) {
			for (const variable of template.variables) {
				let value;

				try {
					if (variable.type === "dotjs") {
						// Process with dot.js
						const compiledTemplate = dot.template(variable.value);
						value = compiledTemplate(enhancedParams);
					} else {
						// Process with JavaScript
						const utils = this.createUtilitiesObject();

						// Create a function that evaluates the expression
						const evalFn = new Function(
							'data', 'context',
							`return (${variable.value});`
						);

						// Execute the function
						value = evalFn(
							enhancedParams, {
								utils,
								workspaceDir: context.workspaceDir,
								executionDir: context.executionDir,
								templateDir: template.directory
							}
						);
					}
				} catch (error) {
					throw new Error(`Error evaluating variable "${variable.name}": ${error}`);
				}

				// Check for undefined values
				if (value === undefined) {
					throw new Error(`Variable "${variable.name}" evaluated to undefined`);
				}

				// Add the variable to the enhanced parameters
				enhancedParams[variable.name] = value;
			}
		}

		return enhancedParams;
	}

	/**
	 * Create utilities object for variable scripts
	 */
	private createUtilitiesObject() {
		return {
			// String transformations
			toCamelCase: (str: string) => str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase()),
			toPascalCase: (str: string) => {
				return str
				.replace(/^([a-z])|-([a-z])/g, (g) => g.replace(/^-/, '').toUpperCase())
				.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase());
			},
			toSnakeCase: (str: string) => {
				return str
				.replace(/([A-Z])/g, (g) => '_' + g.toLowerCase())
				.replace(/^_/, '')
				.replace(/[-\s]+/g, '_');
			},
			toKebabCase: (str: string) => {
				return str
				.replace(/([A-Z])/g, (g) => '-' + g.toLowerCase())
				.replace(/^-/, '')
				.replace(/[_\s]+/g, '-');
			},

			// File path utilities
			joinPath: (...parts: string[]) => path.join(...parts),
			resolvePath: (p: string) => path.resolve(p),
			getBasename: (p: string, ext?: string) => path.basename(p, ext),
			getDirname: (p: string) => path.dirname(p),
			getExtname: (p: string) => path.extname(p),

			// Date formatting
			formatDate: (date: Date, format: string) => {
				return format.replace(/yyyy|MM|dd|HH|mm|ss/g, (match) => {
					switch (match) {
						case 'yyyy': return date.getFullYear().toString();
						case 'MM': return String(date.getMonth() + 1).padStart(2, '0');
						case 'dd': return String(date.getDate()).padStart(2, '0');
						case 'HH': return String(date.getHours()).padStart(2, '0');
						case 'mm': return String(date.getMinutes()).padStart(2, '0');
						case 'ss': return String(date.getSeconds()).padStart(2, '0');
						default: return match;
					}
				});
			},

			// Other utilities
			generateUUID: () => {
				// Simple UUID v4 implementation
				return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
					const r = Math.random() * 16 | 0;
					return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
				});
			},

			// Workspace utilities
			getWorkspaceFiles: async (pattern: string, workspaceDir: string) => {
				if (!workspaceDir) { return []; }
				// This could use VS Code API or glob pattern to find files
				// For example: glob.sync(pattern, { cwd: workspaceDir })
				return []; // Placeholder
			},

			// Content analysis
			findInFiles: async (pattern: string, workspaceDir: string) => {
				// Placeholder for file content search functionality
				return [];
			}
		};
	}
}
