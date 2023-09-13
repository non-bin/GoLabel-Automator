const http          = require('http');
const url           = require('url');
const fs            = require('fs');
const path          = require('path');
const child_process = require('child_process');
const os            = require('os');
const config        = require('../config.json');

const ESC_RED = '\x1b[91m';
const ESC_RESET = '\x1b[0m';

const port = parseInt(process.argv[2] || config.defaultPort);
const DEBUG_LEVEL = parseInt(process.argv[3] || config.debugLevel);

var labelInfo = {};

print(null, null, ()=>{}, true); // Test if the GoLabel is installed

const server = http.createServer(function (req, res) {
  const parsedUrl = url.parse(req.url);

  // Collect POST data
  if (req.method === 'POST') {
    var body = '';
    req.on('data', function (data) {
      body += data;

      // Too much POST data, kill the connection!
      // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
      if (body.length > 1e6)
      req.socket.destroy();
    });
  }

  // API endpoints
  if (parsedUrl.pathname.startsWith('/api')) {
    if (parsedUrl.pathname == '/api/regenerateInverses') {
      if (req.method === 'POST') {
        req.on('end', () => {
          generateInverses();

          res.statusCode = 200;
          res.end(`All Good :)`);
        });
      } else {
        res.statusCode = 405; // Method not allowed
        res.end(`Method ${req.method} not allowed!`);
      }
    } else if (parsedUrl.pathname == '/api/print') {
      if (req.method === 'POST') {
        req.on('end', () => {
          let data = JSON.parse(body);

          let template = sanitize(data.template, ['testTag', 'stockTag']);
          let variant = sanitize(data.variant, ['small', 'large', 'dbOnly']);

          let templateFile = `${template}_${variant}.ezpx`;

          let leaderCount = 0;
          if (data.whiteOnBlack) {
            leaderCount = labelInfo[templateFile].horizontalDivisions;
          }

          createDB(template, data.values, leaderCount, () => {
            if (variant === 'dbOnly') {
              log(`Saved ${template} db only`);

              res.statusCode = 200;
              res.end(`All Good :)`);
            } else {
              print(templateFile, data.whiteOnBlack, (err) => {
                if (err) {
                  logError('Error printing:');
                  logError(err);
                } else {
                  res.statusCode = 200;
                  res.end(`All Good :)`);
                }
              });
            }
          });
        });
      } else {
        res.statusCode = 405; // Method not allowed
        res.end(`Method ${req.method} not allowed!`);
      }
    } else if (parsedUrl.pathname == '/api/printingEnabled') {
      if (req.method === 'POST') {
        req.on('end', () => {
          config.printingEnabled = body == 'true' ? true : false;

          log(`Printing enabled set to ${config.printingEnabled}`);

          res.statusCode = 200;
          res.end(config.printingEnabled.toString());
        });
      } else if (req.method === 'GET') {
        res.statusCode = 200;
        res.end(`${config.printingEnabled}`);
      } else {
        res.statusCode = 405; // Method not allowed
        res.end(`Method ${req.method} not allowed!`);
      }
    } else {
      res.statusCode = 404;
      res.end(`API endpoint ${parsedUrl.pathname} not found!`);
    }
  } else { // Serve static files
    // extract URL path
    let pathname = `./src/www/${parsedUrl.pathname}`;
    // based on the URL path, extract the file extension. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext || ".html";
    // maps file extension to MIME type
    const docTypeMap = {
      '.ico': 'image/x-icon',
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword'
    };

    fs.exists(pathname, function (exist) {
      if(!exist) {
        // if the file is not found, return 404
        res.statusCode = 404;
        res.end(`File ${pathname} not found!`);
        return;
      }

      // if is a directory search for index file matching the extension
      fs.stat(pathname, function(err, stat) {
        if(err) {
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
          logError(err);
          return;
        }


        if (stat.isDirectory()) pathname += '/index' + ext;

        // read file from file system
        fs.readFile(pathname, function(err, data){
          if(err){
            res.statusCode = 500;
            res.end(`Error getting the file: ${err}.`);
          } else {
            // if the file is found, set Content-type and send data
            res.setHeader('Content-type', docTypeMap[ext] || 'text/plain' );
            res.end(data);
          }
        });
      });
    });
  }

  if (DEBUG_LEVEL > 0) {
    log(`${req.method} ${req.url} ${res.statusCode}`);
  }

  return;
});

server.listen(port);
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    logError(`ERROR: Port ${port} is already in use`);
  } else {
    logError(e);
  }

  process.exit(1);
});
server.on('listening', () => {
  log(`Server started, listening on:`);
  printAddresses(port);
});

function createDB(template, values, leaderCount, callback) {
  var header = '';
  var csv = '';

  if (leaderCount) {
    for (const key in values) {
      if (Object.hasOwnProperty.call(values, key)) {
        for (let i = 0; i < leaderCount; i++) {
          values[key].unshift('leader');
        }
      }
    }
  }

  switch (template) {
    case 'testTag':
      header = 'NAME,ID,RETEST,OPERATOR\n';

      for (let i = 0; i < values.barcodes.length; i++) {
        csv += `${values.deviceNames[i]},${values.barcodes[i]},${values.retestPeriods[i]},${values.operatorNames[i]}\n`;
      }
      break;

    case 'stockTag':
      header = 'NAME,ID\n';

      for (let i = 0; i < values.barcodes.length; i++) {
        csv += `${values.deviceNames[i]},${values.barcodes[i]}\n`;
      }
      break;

    default:
      logError(`No template found for ${template}`);
      return false;
  }

  fs.writeFile(`./tmp/db.csv`, header+csv, callback);
  fs.writeFile(`./history.csv`, csv, {flag: 'a'}, (err) => {
    if (err) {
      logError('Error writing new history entry:');
      logError(err);
      return;
    }
  });

  return;
}

function print(templateFile, whiteOnBlack, callback, testOnly) {
  if (!config.printingEnabled) {
    testOnly = true;
  }

  let command = `"${config.golabelPath}" -f ".\\${whiteOnBlack ? 'tmp\\inverses' : 'templates'}\\${templateFile}" -db ".\\tmp\\db.csv"`;

  if (testOnly) { // Just make sure the program is installed
    command = `"${config.golabelPath}" -v`; // This doesn't actually do anything, even output the version. Stupid program.
  }

  if (testOnly) {
    log(`Testing GoLabel II installation`);
  } else {
    log(`Printing ${templateFile} ${whiteOnBlack ? 'inverses' : ''}`);
  }

  child_process.exec(command, function(error, stdout, stderr) {
    if (error) {
      if (error.message.indexOf('is not recognized as an internal or external command') != -1) {
        logError('ERROR: Either GoLabel II is not installed, or the path in config.json is incorrect');
      } else {
        logError(error);
      }

      process.exit(1);
    }

    if (testOnly) {
      log('Test print successful');
    } else {
      log('Done printing');
    }

    callback(error);
  }.bind({callback: callback}));
}

generateInverses();
function generateInverses() {
  log('Generating inverses');
  labelInfo = {};

  fs.rm('./tmp/inverses/', {recursive: true, force: true}, (err) => {
    if (err) {
      logError(err);
      return;
    }

    // Create inverses directory recursively
    fs.mkdir('./tmp/inverses/', {recursive: true}, (err) => {
      if (err) {
        logError(err);
        return;
      }
      fs.readdir('./templates', {withFileTypes: true}, (err, entries) => {
        if (err) {
          logError(err);
          return;
        }

        entries.forEach(entry => {
          if (entry.isFile()) {
            if (!entry.name.endsWith('.ezpx')) {
              log(`Skipping ${entry.name} (not an ezpx file)`);
              return;
            }

            fs.readFile(`./templates/${entry.name}`, 'utf8', (err, data) => {
              if (err) {
                logError(err);
                return;
              }

              let label = {
                setup: {},
                layout: {}
              };

              // Find the interesting lines
              const setupLineMatch = data.match(/<Setup.*/);
              const layoutLineMatch = data.match(/<Layout.*/);

              // Extract the properties
              const setupPropertyMatches = setupLineMatch[0].matchAll(/(?<key>\S+)="(?<value>\S+)"/g);
              const layoutPropertyMatches = layoutLineMatch[0].matchAll(/(?<key>\S+)="(?<value>\S+)"/g);

              // Save them to a variable
              for (const match of setupPropertyMatches) {
                label.setup[match.groups.key] = match.groups.value;
              }
              for (const match of layoutPropertyMatches) {
                label.layout[match.groups.key] = match.groups.value;
              }

              // Save info for later
              labelInfo[entry.name] = {};

              labelInfo[entry.name].mediaWidth          = parseInt(label.setup.LabelWidth);
              labelInfo[entry.name].mediaHeight         = parseInt(label.setup.LabelLength);

              // Margins are stored in 1/8 millimeters, for some reason
              labelInfo[entry.name].leftMargin          = parseInt((label.setup.LeftMargin||0)   /8);
              labelInfo[entry.name].rightMargin         = parseInt((label.layout.RightMargin||0) /8);
              // these two are weird (https://github.com/non-bin/GoLabel-Automator/wiki/GoLabel-II-Weirdness#page-setup-margins)
              labelInfo[entry.name].topMargin           = parseInt((label.setup.TopMargin||0)    /-8);
              labelInfo[entry.name].bottomMargin        = parseInt(((label.layout.BottomMargin||0)/8)-labelInfo[entry.name].topMargin);

              labelInfo[entry.name].horizontalGap       = parseInt(label.layout.HorGap||0);
              labelInfo[entry.name].verticalGap         = parseInt(label.layout.VerGap||0);
              labelInfo[entry.name].horizontalDivisions = parseInt(label.layout.HorAcross||1);
              labelInfo[entry.name].verticalDivisions   = parseInt(label.layout.VerAcross||1);

              if (labelInfo[entry.name].mediaWidth === undefined || labelInfo[entry.name].mediaHeight === undefined) {
                logError(`ERROR: While generating inverse for ${entry.name} (missing media width or length)`);
                throw(new Error());
              }

              const inverseMaskWidth = (labelInfo[entry.name].mediaWidth-labelInfo[entry.name].leftMargin-labelInfo[entry.name].rightMargin-labelInfo[entry.name].horizontalGap*(labelInfo[entry.name].horizontalDivisions-1))/labelInfo[entry.name].horizontalDivisions*8;
              const inverseMashHeight = (labelInfo[entry.name].mediaHeight-labelInfo[entry.name].topMargin-labelInfo[entry.name].bottomMargin-labelInfo[entry.name].verticalGap*(labelInfo[entry.name].verticalDivisions-1))/labelInfo[entry.name].verticalDivisions*8;

              var newData = data.replace('</qlabel>',`
                <GraphicShape xsi:type="Line" Style="Cross" IsPrint="true" PageAlignment="None" Locked="false" bStroke="true" bFill="true" Direction="Angle0" Alignment="Left" AlignPointX="0" AlignPointY="0">
                  <qHitOnCircumferance>false</qHitOnCircumferance>
                  <Selected>false</Selected>
                  <iBackground_color>4294967295</iBackground_color>
                  <Id>11</Id>
                  <ItemLabel>None11</ItemLabel>
                  <ObjectDrawMode>FW</ObjectDrawMode>
                  <Name>L</Name>
                  <GroupID>0</GroupID>
                  <GroupSelected>false</GroupSelected>
                  <lineShape>FillRect</lineShape>
                  <Height>${inverseMashHeight}</Height>
                  <Operation>101</Operation>
                  <Width>${inverseMaskWidth}</Width>
                </GraphicShape>
              </qlabel>
              `).replace(/(<Setup.*Speed=")\d+(.*Darkness=")\d+(.*)/, `$1${config.inverseSettings.speed}$2${config.inverseSettings.darkness}$3` )

              fs.writeFile(`./tmp/inverses/${entry.name}`, newData, {flag: 'wx'}, (err) => {
                if (err) {
                  logError(err);
                  return;
                }

                log(`Wrote ./tmp/inverses/${entry.name}`);
              });
            });
          }
        });
      });
    });
  });
}

function printAddresses(port) {
  // https://stackoverflow.com/a/8440736/10805855
  const nets = os.networkInterfaces();
  const results = Object.create(null); // Or just '{}', an empty object
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family === familyV4Value && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  let output = '';

  for (const interface in results) {
    if (Object.hasOwnProperty.call(results, interface)) {
      const ip = results[interface];
      // don't print port if it's 80
      output += `http://${ip}${port == 80 ? '' : `:${port}`}/\n`;
    }
  }

  output += `http://localhost${port == 80 ? '' : `:${port}`}/`;

  if (output == '') {
    output += `No other addresses found, are you connected to a network?`;
  }

  log(output);
}

// Helper functions:

JSON.safeStringify = (obj, indent = 2) => {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
};

function sanitize(input, options) {
  if (typeof input != 'string') {
    return undefined;
  }

  for (let i = 0; i < options.length; i++) {
    if (options[i].toLowerCase() == input.toLowerCase()) {
      return options[i];
    }
  }

  return undefined;
}

function log(message) {
  if (DEBUG_LEVEL < 10) {
    console.log(message);
  } else {
    console.log(`${message} (at ${getCaller()})`);
  }
}

function logError(message) {
  if (DEBUG_LEVEL < 10) {
    console.log(`${ESC_RED}${message}${ESC_RESET}`);
  } else {
    console.log(`${ESC_RED}${message}${ESC_RESET} (at ${getCaller()})`);
  }
}

function getErrorObject(){
  try { throw Error('') } catch(err) { return err; }
}

function getCaller() {
  const err = getErrorObject();
  const stack = err.stack.split("\n");
  const caller_line = stack[4];
  const index = caller_line.indexOf("at ");
  const clean = caller_line.slice(index+3, caller_line.length);

  return clean;
}
