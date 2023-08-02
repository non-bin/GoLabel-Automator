const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { type } = require('os');
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
      createDB(data.template, data.values);
      // print(data.template, data.whiteOnBlack);

      res.statusCode = 200;
      res.end(`All Good :)`);
      return;
    });
  } else {
    // extract URL path
    let pathname = `./src/www/${parsedUrl.pathname}`;
    // based on the URL path, extract the file extension. e.g. .js, .doc, ...
    const ext = path.parse(pathname).ext || ".html";
    // maps file extension to MIME typere
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

function createDB(template, values) {
  var csv = '';

  switch (template) {
    case 'testTag':
      csv += 'NAME,ID,RETEST\n';

      for (let i = 0; i < values.barcodes.length; i++) {
        csv += `${values.deviceName},${values.barcodes[i]},${values.retestPeriod}\n`;
      }
      break;

    default:
      console.log(`No template found for ${template}`);
      return false;
  }

  fs.writeFile(`db.csv`, csv, function (err) {
    if (err) {
      console.log(err);
      return false;
    }
    console.log('wrote db');
  });
}

function print(template, whiteOnBlack) {
  let command = `
    "C:\\Program Files (x86)\\GoDEX\\GoLabel II\\GoLabel.exe"
    /F="C:\\Users\\Public\\Documents\\GoDEX\\GoLabel II\\Templates\\${template}.lab"
    /D="C:\\Users\\Public\\Documents\\GoDEX\\GoLabel II\\Templates\\${template}.csv"
    /P /X /S`;

  exec(command, (err, stdout, stderr) => {
    if (err) {
      console.log(err);
      return;
    }
    console.log(stdout);
  });
}
