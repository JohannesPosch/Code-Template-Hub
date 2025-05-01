/**
 * Represents a template repository configuration
 */
export interface TemplateRepositoryConfig
{
	/** Git repository URL */
	url: string;

	/** Branch to use (defaults to 'main') */
	branch?: string;

	/** Display name for the repository (optional) */
	name?: string;

	/** Description of the repository (optional) */
	description?: string;

	/** Authentication token (optional) */
	token?: string;
};
