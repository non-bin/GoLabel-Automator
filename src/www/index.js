function processInput(field) {
  var value = document.getElementById(field).value;

  if (field == 'barcodeStartInput') {
    if (value == '') {
      document.getElementById('barcodeEndInput').placeholder = 'Quantity';
    } else {
      document.getElementById('barcodeEndInput').placeholder = 'Barcode Number End';
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

  sendForPrint({
    deviceName: deviceName,
    barcodes: generateBarcodes(barcodePrefix, barcodeStart, barcodeEnd, whiteOnBlack),
    retestPeriod: retestPeriod
  }, 'testTag', whiteOnBlack);
}

function generateBarcodes(barcodePrefix, barcodeStart, barcodeEnd, leader) {
  var barcodes = [];
  var quantity;

  barcodeStart = parseInt(barcodeStart);
  barcodeEnd = parseInt(barcodeEnd);

  if (!isNaN(barcodeStart) && isNaN(barcodeEnd)) {
    barcodeEnd = barcodeStart;
  }
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

  if (leader) {
    // Add leader to the start of the barcode array
    barcodes.unshift('leader');
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

function sendForPrint(values, template, whiteOnBlack) {
  let data = JSON.stringify({
    values: values,
    template: template,
    whiteOnBlack: whiteOnBlack
  });

  document.querySelector('body').classList.add('loading');
  document.querySelector('body').classList.remove('success');
  document.querySelector('body').classList.remove('failure');

  var printPromise = fetch('/print', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data
  });

  console.log(data);

  console.log('Sent');

  printPromise.then(function (response) {
    document.querySelector('body').classList.remove('loading');
    document.querySelector('body').classList.add('success');
    var responseText = response.text();
    console.log(responseText);
    return response.text(responseText);
  }, function (error) {
    document.querySelector('body').classList.remove('loading');
    document.querySelector('body').classList.add('failure');

    console.error(error.message);
  });
}
