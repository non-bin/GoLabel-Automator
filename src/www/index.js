function processInput(field) {
  var value = document.getElementById(field).value;

  if (field == 'barcodeStartInput') {
    if (value == '') {
      document.getElementById('barcodeEndLabel').innerText = 'Quantity';
    } else {
      document.getElementById('barcodeEndLabel').innerText = 'Barcode Number End';
    }
  }

  var deviceName = document.getElementById('deviceNameInput').value;
  var barcodePrefix = document.getElementById('barcodePrefixInput').value;
  var barcodeStart = document.getElementById('barcodeStartInput').value;
  var barcodeEnd = document.getElementById('barcodeEndInput').value;
  var retestPeriod = document.getElementById('retestPeriodInput').value || 12;

  updateTable(deviceName, generateBarcodes(barcodePrefix, barcodeStart, barcodeEnd), retestPeriod);
}

function print(whiteOnBlack) {
  var deviceName = document.getElementById('deviceNameInput').value;
  var barcodePrefix = document.getElementById('barcodePrefixInput').value;
  var barcodeStart = document.getElementById('barcodeStartInput').value;
  var barcodeEnd = document.getElementById('barcodeEndInput').value;
  var retestPeriod = document.getElementById('retestPeriodInput').value || 12;

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
    previewTableBody += `<tr><td><input type="text" class="form-control" value="${deviceName}"></td><td><input type="text" class="form-control" value="${barcodes[i]}"></td><td><input type="text" class="form-control" value="${retestPeriod || 12}"></td></tr>`;
  }

  document.getElementById('previewTable').innerHTML = previewTableBody;
}

function sendForPrint(values, template, whiteOnBlack) {
  let data = JSON.stringify({
    values: values,
    template: template,
    whiteOnBlack: whiteOnBlack
  });

  loading(true);

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
    loading(false);
    var responseText = response.text();
    console.log(responseText);
    return response.text(responseText);
  }, function (error) {
    loading(false);

    console.error(error.message);
  });
}

function loading(bool) {
  if (bool) {
    document.getElementById("loadingSpinner").classList.remove('d-none');
  } else {
    document.getElementById("loadingSpinner").classList.add('d-none');
  }
}
