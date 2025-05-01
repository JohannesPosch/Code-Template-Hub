/**
 * Interface for a single template file
 */
export interface TemplateFile
{
	/** Source path within the repository (relative to repo root) */
	source: string;

	/** Destination path pattern (can include variables like ${name}) */
	destination: string;

	/** Whether to process this file with dot.js (default: true) */
	process?: boolean;
}
