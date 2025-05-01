import { TemplateFile } from './template-file';
import { TemplateParameter } from './template-parameter';

/**
 * Interface for a template group
 */
export interface Template
{
	/** Display name of the template */
	name: string;

	/** Description of what the template creates */
	description: string;

	/** Icon to display (codicon name, e.g. 'file-code') */
	icon?: string;

	/** Category for grouping templates */
	category?: string;

	/** Files that comprise this template */
	files: TemplateFile[];

	/** Parameters that can be provided to the template */
	parameters?: TemplateParameter[];

	/** Directory where the template is located */
	directory?: string;

	/** Repository ID where this template is from (added at runtime) */
	repositoryId?: string;

	/** Repository display name (added at runtime) */
	repositoryName?: string;
}
