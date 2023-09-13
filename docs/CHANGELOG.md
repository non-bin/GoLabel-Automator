# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- We now 'use strict'
- Use `const` and `let` instead of `var` where possible

## [1.2.1] - 2023-9-13

### Added

- Title of the cmd window running the server, is now "Golabel Automator"
- Debug Level setting
- Colour scheme switcher

### Changed

- Reduced the amount of output sent to the terminal
- Improved input hints

### Fixed

- All arguments are now passed through the batch script to the server

## [1.2.0] - 2023-9-8

### Added

- Operator Name to labels
- Label print history

### Changed

- Improved inverse generation
- Improved error feedback in the server, and bat file
- Improved README

### Fixed

- Program now waits for printing to finish before returning success to client
- If barcode start and end are swapped, the program will now swap them back
- Barcode start and end can now be 0 (or negative I guess)
- Inverse labels are now generated correctly, even with complex layouts
- Generate enough leaders to fill a row

## [1.1.1] - 2023-8-11

## Fixed

- Printing

## [1.1.0] - 2023-8-11

### Broke

- Printing

### Added

- Run shortcut bat file
- Control panel to regenerate inverse templates
- config.json file to store settings

## [1.0.0] - 2023-8-10

### Added

- Function to generate a label DB with incrementing barcode numbers
- White on black printing and automatic template generation
- Label size selector

[unreleased]: https://github.com/non-bin/GoLabel-Automator
[1.2.1]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.2.1
[1.2.0]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.2.0
[1.1.1]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.1.1
[1.1.0]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.1.0
[1.0.0]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.0.0
