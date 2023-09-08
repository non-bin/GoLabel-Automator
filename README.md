# GoLabel-Automator

## Getting Started

Download the latest release from [https://github.com/non-bin/GoLabel-Automator/releases](https://github.com/non-bin/GoLabel-Automator/releases)

Install the prerequisites:

- NodeJS [https://nodejs.org/en/](https://nodejs.org/en/)
- GoLabel II [https://www.godexintl.com/product/16681379086423723?locale=en](https://www.godexintl.com/product/16681379086423723?locale=en)

Run the application:

- Run `run.bat` to start the application  
- Connect to the server at at the address shown on the output window, either on the same machine or on a different machine on the same network

## Configuration

Place GoLabel label files in the `./templates` directory

In `config.json` you can configure the following:

Key|Description|Default
-|-|-
`golabelPath`|Path to GoLabel II executable. `\` need to be replaced with `\\`, eg `C:\Users\Alice` > `C:\\Users\\Alice`|`C:\\Program Files (x86)\\GoDEX\\GoLabel II\\GoLabel.exe`
`defaultPort`|Port to run the server on<sup>1</sup>|`80`
`inverseSettings.speed`|The speed the printer should run at when printing inverse labels|`2`
`inverseSettings.darkness`|The darkness the printer should use when printing inverse labels|`1`

<sup>1</sup>This is overriden by the second command line argument, eg `run.bat 8080` or `node src/server.js 8080` will run the server on port `8080`

## Troubleshooting

### `ERROR: Port 80 is already in use`

- Is the application is already running?
- Is another server running?
- Change `defaultPort` in `config.json` to a different port. like `8080` or `3000`
- Run `run.bat 8080` or `node src/server.js 8080` to run the server on port `8080`

### Inverse labels

Issue | Solution
-|-
Background is fuzzy | Turn up `inverseSettings.darkness`
Text is unclear | Turn down `inverseSettings.darkness`
Label has lines through it | Turn down `inverseSettings.speed`

### `Node.js is not installed` or `node is not recognized as an internal or external command`

- Install NodeJS from [https://nodejs.org/en/](https://nodejs.org/en/)

### `ERROR: Either GoLabel II is not installed, or the path in config.json is incorrect`

- Check that GoLabel II is installed. You can download it from [https://www.godexintl.com/product/16681379086423723?locale=en](https://www.godexintl.com/product/16681379086423723?locale=en)
- Check that the path in config.json is correct. It's usually at `C:\Program Files (x86)\GoDEX\GoLabel II\GoLabel.exe`
- Remember you have to replace ingle slashes (`\`) with double slashes (`\\`), eg `C:\Users\Alice` > `C:\\Users\\Alice`

## Testing

Only tested on a GoDex RT200 printer

## Licence

  Automate label printing from templates, with GoLabel II
  Copyright (C) 2023  Alice Jacka

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
