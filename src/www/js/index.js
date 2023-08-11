var labelSelectorValue = 'Large';
const tableListener = function () {
  processInput('table', 'lastRow', this);
};
updateTableListeners();

function processInput(field, ...params) {
  if (field == 'labelSelector') {
    labelSelectorValue = params[0];

    const options = document.getElementsByClassName('labelSelectorItems');
    for (let i = 0; i < options.length; i++) {
      const element = options[i];
      element.classList.remove('active');
    };
    document.getElementById('labelSelector'+labelSelectorValue).classList.add('active');
    document.getElementById('labelSelectorDropdown').innerText = labelSelectorValue;
  } else if (field == 'table') {
    if (params[0] == 'lastRow') {
      const rowInputs = params[1].parentElement.parentElement.querySelectorAll('input');

      for (const input of rowInputs) {
        if (input.value != '') {
          document.querySelector('#previewTable tbody').appendChild(document.createElement('tr')).innerHTML = '<td><input type="text" class="form-control" value=""></td><td><input type="text" class="form-control" value=""></td><td><input type="text" class="form-control" value=""></td>';
          updateTableListeners();
        }
      }
    }
  } else {
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
}

function print(whiteOnBlack, dbOnly) {
  if (dbOnly) {
    sendForPrint(readTable(whiteOnBlack), 'testTag', 'dbOnly');
  } else {
    sendForPrint(readTable(whiteOnBlack), 'testTag', labelSelectorValue, whiteOnBlack);
  }
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

  // add an empty row to the end
  previewTableBody += `<tr><td><input type="text" class="form-control"></td><td><input type="text" class="form-control"></td><td><input type="text" class="form-control"></td></tr>`;
  document.getElementById('previewTable').innerHTML = previewTableBody;

  updateTableListeners();
}

function sendForPrint(values, template, variant, whiteOnBlack) {
  let data = JSON.stringify({
    variant: variant,
    values: values,
    template: template,
    whiteOnBlack: whiteOnBlack
  });

  loading(true);

  var printPromise = fetch('/api/print', {
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
    return responseText;
  }, function (error) {
    loading(false);

    console.error(error.message);
  });
}

function readTable(whiteOnBlack) {
  let rows = document.querySelectorAll('#previewTable tr');

  let deviceNames = [];
  let barcodes = [];
  let retestPeriods = [];

  if (whiteOnBlack) {
    deviceNames.push('leader');
    barcodes.push('leader');
    retestPeriods.push(0);
  }

  // Skip the header row, and last empty row
  for (let i = 1; i < rows.length-1; i++) {
    deviceNames.push(rows[i].querySelectorAll('td')[0].querySelector('input').value);
    barcodes.push(rows[i].querySelectorAll('td')[1].querySelector('input').value);
    retestPeriods.push(rows[i].querySelectorAll('td')[2].querySelector('input').value);
  }

  return {
    deviceNames: deviceNames,
    barcodes: barcodes,
    retestPeriods: retestPeriods,
  };
}

function updateTableListeners() {
  var inputs = document.querySelectorAll('#previewTable tr input');
  for (const input of inputs) {
    input.removeEventListener('input', tableListener);
    console.log(input);
  }

  var lastRowInputs = document.querySelectorAll('#previewTable tr:last-child input');
  for (const input of lastRowInputs) {
    input.addEventListener('input', tableListener);
    console.log(input);
  }
}
