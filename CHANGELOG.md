# Change Log

All notable changes to the "codeTemplateHub" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.2.0

### New Features

- **Custom Variable Support**: Added functionality to define and use custom variables within templates. The variables can be define in the templates.json or by a custom javascript file.

### Other Changes

- Updated README with custom variable documentation

## 0.3.0

### New Features

- **`visibleIf` Condition Support**: Introduced the `visibleIf` property for template fields. This allows fields to be conditionally displayed based on the evaluation of a JavaScript expression, providing dynamic control over template customization.


## 0.4.0

### New Features

- **Select Many Support**: Added support for multi-selection fields, allowing users to choose multiple options from a list.

### Improvements

- **Validation for `visibleIf` Fields**: Added validation to ensure fields with `visibleIf` conditions also have a default value defined, improving the user experience for conditional fields.

## 0.5.0

### Bug Fixes

- **Keyword Updates**: Updated keywords to improve discoverability and alignment with the extension's functionality.
- **File Generation Fix**: Resolved an issue where the extension would incorrectly proceed with file generation from a template when the "Esc" key was pressed. File generation now aborts as expected.

## 0.6.0

### Bug Fixes

- **Utility Functions for Custom Variables**: Fixed issues with utility functions used for custom variable generation, ensuring they work as intended.

### Improvements

- **Streamlined Access to Utility Functions**: Simplified and improved access to utility functions for custom variable generation in JavaScript.

## 0.6.1

### Bug Fixes

- **Custom Variable Generation Validation**: Fixed a validation issue where the `generateVariables` JavaScript function incorrectly required 2 parameters instead of the correct 3 parameters. ([#5](https://github.com/JohannesPosch/Code-Template-Hub/issues/5))
