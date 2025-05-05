# Code Template Hub Extension for VS Code

Code Template Hub is a powerful VS Code extension that lets you create, manage, and reuse your own code templates with ease. Whether you're scaffolding boilerplate code, setting up project structures, or just tired of copying and pasting from old files — this extension saves you time and keeps your workflow clean.

With an intuitive interface and customizable storage, you can quickly insert templates into any project, organize them by category, and share them across teams. Works seamlessly across languages and project types.

## Overview

Code Template Hub is a powerful VS Code extension that helps you quickly create files from templates stored in git repositories. Using the [dot.js](https://olado.github.io/doT/index.html) templating engine, you can create sophisticated templates with dynamic content based on user input and predefined variables.

- **Repository-based**: Templates are stored in git repositories, allowing for version control and sharing across teams
- **Flexible templating**: Use dot.js templating syntax for powerful and flexible templates
- **Template Explorer**: Browse templates in a structured tree view
- **Customizable parameters**: Define parameters for your templates to collect user input with validation
- **Custom variables**: Generate advanced variables based on input parameters using dot.js expressions or JavaScript functions
- **Automatic cleanup**: Repositories are automatically cleaned up when removed from configuration
- **Author Information**: Include developer attribution in generated files
- **Multi-Repository Support**: Organize templates across multiple repositories

## Installation

1. Install the extension from the VS Code Marketplace
2. Configure at least one template repository (see below)

## Configuration

### Template Repositories

Templates are pulled from git repositories. To configure repositories:

1. Open VS Code settings
2. Navigate to Extensions > Code Template Hub
3. Add repositories to the "Repositories" setting

Example configuration:

```json
"codeTemplateHub.repositories": [
  {
    "url": "https://github.com/username/my-templates.git",
    "branch": "main",
    "name": "My Templates",
    "description": "Common templates for personal projects"
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

> **Note**:
> - Repositories are stored in the extension's global storage and are automatically deleted when removed from configuration.
> - The `token` property is only applicable for HTTPS repository URLs and has no effect on SSH URLs.
> - Authentication tokens are useful if you don't want to configure Git credentials on the local machine.

Configuration options:

| Property | Description | Required |
|----------|-------------|----------|
| `url` | Git repository URL (HTTPS or SSH) | Yes |
| `branch` | Branch to use (defaults to 'main') | No |
| `name` | Display name for the repository | No |
| `description` | Description of the repository | No |
| `token` | Authentication token for private repositories (HTTPS URLs only) | No |

### Author Information

Templates can include author information. To configure:

1. Run the command "Code Template Hub: Configure Author Information"
2. Enter your first name, last name, and email address

Or manually configure in settings:

```json
"codeTemplateHub.author.firstName": "John",
"codeTemplateHub.author.lastName": "Doe",
"codeTemplateHub.author.email": "john.doe@example.com"
```

### Organization Information

You can also configure organization information for use in templates:

```json
"codeTemplateHub.organization.name": "Acme Corporation"
```

## Using Templates

### Creating Files from Templates

1. Right-click in the Explorer or Editor
2. Select "Create Files from Template"
3. Choose a template from the displayed list (organized by category)
4. Enter values for any template parameters
5. Files will be created in the selected location

### Refreshing Templates

To update templates from their repositories:

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run "Code Template Hub: Refresh Templates"

Alternatively, click on the repository status icon in the status bar (shows as "$(repo) Template Hub").

## Creating Your Own Templates

### Repository Structure

A template repository should contain:

1. A `templates.json` file in the root directory
2. Template files referenced in the configuration
3. Optional JavaScript files for advanced variable generation

Example repository structure:

```
/
├── templates.json
├── scripts/
│   ├── react-variables.js
│   └── api-variables.js
├── templates/
│   ├── react/
│   │   ├── component.dot.js
│   │   ├── styles.dot.js
│   │   └── index.dot.js
│   ├── cpp/
│   │   ├── class.dot.js
│   │   └── header.dot.js
```

### templates.json Format

The `templates.json` file defines all available templates:

```json
{
  "templates": [
    {
      "name": "React Component",
      "description": "Create a new React functional component with styles",
      "icon": "react",
      "category": "React",
      "files": [
        {
          "source": "templates/react/component.dot.js",
          "destination": "{{= data.name }}/{{= data.name }}.tsx"
        },
        {
          "source": "templates/react/styles.dot.js",
          "destination": "{{= data.name }}/{{= data.name }}.module.css"
        },
        {
          "source": "templates/react/index.dot.js",
          "destination": "{{= data.name }}/index.ts"
        }
      ],
      "variables": [
        {
          "name": "componentPath",
          "description": "Path adjusted based on component type",
          "value": "data.componentType === 'page' ? 'pages' : 'components'",
          "type": "js"
        },
        {
          "name": "className",
          "description": "CSS class name derived from component name",
          "value": "utils.toKebabCase(data.name)",
          "type": "js"
        },
        {
          "name": "importStatement",
          "description": "Import statement based on settings",
          "value": "import React{{? data.useHooks }}, { useState, useEffect }{{?}} from 'react';",
          "type": "dotjs"
        }
      ],
      "parameters": [
        {
          "name": "name",
          "displayName": "Component Name",
          "description": "Name of the component (PascalCase)",
          "type": "string",
          "required": true,
          "pattern": "^[A-Z][a-zA-Z0-9]*$",
          "patternErrorMessage": "Component name must be in PascalCase"
        },
        {
          "name": "withHooks",
          "displayName": "Include React Hooks",
          "description": "Add useState and useEffect hooks",
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
    },
    {
      "name": "Express API Endpoint",
      "description": "Create an Express API endpoint with models and tests",
      "icon": "server",
      "category": "Backend",
      "variablesScript": "scripts/api-variables.js",
      "parameters": [
        {
          "name": "entityName",
          "displayName": "Entity Name",
          "type": "string",
          "required": true
        },
        {
          "name": "methods",
          "displayName": "API Methods",
          "type": "selection",
          "options": [
            {"value": "get", "label": "GET"},
            {"value": "post", "label": "POST"},
            {"value": "put", "label": "PUT"},
            {"value": "delete", "label": "DELETE"}
          ],
          "default": "get"
        }
      ]
    }
  ]
}
```

Template properties:

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Display name of the template (must be unique within a repository) | Yes |
| `description` | Description of what the template creates | Yes |
| `icon` | Icon to display ([VS Code codicon name](https://microsoft.github.io/vscode-codicons/dist/codicon.html)) | No |
| `category` | Category for grouping templates | No |
| `files` | Array of files to create | Yes |
| `parameters` | Array of parameters to collect from user | No |
| `variables` | Array of custom variables computed from parameters | No |
| `variablesScript` | Path to a JavaScript file that generates custom variables | No |
| `variablesFunction` | Name of the function to call in the variables script (default: 'generateVariables') | No |

File properties:

| Property | Description | Required |
|----------|-------------|----------|
| `source` | Source path within the repository (relative to repo root) | Yes |
| `destination` | Destination path (uses dot.js templating syntax) | Yes |
| `process` | Whether to process this file with dot.js (default: true) | No |

Parameter properties:

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Parameter name (for use in templates) | Yes |
| `displayName` | Display name shown in UI | Yes |
| `description` | Description of the parameter | No |
| `type` | Type of parameter: 'string', 'boolean' or 'selection' | Yes |
| `default` | Default value | No |
| `required` | Whether the parameter is required (for string type) | No |
| `pattern` | Validation regex pattern (for string type) | No |
| `patternErrorMessage` | Error message for invalid pattern | No |
| `options` | Options for selection type (array of {value, label} objects) | For selection type |

Custom Variable properties:

| Property | Description | Required |
|----------|-------------|----------|
| `name` | Name of the variable | Yes |
| `description` | Description of the variable | No |
| `value` | JavaScript expression or dot.js template | Yes |
| `type` | Type of evaluation: 'js' or 'dotjs' (default: 'js') | No |

## Advanced Features

### Custom Variables

Code Template Hub supports two powerful methods for generating custom variables:

#### 1. Inline Variable Definitions

You can define custom variables directly in the `templates.json` file:

```json
"variables": [
  {
    "name": "className",
    "description": "CSS class name derived from component name",
    "value": "utils.toKebabCase(data.name)",
    "type": "js"
  },
  {
    "name": "importStatement",
    "description": "Import statement based on settings",
    "value": "import React{{? data.useHooks }}, { useState, useEffect }{{?}} from 'react';",
    "type": "dotjs"
  }
]
```

Each variable can use one of two evaluation types:

- **JavaScript (`js`)**: Evaluates a JavaScript expression with access to parameters and utility functions
- **dot.js (`dotjs`)**: Processes a dot.js template with access to all parameters and previously defined variables

#### 2. Script-Based Variables

For more complex variable generation, you can use a dedicated JavaScript file:

```json
"variablesScript": "scripts/api-variables.js",
"variablesFunction": "generateVariables"  // Optional, defaults to "generateVariables"
```

The script should export a function (matching the name in `variablesFunction` or defaulting to `generateVariables`) that receives parameters and context information and returns an object with string keys:

```javascript
/**
 * Generate variables for Express API Endpoint templates
 *
 * @param {Object} params - User parameters
 * @param {Object} context - Additional context
 * @returns {Object.<string, any>} - Dictionary with string keys and any value types
 */
exports.generateVariables = async function(params, context) {
  const { entityName, methods } = params;
  const { utils, workspaceDir, executionDir, templateDir } = context;

  // Transform entity name for different uses
  const entityNameCamel = utils.toCamelCase(entityName);
  const entityNamePascal = utils.toPascalCase(entityName);
  const entityNameSnake = utils.toSnakeCase(entityName);
  const entityNamePlural = entityNameCamel + 's'; // Simple pluralization

  // Return dictionary with string keys and various value types
  return {
    // String values
    "entityNameCamel": entityNameCamel,
    "entityNamePascal": entityNamePascal,
    "entityNameSnake": entityNameSnake,
    "entityNamePlural": entityNamePlural,

    // Boolean value
    "isPlural": entityName.endsWith('s'),

    // Array value
    "methods": methods.split(','),

    // Object value
    "paths": {
      "controller": `controllers/${entityNameSnake}_controller.js`,
      "model": `models/${entityNamePascal}.js`,
      "route": `routes/${entityNameSnake}_routes.js`
    },

    // Function value (will be stringified)
    "getMethodName": function(operation) {
      return `${operation}${entityNamePascal}`;
    }
  };
};
```

#### Variable Data and Context Reference

The following table describes all data available to both inline variables and script functions:

| Variable Source | Inline JS (`type: "js"`) | Inline dot.js (`type: "dotjs"`) | Script Function |
|-----------------|--------------------------|--------------------------------|----------------|
| **User Parameters** | `data.paramName` | `{{= data.paramName }}` | `params.paramName` |
| **Author Info** | `data.author.firstName`<br>`data.author.lastName`<br>`data.author.email`<br>`data.author.fullName` | `{{= data.author.firstName }}`<br>`{{= data.author.lastName }}`<br>`{{= data.author.email }}`<br>`{{= data.author.fullName }}` | `params.author.firstName`<br>`params.author.lastName`<br>`params.author.email`<br>`params.author.fullName` |
| **Organization Info** | `data.organization.name` | `{{= data.organization.name }}` | `params.organization.name` |
| **Date** | `data.date` (JavaScript Date object) | `{{= data.date }}` (JavaScript Date object) | `params.date` (JavaScript Date object) |
| **Utilities** | `utils.functionName()` | N/A (use in JS variables) | `context.utils.functionName()` |
| **Workspace Info** | `workspaceDir` | N/A (use in JS variables) | `context.workspaceDir` |
| **Execution Directory** | `executionDir` | N/A (use in JS variables) | `context.executionDir` |
| **Template Directory** | N/A | N/A | `context.templateDir` |
| **Previously Defined Variables** | All prior variables in the variables array | All prior variables in the variables array | N/A (all processed at once) |

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
  context: {
    utils: UtilityFunctions;
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

#### Process Flow Diagram

The following diagram illustrates the template processing workflow:


#### Available Utility Functions

Both inline and script-based variables have access to these utility functions:

```javascript
utils = {
  // String transformations
  toCamelCase: (str) => str.replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase()),
  toPascalCase: (str) => str.replace(/^([a-z])|-([a-z])/g, (g) => g.replace(/^-/, '').toUpperCase()),
  toSnakeCase: (str) => str.replace(/([A-Z])/g, (g) => '_' + g.toLowerCase()).replace(/^_/, ''),
  toKebabCase: (str) => str.replace(/([A-Z])/g, (g) => '-' + g.toLowerCase()).replace(/^-/, ''),

  // File path utilities
  joinPath: (...parts) => path.join(...parts),
  resolvePath: (p) => path.resolve(p),
  getBasename: (p, ext) => path.basename(p, ext),
  getDirname: (p) => path.dirname(p),
  getExtname: (p) => path.extname(p),

  // Date formatting
  formatDate: (date, format) => {
    // Formats date according to pattern (yyyy, MM, dd, etc.)
  },

  // ID generation
  generateUUID: () => {
    // Generates a v4 UUID
  }
}
```

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

### Template File Syntax

Template files use the [dot.js syntax](https://olado.github.io/doT/index.html). Parameters and variables are accessible via the `data` object:

```javascript
/**
 * {{=data.name}} Component
 *
 * @component
 * @author {{=data.author.fullName}} <{{=data.author.email}}>
 * @created {{=data.date.toLocaleDateString()}}
 */

{{= data.importStatement }}

const {{=data.name}} = (props) => {
  {{? data.withHooks }}
  const [state, setState] = useState(null);

  useEffect(() => {
    // Component mount effect
    return () => {
      // Component unmount cleanup
    };
  }, []);
  {{?}}

  return (
    <div className="{{= data.className }}">
      <h1>{{=data.name}} Component</h1>
    </div>
  );
};

export default {{=data.name}};
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

### Template Syntax Examples

#### Conditional Content

```javascript
{{? data.includeTests }}
import

### Template Syntax Examples

#### Conditional Content

```javascript
{{? data.includeTests }}
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
{{?}}
```

#### Loops

```javascript
<ul>
{{~ data.items :item:index }}
  <li>{{= index + 1 }}. {{= item.name }}</li>
{{~}}
</ul>
```

#### Expressions

```javascript
const componentName = '{{= data.name.toUpperCase() }}';
```

## Commands

| Command | Description |
|---------|-------------|
| `codeTemplateHub.createFromTemplate` | Create Files from Template |
| `codeTemplateHub.refreshTemplates` | Refresh Templates |
| `codeTemplateHub.showDiagnostics` | Show Template Diagnostics |
| `codeTemplateHub.configureAuthorInfo` | Configure Author Information |

## Troubleshooting

### Diagnostics

Run the "Code Template Hub: Show Template Diagnostics" command to see information about:

- Repository status and errors
- Available templates
- Warning and error messages

### Common Issues

#### Templates Not Showing Up

1. Check repository configuration in settings
2. Run "Code Template Hub: Refresh Templates"
3. Check diagnostics for error messages

#### Authentication Errors with Private Repositories

1. Ensure you have added a valid token in the repository configuration
2. For SSH URLs, make sure your SSH keys are properly set up
3. Check diagnostics for specific error messages

#### Invalid Template Definition

1. Verify your `templates.json` structure
2. Ensure all required fields are present
3. Check paths to template files

#### Custom Variables Errors

1. Check for syntax errors in variable expressions or scripts
2. Ensure variable scripts return objects with string keys
3. Validate that script paths are correct relative to the repository root
4. Check that all referenced parameters exist and are spelled correctly

## Best Practices

### Organizing Templates

- Group related templates under meaningful categories
- Use descriptive names and detailed descriptions
- Include appropriate icons for visual recognition

### Template Design

- Keep templates modular and focused on specific use cases
- Use parameters for customization points
- Include good documentation comments in generated files
- Use conditional sections for optional features

### Custom Variables Best Practices

- Use inline variables for simple transformations and conditional logic
- Use script-based variables for complex logic, file system operations, or API calls
- Break down complex logic into helper functions for readability
- Add descriptive comments to script files to explain the variable generation process
- Use the provided utility functions rather than reimplementing common operations
- Validate inputs and handle errors gracefully in variable scripts
- Cache expensive operations when possible
- Use async/await for asynchronous operations in script-based variables
