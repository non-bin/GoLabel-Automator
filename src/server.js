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

print(null, null, null, ()=>{}, true); // Test if the GoLabel is installed

const server = http.createServer(function (req, res) {
  const parsedUrl = url.parse(req.url);

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

          let template = sanitize(data.template, ['testTag', 'assetTag']);
          let variant = sanitize(data.variant, ['small', 'large', 'dbOnly']);

          createDB(template, data.values, () => {
            if (variant === 'dbOnly') {
              log(`Saved ${template} db only`);

              res.statusCode = 200;
              res.end(`All Good :)`);
            } else {
              print(template, variant, data.whiteOnBlack, (err) => {
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
  } else {
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

        log(`${req.method} ${req.url} ${res.statusCode}`);
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
            log(`${req.method} ${req.url} ${res.statusCode}`);
          } else {
            // if the file is found, set Content-type and send data
            res.setHeader('Content-type', docTypeMap[ext] || 'text/plain' );
            res.end(data);
            log(`${req.method} ${req.url} ${res.statusCode}`);
          }
        });
      });
    });
  }

  log(`${req.method} ${req.url} ${res.statusCode}`);
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

function createDB(template, values, callback) {
  var header = '';
  var csv = '';

  switch (template) {
    case 'testTag':
      header = 'NAME,ID,RETEST,OPERATOR\n';

      for (let i = 0; i < values.barcodes.length; i++) {
        csv += `${values.deviceNames[i]},${values.barcodes[i]},${values.retestPeriods[i]},${values.operatorNames[i]}\n`;
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

function print(template, variant, whiteOnBlack, callback, testOnly) {
  if (!config.printingEnabled) {
    testOnly = true;
  }

  let templateFile = `${template}_${variant}`;

  let command = `"${config.golabelPath}" -f ".\\${whiteOnBlack ? 'tmp\\inverses' : 'templates'}\\${templateFile}.ezpx" -db ".\\tmp\\db.csv"`;

  if (testOnly) { // Just make sure the program is installed
    command = `"${config.golabelPath}" -v`; // This doesn't actually do anything, even output the version. Stupid program.
  }

  log(`Printing ${templateFile} ${whiteOnBlack ? 'inverses' : ''}`);
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

              for (const match of data.matchAll(/(?<=<Setup [^>]*)(?<key>\S+)="(?<value>\S+)"(?=.*>)/gms)) {
                label.setup[match.groups.key] = match.groups.value;
              }

              for (const match of data.matchAll(/(?<=<Layout [^>]*)(?<key>\S+)="(?<value>\S+)"(?=.*>)/gms)) {
                label.layout[match.groups.key] = match.groups.value;
              }

              const mediaWidth          = label.setup.LabelWidth;
              const mediaHeight         = label.setup.LabelLength;
              const leftMargin          = (label.setup.LeftMargin||0)   /8;
              const rightMargin         = (label.layout.RightMargin||0) /8;
              const topMargin           = (label.setup.TopMargin||0)    /-8; // TODO: IDK What's going on with this
              const bottomMargin        = (label.layout.BottomMargin||0)/8;
              const horizontalGap       = (label.layout.HorGap||0);
              const verticalGap         = (label.layout.VerGap||0);
              const horizontalDivisions = (label.layout.HorAcross||1);
              const verticalDivisions   = (label.layout.VerAcross||1);

              if (mediaWidth === undefined || mediaHeight === undefined) {
                logError(`ERROR: While generating inverse for ${entry.name} (missing media width or length)`);
                throw(new Error());
              }

              const inverseMaskWidth = (mediaWidth-leftMargin-rightMargin-horizontalGap*(horizontalDivisions-1))/horizontalDivisions*8;
              const inverseMashHeight = (mediaHeight-topMargin-bottomMargin-verticalGap*(verticalDivisions-1))/verticalDivisions*8;

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
  console.log(message);
}

function logError(message) {
  console.error(`${ESC_RED}${message}${ESC_RESET}`);
}
