# Code Template Hub Extension for VS Code

## Overview

Code Template Hub is a powerful VS Code extension that helps you quickly create files from templates stored in git repositories. Using the [dot.js](https://olado.github.io/doT/index.html) templating engine, you can create sophisticated templates with dynamic content based on user input and predefined variables.

- **Repository-based**: Templates are stored in git repositories, allowing for version control and sharing across teams
- **Flexible templating**: Use dot.js templating syntax for powerful and flexible templates
- **Template Explorer**: Browse templates in a structured tree view
- **Customizable parameters**: Define parameters for your templates to collect user input with validation
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

Example repository structure:

```
/
├── templates.json
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

### Template File Syntax

Template files use the [dot.js syntax](https://olado.github.io/doT/index.html). Parameters are accessible via the `data` object:

```javascript
/**
 * {{=data.name}} Component
 *
 * @component
 * @author {{=data.author.fullName}} <{{=data.author.email}}>
 * @created {{=data.date.toLocaleDateString()}}
 */

import React from 'react';
{{? data.withHooks }}
import { useState, useEffect } from 'react';
{{?}}

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
    <div>
      <h1>{{=data.name}} Component</h1>
    </div>
  );
};

export default {{=data.name}};
```

### Available Template Variables

Apart from user-defined parameters, these built-in variables are available:

#### Author Information

| Variable | Description |
|----------|-------------|
| `data.author.firstName` | Author's first name |
| `data.author.lastName` | Author's last name |
| `data.author.email` | Author's email address |
| `data.author.fullName` | Author's full name (first + last) |

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

## Example Templates

### React Component

Template file: `component.dot.js`
```javascript
import React from 'react';
{{? data.withHooks }}
import { useState, useEffect } from 'react';
{{?}}
{{? data.styleType === 'css' }}
import styles from './{{=data.name}}.module.css';
{{?}}

/**
 * {{=data.name}} Component
 *
 * @component
 * @author {{=data.author.fullName}} <{{=data.author.email}}>
 * @created {{=data.date.formatted}}
 */
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
    <div {{? data.styleType === 'css' }}className={styles.container}{{?}}>
      <h1 {{? data.styleType === 'css' }}className={styles.title}{{?}}>{{=data.name}} Component</h1>
    </div>
  );
};

export default {{=data.name}};
```

### CSS Module

Template file: `styles.dot.js`
```css
/*
 * {{=data.name}} Component Styles
 * @author {{=data.author.fullName}} <{{=data.author.email}}>
 * @created {{=data.date.toLocaleDateString()}}
 */

.container {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

.title {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
}
```

### C++ Class

Template file: `class.dot.js`
```cpp
/**
 * @file {{=data.name}}.cpp
 * @brief Implementation of the {{=data.name}} class
 * @author {{=data.author.fullName}} <{{=data.author.email}}>
 * @date {{=data.date.toISOString().split('T')[0]}}
 */

#include "{{=data.name}}.h"

{{? data.namespace }}
namespace {{=data.namespace}} {
{{?}}

{{=data.name}}::{{=data.name}}() {
    // Constructor implementation
}

{{=data.name}}::~{{=data.name}}() {
    // Destructor implementation
}

{{? data.namespace }}
} // namespace {{=data.namespace}}
{{?}}
```

### C++ Header

Template file: `header.dot.js`
```cpp
/**
 * @file {{=data.name}}.h
 * @brief Declaration of the {{=data.name}} class
 * @author {{=data.author.fullName}} <{{=data.author.email}}>
 * @date {{=data.date.toISOString().split('T')[0]}}
 */

#pragma once

{{? data.namespace }}
namespace {{=data.namespace}} {
{{?}}

class {{=data.name}} {
public:
    /**
     * @brief Constructor
     */
    {{=data.name}}();

    /**
     * @brief Destructor
     */
    ~{{=data.name}}();

{{? data.includeVirtualDestructor }}
    /**
     * @brief Virtual destructor
     */
    virtual ~{{=data.name}}();
{{?}}

private:
    // Private members
};

{{? data.namespace }}
} // namespace {{=data.namespace}}
{{?}}
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

## Advanced Features

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

### Post-Generation Actions

After generating files, the extension:

1. Shows a success message with the number of created files
2. Opens the first created file automatically

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
