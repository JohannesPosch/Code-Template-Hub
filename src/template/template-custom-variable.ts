/**
 * Interface for a custom variable.
 */
export interface TemplateCustomVariable
{
	/** The name of the variable. */
	name: string;

	/** A description of the variable (optional). */
	description?: string;

	/** JavaScript expression or dot.js template */
	value: string;

	/** Type of evaluation (default: "js") */
	type?: "js" | "dotjs";
}
