# Code Template Hub for VS Code

![GitHub](https://img.shields.io/github/license/JohannesPosch/Code-Template-Hub)
[![Version](https://img.shields.io/visual-studio-marketplace/v/johnnyp.codeTemplateHub.svg)](https://marketplace.visualstudio.com/items?itemName=johnnyp.codeTemplateHub)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/johnnyp.codeTemplateHub.svg)](https://marketplace.visualstudio.com/items?itemName=johnnyp.codeTemplateHub)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/johnnyp.codeTemplateHub.svg)](https://marketplace.visualstudio.com/items?itemName=johnnyp.codeTemplateHub)
[![Rating](https://img.shields.io/visual-studio-marketplace/stars/johnnyp.codeTemplateHub.svg)](https://marketplace.visualstudio.com/items?itemName=johnnyp.codeTemplateHub&ssr=false#review-details)

Ever found yourself copying and pasting the same boilerplate code structure over and over? Or struggled to maintain consistency across team projects when everyone has their own way of creating files? What if you could define a template once and everyone on your team could use it with just a few clicks?

**Code Template Hub** solves these challenges by turning your best code patterns into reusable templates that live in git repositories. Powered by the flexible [dot.js](https://olado.github.io/doT/index.html) templating engine, it offers:

- **Powerful variable system** with parameter inputs, computed values, and JavaScript expressions
- **Dynamic content generation** using conditional blocks, loops, and template functions
- **Project-level configuration** through VS Code settings for team-wide template sharing
- **Automatic updates** to keep templates current across your entire team

No more simple text substitution — create truly intelligent templates that adapt to your specific needs.

## Key Benefits

- **Project-specific templates**: Configure templates at the workspace level for consistent project structures
- **Automatic updates**: Templates refresh on startup, ensuring developers always use current versions
- **Team synchronization**: All team members can access the same templates without additional setup
- **Customizable generation**: Templates adapt to your needs with parameters and dynamic variables

## Getting Started

### Installation

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=johnnyp.codeTemplateHub)
2. Open VS Code settings and navigate to **Extensions > Code Template Hub**
3. Configure at least one template repository

### Repository Configuration

![Showcase Template Creation](media/codeTemplateHub_configureRepositories.gif)

Templates are stored in git repositories and can be configured at two levels:

**User Settings (global):**
```json
"codeTemplateHub.repositories": [
  {
    "url": "https://github.com/username/my-templates.git",
    "branch": "main",
    "name": "My Templates"
  },
  {
    "url": "https://github.com/company/private-templates.git",
    "token": "ghp_123456789abcdefghijklmnopqrstuvwxyz",
    "name": "Company Templates",
    "description": "Official company templates"
  },
  {
    "url": "git@github.com:team/shared-templates.git",
    "name": "Team Templates",
    "description": "Team-specific templates using SSH"
  }
]
```

**Workspace Settings (project-specific):**
```json
"codeTemplateHub.repositories": [
  {
    "url": "https://github.com/team/project-templates.git",
    "branch": "main",
    "name": "Project Templates"
  }
]
```

> **Note**:
> - Repositories are stored in the extension's global storage and are automatically deleted when removed from configuration.
> - The `token` property is only applicable for HTTPS repository URLs and has no effect on SSH URLs.
> - Authentication tokens are useful if you don't want to configure Git credentials on the local machine.

#### Repository Configuration Properties

| Property | Description | Required |
|----------|-------------|----------|
| `url` | Git repository URL (HTTPS or SSH) | Yes |
| `branch` | Branch to use (defaults to 'main') | No |
| `name` | Display name for the repository | No |
| `description` | Description of the repository | No |
| `token` | Authentication token for private repositories (HTTPS URLs only) | No |

### Author and Organization Information

Templates can include developer attribution information:

```json
"codeTemplateHub.author.firstName": "John",
"codeTemplateHub.author.lastName": "Doe",
"codeTemplateHub.author.email": "john.doe@example.com",
"codeTemplateHub.organization.name": "Acme Corporation"
```

You can also run **Code Template Hub: Configure Author Information** from the command palette.

![Showcase Author Configuration](media/codeTemplateHub_configureAuthor.gif)

## Using Templates

### Creating Files from Templates

1. Right-click in the Explorer or Editor
2. Select **New from Template ...**
3. Choose a template from the list
4. Enter values for any template parameters
5. Files will be created in the selected location

![Showcase Template Creation](media/codeTemplateHub_showcase.gif)

### Template Updates

Templates are updated automatically when VS Code starts. To refresh manually:

- Run **Code Template Hub: Refresh Templates** from the Command Palette
- Click the repository status icon in the status bar (`$(repo) Template Hub`)

<!-- IMAGE: Screenshot showing the refresh templates command in the command palette -->

## Creating Your Own Templates

### Repository Structure

A template repository needs:

1. A `templates.json` file in the root directory
2. Template files referenced in the configuration
3. Optional JavaScript files for advanced variable generation

```
/
├── templates.json
├── scripts/
│   └── variables.js
├── templates/
    ├── category1/
    │   └── template1.dot.js
    └── category2/
        └── template2.dot.js
```

<!-- IMAGE: Screenshot of a real template repository showing the file structure in VS Code or GitHub -->

### templates.json Format

The `templates.json` file defines all available templates:

```json
{
  "$schema": "https://github.com/JohannesPosch/Code-Template-Hub/raw/refs/heads/master/templates-file-schema.json",
  "templates": [
    {
      "name": "Component Template",
      "description": "Create a new component with supporting files",
      "icon": "code",
      "category": "Frontend",
      "files": [
        {
          "source": "templates/component.dot.js",
          "destination": "{{= data.name }}/{{= data.name }}.js"
        },
        {
          "source": "templates/styles.dot.js",
          "destination": "{{= data.name }}/styles.css"
        }
      ],
	  "variablesScript": "scripts/variables.js",
      "variables": [
        {
          "name": "className",
          "description": "CSS class name",
          "value": "utils.toKebabCase(data.name)",
          "type": "js"
        }
      ],
      "parameters": [
        {
          "name": "name",
          "displayName": "Component Name",
          "description": "Name of the component",
          "type": "string",
          "required": true,
          "pattern": "^[A-Z][a-zA-Z0-9]*$",
          "patternErrorMessage": "Component name must be in PascalCase"
        },
        {
          "name": "includeTests",
          "displayName": "Include Tests",
          "description": "Add test files",
          "type": "boolean",
          "default": false
        },
        {
          "name": "styleType",
          "displayName": "Styling Method",
          "description": "Choose styling approach",
          "type": "selection",
          "default": "css",
          "options": [
            {"value": "css", "label": "CSS Modules"},
            {"value": "styled", "label": "Styled Components"},
            {"value": "tailwind", "label": "Tailwind CSS"}
          ]
        }
      ]
    }
  ]
}
```

### Template Configuration Properties

#### Template Properties

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Display name of the template (must be unique within a repository) | Yes |
| `description` | Description of what the template creates | Yes |
| `icon` | Icon to display ([VS Code codicon name](https://microsoft.github.io/vscode-codicons/dist/codicon.html)) | No |
| `category` | Category for grouping templates | No |
| `files` | Array of files to create | Yes |
| `parameters` | Array of parameters to collect from user | No |
| `variables` | Array of custom variables computed from parameters | No |
| `variablesScript` | Path to a JavaScript file that generates custom variables (relative to repo root) | No |
| `variablesFunction` | Name of the function to call in the variables script (default: 'generateVariables') | No |

#### File Properties

| Property | Description | Required |
|----------|-------------|----------|
| `source` | Source path within the repository (relative to repo root) | Yes |
| `destination` | Destination path (uses dot.js templating syntax) | Yes |
| `process` | Whether to process this file with dot.js (default: true) | No |

#### Parameter Properties

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Parameter name (for use in templates) | Yes |
| `displayName` | Display name shown in UI | Yes |
| `description` | Description of the parameter | No |
| `type` | Type of parameter: 'string', 'boolean', 'selection' or 'select_many' | Yes |
| `default` | Default value | No |
| `required` | Whether the parameter is required (for string type) | No |
| `pattern` | Validation regex pattern (for string type) | No |
| `patternErrorMessage` | Error message for invalid pattern | No |
| `options` | Options for selection type (array of {value, label} objects) | For selection type |
| `visibleIf` | Javascript expression to evaluate whether the parameter is shown (default: true) | No |

#### Custom Variable Properties

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Name of the variable | Yes |
| `description` | Description of the variable | No |
| `value` | JavaScript expression or dot.js template | Yes |
| `type` | Type of evaluation: 'js' or 'dotjs' (default: 'js') | No |

## Template Generation

![Template Processing Workflow](media/flow.png)

Code Template Hub processes templates through a series of steps, with variables calculated and made available at each stage. This system provides powerful customization possibilities for your templates.

### Template Processing Flow

1. **Parameter Collection**: User is prompted for input parameters defined in the template
2. **Script Variables**: Variables in the variablesScript file are evaluated
3. **Inline Variables**: JavaScript and dot.js variables in the template.json are processed
4. **Template Processing**: Template files are processed with all available variables
5. **File Generation**: Final files are created at the specified location

At each step, variables defined in previous steps are available. For example, parameters can access previous parameters, script variables can access user parameters, and inline variables can access both parameters and script variables.

### Parameters

Parameters allow users to provide input during template generation, enabling dynamic customization of the generated files. Each parameter is defined in the `parameters` array of the template configuration. Here's how they work:

1. **User Input**: When creating files from a template, the user is prompted to provide values for the parameters.
2. **Validation**: Parameters can include validation rules, such as required fields or regex patterns.
3. **Dynamic Behavior**: Parameters can influence file content, file paths, or even visibility of other parameters.

#### Parameter Types

Parameters allow users to customize the generated files dynamically during template generation. Each parameter is defined in the `parameters` array of the template configuration and can have the following types:

##### String:
Accepts textual input from the user. It can include validation rules such as regex patterns to enforce specific formats (e.g., PascalCase for component names).
##### Boolean:
Represents a true/false value. Useful for toggling optional features like including test files.
##### Selection:
Provides a predefined list of options for the user to choose from. Each option includes a value and a label for better clarity.

```json
{
	"name": "framework",
	"displayName": "Frontend Framework",
	"description": "Choose your preferred JavaScript framework",
	"type": "selection",
	"default": "react",
	"options": [
		{"value": "react", "label": "React"},
		{"value": "vue", "label": "Vue.js"},
		{"value": "angular", "label": "Angular"},
		{"value": "svelte", "label": "Svelte"}
	]
}
```

In templates, you can access the selected value with `data.framework`, which will contain the value of the selected option (e.g., "react").

##### Select Many:
Provides a list of checkboxes for multiple selections. Unlike the selection type, each option value becomes a boolean property in the data object. This makes it easy to use condition checks in templates.

```json
{
	"name": "features",
	"displayName": "Select Features",
	"description": "Choose the features to include",
	"type": "select_many",
	"options": [
		{ "value": "auth", "label": "Authentication" },
		{ "value": "db", "label": "Database Integration" },
		{ "value": "api", "label": "API Integration" }
	]
}
```
In templates, you can access the selected value with `data.features.xxx`, which will contain the values of the options:

```javascript
{{? data.features.auth }}
// Authentication code
import { Auth } from './auth';
{{?}}

{{? data.features.api }}
// API integration code
import { API } from './api';
{{?}}
```

#### Conditional Visibility
The `visibleIf` property allows parameters to be conditionally displayed based on the evaluation of a JavaScript expression. This enables dynamic forms where the visibility of a parameter depends on the value of other parameters.

- **data**: Represents the current state of all parameters. You can access any parameter's value using `data.<parameterName>`.
- **context**: Provides additional contextual information, such as metadata or environment-specific details, that can be used to make decisions.

> **Important Note**: If a `visibleIf` condition is defined and evaluates to anything other than `true`, it is necessary to define a default value for the parameter. This ensures that the parameter has a valid value even when it is not visible. Avoid leaving the default value as `undefined`.

#### Example Parameter Definitions

```json
{
	"name": "includeTests",
	"displayName": "Include Tests",
	"description": "Add test files",
	"type": "boolean",
	"default": false
},
{
	"name": "testFramework",
	"displayName": "Test Framework",
	"description": "Choose the test framework",
	"type": "selection",
	"default": "jest",
	"options": [
		{"value": "jest", "label": "Jest"},
		{"value": "mocha", "label": "Mocha"}
	],
	"visibleIf": "data.includeTests === true"
}
```

In this example, the `testFramework` parameter is only visible if `includeTests` is set to `true`.


```json
"parameters": [
	{
		"name": "name",
		"displayName": "Component Name",
		"description": "Name of the component",
		"type": "string",
		"required": true,
		"pattern": "^[A-Z][a-zA-Z0-9]*$",
		"patternErrorMessage": "Component name must be in PascalCase"
	},
	{
		"name": "includeTests",
		"displayName": "Include Tests",
		"description": "Add test files",
		"type": "boolean",
		"default": false
	},
	{
		"name": "styleType",
		"displayName": "Styling Method",
		"description": "Name of the component",
		"type": "string",
		"required": true,
		"pattern": "^[A-Z][a-zA-Z0-9]*$",
		"patternErrorMessage": "Component name must be in PascalCase"
	},
	{
		"name": "includeTests",
		"displayName": "Include Tests",
		"description": "Add test files",
		"type": "boolean",
		"default": false
	},
	{
		"name": "styleType",
		"displayName": "Styling Method",
		"description": "Choose styling approach",
		"type": "selection",
		"default": "css",
		"options": [
			{"value": "css", "label": "CSS Modules"},
			{"value": "styled", "label": "Styled Components"},
			{"value": "tailwind", "label": "Tailwind CSS"}
		]
	}
]
```

### Custom Variables

Two methods are available for creating custom variables:

#### 1. Inline Variable Definitions

Define variables directly in the `templates.json` file:

```json
"variables": [
  {
    "name": "className",
    "description": "CSS class name derived from component name",
    "value": "utils.toKebabCase(data.name)",
    "type": "js"
  }
]
```

This supports two evaluation types:
- **JavaScript (`js`)**: JavaScript expressions with access to parameters and utilities
- **dot.js (`dotjs`)**: Template expressions with access to all parameters

#### 2. Script-Based Variables

For complex logic, use a dedicated JavaScript file:

```json
"variablesScript": "scripts/variables.js",
"variablesFunction": "generateVariables"  // Optional, defaults to "generateVariables"
```

Create a script that exports the specified function (or "generateVariables" by default):

```javascript
/**
 * Generate variables for templates
 * @param {Object} data - User parameters
 * @param {Object} utils - Utilities functions
 * @param {Object} context - Additional context
 * @returns {Object} - Custom variables
 */
function generateVariables(data, utils, context) {
  const { name } = data;
  const { utils } = context;

  return {
    "camelName": utils.toCamelCase(name),
    "pascalName": utils.toPascalCase(name),
    "kebabName": utils.toKebabCase(name)
  };
}

module.exports = {
  generateVariables
}
```

The script function:
- Can be asynchronous (using `async/await`)
- Can make HTTP requests with `fetch` to incorporate external data
- Has access to all parameters and built-in utilities
- Can return simple values or complex objects

<!-- GIF: Animation showing the creation of a custom variable script and how it affects generated templates -->

#### Script Function Interface

The function in the variables script should implement this interface:

```typescript
/**
 * Generate custom variables for template
 *
 * @param params - All user parameters and built-in variables
 * @param context - Additional context information
 * @returns Dictionary with string keys and any values
 */
function generateVariables(
  params: Record<string, any>,
  utils: UtilityFunctions;
  context: {
    workspaceDir?: string;
    executionDir: string;
    templateDir: string;
  }
): Record<string, any> | Promise<Record<string, any>>;
```

The function:
- Can be synchronous or asynchronous (returning a Promise)
- Must return an object with string keys
- Values can be of any type (string, number, boolean, array, object, etc.)
- Has access to all parameters and built-in context
### Available Data and Utilities

#### Variable Data Reference

| Variable Source | Inline JS | Inline dot.js | Script Function |
|-----------------|-----------|---------------|----------------|
| **User Parameters** | `data.paramName` | `{{= data.paramName }}` | `params.paramName` |
| **Author Info** | `data.author.firstName`<br>`data.author.lastName`<br>`data.author.email`<br>`data.author.fullName` | `{{= data.author.firstName }}` | `params.author.firstName` |
| **Organization Info** | `data.organization.name` | `{{= data.organization.name }}` | `params.organization.name` |
| **Date** | `data.date` | `{{= data.date }}` | `params.date` |
| **Utilities** | `utils.functionName()` | N/A | `utils.functionName()` |
| **Context Info** | `context.workspaceDir`<br>`context.executionDir`<br>`context.templateDir` | N/A | `context.workspaceDir`<br>`context.executionDir`<br>`context.templateDir` |

#### Context Information Reference

The context information provides important path references:

| Path Variable | Description |
|---------------|-------------|
| `workspaceDir` | The current VS Code workspace directory |
| `executionDir` | The directory where the template is being created |
| `templateDir` | The directory of the template in the repository |

These paths can be used in both inline JS variables and script-based variables. For example:
- Use `workspaceDir` to find configuration files in the project root
- Use `executionDir` to determine relative paths for imports
- Use `templateDir` to reference other files in the template

#### Available Utility Functions

```javascript
utils = {
  // String transformations
  toCamelCase: (str) => /* Convert to camelCase */,
  toPascalCase: (str) => /* Convert to PascalCase */,
  toSnakeCase: (str) => /* Convert to snake_case */,
  toKebabCase: (str) => /* Convert to kebab-case */,

  // File path utilities
  joinPath: (...parts) => /* Join path parts */,
  resolvePath: (p) => /* Resolve path */,
  getBasename: (p, ext) => /* Get file basename */,
  getDirname: (p) => /* Get directory name */,
  getExtname: (p) => /* Get file extension */,

  // Date formatting
  formatDate: (date, format) => /* Format date */,

  // ID generation
  generateUUID: () => /* Generate a UUID */
}
```

### Available Template Variables

Apart from user-defined parameters and custom variables, these built-in variables are available:

#### Author Information

| Variable | Description |
|----------|-------------|
| `data.author.firstName` | Author's first name |
| `data.author.lastName` | Author's last name |
| `data.author.email` | Author's email address |
| `data.author.fullName` | Author's full name (first + last) |

#### Organization Information

| Variable | Description |
|----------|-------------|
| `data.organization.name` | Organization name |

#### Date Information

The native JavaScript `Date` object is provided directly in templates as `data.date`. You can use all standard date methods:

```javascript
// Examples of using the date object in templates
const year = {{= data.date.getFullYear() }};
const month = {{= data.date.getMonth() + 1 }}; // JavaScript months are 0-indexed
const day = {{= data.date.getDate() }};

// Formatting dates
const isoDate = {{= data.date.toISOString() }};
const formattedDate = {{= data.date.toLocaleDateString() }};
const formattedTime = {{= data.date.toLocaleTimeString() }};
```

### Template File Syntax

Template files use dot.js syntax. Here's a basic example:

```javascript
/**
 * {{=data.name}} Component
 * @author {{=data.author.fullName}} <{{=data.author.email}}>
 * @created {{=data.date.toLocaleDateString()}}
 */

{{? data.includeImport }}
import { Component } from 'library';
{{?}}

const {{=data.name}} = () => {
  return (
    <div className="{{= data.className }}">
      {{=data.name}} Component
    </div>
  );
};

export default {{=data.name}};
```

<!-- IMAGE: Sample of template output showing how variables are replaced -->

Common template syntax patterns:

- **Variable insertion**: `{{= data.variableName }}`
- **Conditional blocks**: `{{? condition }}...content...{{?}}`
- **Loops**: `{{~ data.items :item:index }}...{{~}}`
- **Expressions**: `{{= data.name.toUpperCase() }}`

### Template Destination Paths

The extension uses dot.js templating syntax for destination paths. The extension processes the destination path with the same templating engine used for file contents:

```json
"destination": "{{= data.category ? data.category + '/' : '' }}{{= data.name.toLowerCase() }}/index.ts"
```

This allows for conditional paths, transformations, and complex logic when determining where files should be created.

> **Note**: The `${name}` syntax is not supported for destination paths. Always use the dot.js syntax with `{{= ... }}`.

### Working with Parameter Values in Paths

You can access parameter properties in destination paths using dot.js syntax:

```json
"destination": "{{= data.name }}/{{= data.author.lastName }}-{{= data.name }}.tsx"
```

The dot.js approach gives you flexibility for transformations:
```json
"destination": "{{= data.name }}/{{= data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') }}.ts"
```

You can also use custom variables in destination paths:

```json
"destination": "{{= data.componentPath }}/{{= data.kebabName }}.{{= data.extension }}"
```

## Commands

| Command | Description |
|---------|-------------|
| `codeTemplateHub.createFromTemplate` | Create Files from Template |
| `codeTemplateHub.refreshTemplates` | Refresh Templates |
| `codeTemplateHub.showDiagnostics` | Show Template Diagnostics |
| `codeTemplateHub.configureAuthorInfo` | Configure Author Information |

<!-- IMAGE: Extension commands in the Command Palette -->

## Troubleshooting

### Diagnostics

If you're experiencing issues, use the **Code Template Hub: Show Template Diagnostics** command to view:

- Repository status and errors
- Available templates
- Warning and error messages

<!-- IMAGE: Diagnostics panel showing template repository information -->

### Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| Templates not appearing | Check repository configuration and run "Refresh Templates" |
| Authentication errors | Verify token or SSH keys for private repositories |
| Invalid template definition | Ensure templates.json structure is correct and all required fields are present |
| Custom variable errors | Check for syntax errors in variable expressions or scripts |

## Best Practices

### Organization & Structure

- Group related templates under meaningful categories
- Use project-level settings for team-wide consistency
- Keep templates focused on specific use cases
- Document templates and parameters clearly

### Variables & Customization

- Use inline variables for simple transformations
- Use script-based variables for complex logic
- Add descriptive comments to script files
- Use the provided utility functions where possible

<!-- IMAGE: Before/After showing how templates can improve code consistency -->
