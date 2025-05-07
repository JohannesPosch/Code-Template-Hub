/**
 * Interface for template parameter
 */
export interface TemplateParameter
{
	/** Parameter name (for use in templates) */
	name: string;

	/** Display name shown in UI */
	displayName: string;

	/** Description of the parameter */
	description?: string;

	/** Type of parameter (string, boolean, selection) */
	type: 'string' | 'boolean' | 'selection' | 'selectionMany';

	/** Default value */
	default?: string | boolean;

	/** Options for selection type */
	options?: Array<{value: string, label: string}>;

	/** Whether the parameter is required */
	required?: boolean;

	/** Pattern for validation (regex string) */
	pattern?: string;

	/** Error message for invalid pattern */
	patternErrorMessage?: string;

	/** Function to evaluate whether the parameter shall be displayed to the user. (default: true) */
	visibleIf?: string;
}
