function processInput(field) {
  var value = document.getElementById(field).value;

  if (field == 'barcodeStart') {
    if (value == '') {
      document.getElementById('barcodeEnd').placeholder = 'Quantity';
    } else {
      document.getElementById('barcodeEnd').placeholder = 'Barcode Number End';
    }
  }

  var deviceName = document.getElementById('deviceNameInput').value;
  var barcodePrefix = document.getElementById('barcodePrefixInput').value;
  var barcodeStart = document.getElementById('barcodeStartInput').value;
  var barcodeEnd = document.getElementById('barcodeEndInput').value;
  var retestPeriod = document.getElementById('retestPeriodInput').value;

  updateTable(deviceName, generateBarcodes(barcodePrefix, barcodeStart, barcodeEnd), retestPeriod);
}

function print(whiteOnBlack) {
  var deviceName = document.getElementById('deviceNameInput').value;
  var barcodePrefix = document.getElementById('barcodePrefixInput').value;
  var barcodeStart = document.getElementById('barcodeStartInput').value;
  var barcodeEnd = document.getElementById('barcodeEndInput').value;
  var retestPeriod = document.getElementById('retestPeriodInput').value;

  sendForPrint(deviceName, generateBarcodes(barcodePrefix, barcodeStart, barcodeEnd, whiteOnBlack), retestPeriod, whiteOnBlack);
}

function generateBarcodes(barcodePrefix, barcodeStart, barcodeEnd, leader) {
  leader = leader || false;
  var barcodes = [];
  var quantity;

  barcodeStart = parseInt(barcodeStart);
  barcodeEnd = parseInt(barcodeEnd);

  if (isNaN(barcodeStart)) {
    quantity = barcodeEnd || 1;
  } else {
    quantity = barcodeEnd - barcodeStart + 1;
  }

  if (isNaN(barcodeStart)) {
    barcodes = Array(quantity).fill(barcodePrefix);
  } else {
    for (var i = 0; i < quantity; i++) {
      barcodes.push(barcodePrefix + (barcodeStart + i));
    }
  }

  return barcodes;
}

function updateTable(deviceName, barcodes, retestPeriod) {
  var previewTableBody = '<tr><th>Device Name</th><th>Barcode</th><th>Retest Period</th></tr>';

  for (let i = 0; i < barcodes.length; i++) {
    previewTableBody += `<tr><td>${deviceName}</td><td>${barcodes[i]}</td><td>${retestPeriod}</td></tr>`;
  }

  document.getElementById('previewTable').innerHTML = previewTableBody;
}

function sendForPrint(deviceName, barcodes, retestPeriod, blackOnWhite) {
  var printPromise = fetch('/print', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceName: deviceName,
      barcodes: barcodes,
      retestPeriod: retestPeriod,
      blackOnWhite: blackOnWhite
    })
  });

  console.log('Sent');

  printPromise.then(function (response) {
    var responseText = response.text();
    console.log(responseText);
    return response.text(responseText);
  }, function (error) {
    console.log(error.message);
  });
}
