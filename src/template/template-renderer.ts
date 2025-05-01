import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as dot from 'dot';
import { Template } from './template';
import { TemplateParameter } from './template-parameter';

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
		params: TemplateRenderParams
	): Promise<string[]> {
		// Ensure template directory exists
		if (!template.directory) {
			throw new Error('Template directory is not defined');
		}

		// Ensure target directory exists
		await fs.promises.mkdir(targetDir, { recursive: true });

		// Add author information to parameters
		const authorInfo = this.getAuthorInfo();
		const enhancedParams = {
			...params,
			author: authorInfo,
			date: new Date()
		};

		const createdFiles: string[] = [];

		// Process each file in the template
		for (const file of template.files) {
			const sourcePath = path.join(template.directory, file.source);

			// Process destination path with parameters
			const destPath = this.processPath(file.destination, enhancedParams);
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
		template: Template
	): Promise<TemplateRenderParams | undefined> {
		if (!template.parameters || template.parameters.length === 0) {
			return {};
		}

		const params: TemplateRenderParams = {};

		// Process parameters in order
		for (const param of template.parameters) {
			const value = await this.promptParameter(param);

			// User cancelled input
			if (value === undefined) {
				return undefined;
			}

			params[param.name] = value;
		}

		return params;
	}

	/**
	 * Prompt user for a parameter value
	 */
	private async promptParameter(param: TemplateParameter): Promise<any | undefined> {
		switch (param.type) {
			case 'string':
				return this.promptStringParameter(param);

			case 'boolean':
				return this.promptBooleanParameter(param);

			case 'selection':
				return this.promptSelectionParameter(param);

			default:
				throw new Error(`Unsupported parameter type: ${(param as any).type}`);
		}
	}

	/**
	 * Prompt for string parameter
	 */
	private async promptStringParameter(param: TemplateParameter): Promise<string | undefined> {
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

		return vscode.window.showInputBox(options);
	}

	/**
	 * Prompt for boolean parameter
	 */
	private async promptBooleanParameter(param: TemplateParameter): Promise<boolean> {
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

		return result ? result.value : (param.default as boolean) || false;
	}

	/**
	 * Prompt for selection parameter
	 */
	private async promptSelectionParameter(param: TemplateParameter): Promise<string | undefined> {
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

		return result ? result.value : (param.default as string);
	}
}
