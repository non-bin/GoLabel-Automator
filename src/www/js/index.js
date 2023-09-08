var labelSelectorValue = 'Large';
const tableListener = function () {
  processInput('table', 'lastRow', this);
};
updateTableListeners();

const tableEmptyRow = `<tr><td><input type="text" class="form-control"></td><td><input type="text" class="form-control"></td><td><input type="text" class="form-control"></td><td><input type="text" class="form-control"></td></tr>`

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
          document.querySelector('#previewTable tbody').appendChild(document.createElement('tr')).innerHTML = tableEmptyRow;
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

    var operatorName = document.getElementById('operatorNameInput').value;
    var deviceName = document.getElementById('deviceNameInput').value;
    var barcodePrefix = document.getElementById('barcodePrefixInput').value;
    var barcodeStart = document.getElementById('barcodeStartInput').value;
    var barcodeEnd = document.getElementById('barcodeEndInput').value;
    var retestPeriod = document.getElementById('retestPeriodInput').value;

    if (operatorName == '' &&
        deviceName == '' &&
        barcodePrefix == '' &&
        barcodeStart == '' &&
        barcodeEnd == '' &&
        retestPeriod == '') {
      clearTable();
      return;
    }

    if (barcodeStart < barcodeEnd) {
      updateTable(deviceName, generateBarcodes(barcodePrefix, barcodeStart, barcodeEnd), retestPeriod || 12, operatorName);
    } else {
      updateTable(deviceName, generateBarcodes(barcodePrefix, barcodeEnd, barcodeStart), retestPeriod || 12, operatorName);
    }
  }
}

function print(whiteOnBlack, dbOnly) {
  let table = readTable(whiteOnBlack);
  if (table == 'MISSING_OPERATOR_NAME') {
    alert('Please enter an operator name for all rows');
    return false;
  }

  if (dbOnly) {
    sendForPrint(table, 'testTag', 'dbOnly');
  } else {
    sendForPrint(table, 'testTag', labelSelectorValue, whiteOnBlack);
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

function updateTable(deviceName, barcodes, retestPeriod, operatorName) {
  var previewTableBody = '<tr><th>Device Name</th><th>Barcode</th><th>Retest Period</th><th>Operator Name</th></tr>';

  for (let i = 0; i < barcodes.length; i++) {
    previewTableBody += `<tr><td><input type="text" class="form-control" value="${deviceName}"></td><td><input type="text" class="form-control" value="${barcodes[i]}"></td><td><input type="text" class="form-control" value="${retestPeriod || 12}"></td><td><input type="text" class="form-control" value="${operatorName}"></td></tr>`;
  }

  // add an empty row to the end
  previewTableBody += tableEmptyRow;
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
  let operatorNames = [];

  if (whiteOnBlack) {
    deviceNames.push('leader');
    barcodes.push('leader');
    retestPeriods.push(0);
    operatorNames.push('leader');
  }

  // Skip the header row, and last empty row
  for (let i = 1; i < rows.length-1; i++) {
    deviceNames.push(rows[i].querySelectorAll('td')[0].querySelector('input').value);
    barcodes.push(rows[i].querySelectorAll('td')[1].querySelector('input').value);
    retestPeriods.push(rows[i].querySelectorAll('td')[2].querySelector('input').value);

    let operatorName = rows[i].querySelectorAll('td')[3].querySelector('input').value;
    if (operatorName.length == 0) {
      return 'MISSING_OPERATOR_NAME';
    }
    operatorNames.push(operatorName);
  }

  return {
    deviceNames: deviceNames,
    barcodes: barcodes,
    retestPeriods: retestPeriods,
    operatorNames: operatorNames
  };
}

function updateTableListeners() {
  var inputs = document.querySelectorAll('#previewTable tr input');
  for (const input of inputs) {
    input.removeEventListener('input', tableListener);
  }

  var lastRowInputs = document.querySelectorAll('#previewTable tr:last-child input');
  for (const input of lastRowInputs) {
    input.addEventListener('input', tableListener);
  }
}

function clearTable() {
  console.log('Clearing');
  document.getElementById('operatorNameInput').value = '';
  document.getElementById('deviceNameInput').value = '';
  document.getElementById('barcodePrefixInput').value = '';
  document.getElementById('retestPeriodInput').value = '';
  document.getElementById('barcodeStartInput').value = '';
  document.getElementById('barcodeEndInput').value = '';

  updateTable('', [], '', '')
}
