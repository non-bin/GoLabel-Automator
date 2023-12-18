# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- The WiKi is no longer empty!
- Large white on black print jobs are now split into batches, to prevent the printer head from overheating
- Pressing Enter, Up, or Down now moves one cell down in the preview table, allowing for batch barcode scanning

### Changed

- Updated placeholders and hover hints
- Hid the Save DB button
- Add tester name to small test tag template
- RentalPoint 3 Product Listing Report formatter
  - File picker now only shows CSV files
  - Now works when using a browser on a different computer than the server

### Fixed

- Row delete buttons now work
- Fields including a double quote (") are now handled correctly

### Development

- Made Node the default debug option in VSCode
- Added DONT_USE_GOLABEL debug option, for dev machines without GoLabel installed

## [1.4.1] - 2023-12-11

### Fixed

- GoLabel installation detection

## [1.4.0] - 2023-12-11

### Added

- RentalPoint 3 Product Listing Report formatter

### Development

- Added test mode for non Windows environments

## [1.3.0] - 2023-9-15

### Added

- Batch Printing
- Delete row buttons
- ESlint configuration

### Changed

- We now 'use strict'
- Use `const` and `let` instead of `var` where possible

### Fixed

- Screen no longer flashes white on load

## [1.2.2] - 2023-9-13

### Fixed

- Printing :P

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
[1.2.2]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.2.2
[1.2.1]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.2.1
[1.2.0]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.2.0
[1.1.1]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.1.1
[1.1.0]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.1.0
[1.0.0]: https://github.com/non-bin/GoLabel-Automator/releases/tag/v1.0.0
