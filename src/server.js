const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const port = process.argv[2] || 80;

http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);
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

    req.on('end', function () {
      let data = JSON.parse(body);
      createDB(data.template, data.values, () => {
        print(data.template, data.whiteOnBlack);
      });

      res.statusCode = 200;
      res.end(`All Good :)`);
      return;
    });
  } else {
    // extract URL path
    let pathname = `./src/www/${parsedUrl.pathname}`;
    // based on the URL path, extract the file extension. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext || ".html";
    // maps file extension to MIME type
    const map = {
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
      if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

      // read file from file system
      fs.readFile(pathname, function(err, data){
        if(err){
          res.statusCode = 500;
          res.end(`Error getting the file: ${err}.`);
        } else {
          // if the file is found, set Content-type and send data
          res.setHeader('Content-type', map[ext] || 'text/plain' );
          res.end(data);
        }
      });
    });
  }
}).listen(parseInt(port));

console.log(`Server listening on port ${port}`);

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

function createDB(template, values, callback) {
  var csv = '';

  switch (template) {
    case 'testTag':
      csv += 'NAME,ID,RETEST\n';

      for (let i = 0; i < values.barcodes.length; i++) {
        csv += `${values.deviceName},${values.barcodes[i]},${values.retestPeriod}\n`;
      }
      break;

    default:
      console.error(`No template found for ${template}`);
      return false;
  }

  fs.writeFile(`db.csv`, csv, function (err) {
    if (err) {
      console.error(err);
      return false;
    }
    console.log('wrote db');

    callback();
  });
}

function print(template, whiteOnBlack) {

  let command = `"C:\\Program Files (x86)\\GoDEX\\GoLabel II\\GoLabel.exe" -f ".\\templates${whiteOnBlack ? '\\inverses' : ''}\\${template}.ezpx" -db ".\\db.csv"`;

    console.log(command);

  console.log('printing');
  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('done');
  });
}
generateInverses();
function generateInverses() {
  const speed = 2;
  const darkness = 1;

  console.log('generating inverses');

  fs.rm('./templates/inverses/', {recursive: true, force: true}, (err) => {
    if (err) {
      console.error(err);
      return;
    }

    fs.mkdir('./templates/inverses/', (err) => {
      if (err) {
        console.error(err);
        return;
      }
      fs.readdir('./templates', {withFileTypes: true}, (err, entries) => {
        if (err) {
          console.error(err);
          return;
        }

        entries.forEach(entry => {
          if (entry.isFile() && entry.name.indexOf('ezpn')) {
            fs.readFile(`./templates/${entry.name}`, 'utf8', (err, data) => {
              if (err) {
                console.error(err);
                return;
              }

              var newData = data.replace('</qlabel>', `  <GraphicShape xsi:type="Line" Style="Cross" IsPrint="true" PageAlignment="None" Locked="false" bStroke="true" bFill="true" Direction="Angle0" Alignment="Left" AlignPointX="0" AlignPointY="0">
                    <qHitOnCircumferance>false</qHitOnCircumferance>
                    <Selected>true</Selected>
                    <iBackground_color>4294967295</iBackground_color>
                    <Id>12</Id>
                    <ItemLabel>None12</ItemLabel>
                    <ObjectDrawMode>FW</ObjectDrawMode>
                    <Name>L</Name>
                    <GroupID>0</GroupID>
                    <GroupSelected>false</GroupSelected>
                    <lineShape>FillRect</lineShape>
                    <Height>819.5402</Height>
                    <Operation>101</Operation>
                    <Width>361.494263</Width>
                  </GraphicShape>
                </qlabel>`)
                .replace(/(<Setup.*Speed=")\d+(.*Darkness=")\d+(.*)/, `$1${speed}$2${darkness}$3` )

              fs.writeFile(`./templates/inverses/${entry.name}`, newData, {flag: 'wx'}, (err) => {
                if (err) {
                  console.error(err);
                  return;
                }

                console.log(`wrote ${entry.name}`);
              });
            });
          }
        });
      });
    });
  });
}
