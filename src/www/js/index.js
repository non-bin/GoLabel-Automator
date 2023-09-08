var selectedLabelVariant = 'Large';
const tableListener = function () {
  processInput('table', 'lastRow', this);
};
updateTableListeners();

const tableEmptyRow = `
<tr>
  <td>
    <input type="text" class="form-control">
  </td>
  <td>
    <input type="text" class="form-control">
  </td>
  <td>
    <input type="text" class="form-control">
  </td>
  <td>
    <input type="text" class="form-control">
  </td>
</tr>`;

/**
 * Run by processInput() when the inputs are updated.
 *
 * @param {string} field - The field that was updated.
 * @param {*} [params] - Extra params
 */
function updatePreview(field, ...params) {
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
  var barcodeStart = parseInt(document.getElementById('barcodeStartInput').value) || undefined;
  var barcodeEnd = parseInt(document.getElementById('barcodeEndInput').value) || undefined;
  var retestPeriod = parseInt(document.getElementById('retestPeriodInput').value) || undefined;

  if (operatorName == '' &&
      deviceName == '' &&
      barcodePrefix == '' &&
      barcodeStart == '' &&
      barcodeEnd == '' &&
      retestPeriod == '') {
    clearTable();
  } else if (barcodeStart != undefined && barcodeEnd != undefined && barcodeStart > barcodeEnd) {
    updateTable(deviceName, generateBarcodes(barcodeStart, barcodeEnd, barcodePrefix), retestPeriod || 12, operatorName);
  } else {
    updateTable(deviceName, generateBarcodes(barcodeEnd, barcodeStart, barcodePrefix), retestPeriod || 12, operatorName);
  }
}

/**
 * Check if the table is valid.
 *
 * @param {*} table - The table to check.
 * @return {*} True if the table is valid, false otherwise.
 */
function checkTable(table) {
  // Empty check
  let length = 0;
  for (const key in table) {
    if (Object.hasOwnProperty.call(table, key)) {
      length += table[key].length;
    }
  }
  if (length < 1) {
    alert('Please enter some data');
    return false;
  }

  // Operator name check
  for (const name of table.operatorNames) {
    if (name.length < 1) {
      alert('Please enter an operator name for all rows');
      return false;
    }
  }

  return true;
}

/**
 * Update the preview table.
 *
 * @param {string} deviceName
 * @param {string[]} barcodes
 * @param {number} retestPeriod
 * @param {string} operatorName
 */
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


/**
 * Read data from the preview table.
 *
 * @param {boolean} [whiteOnBlack] - True to add a leader to the start of the arrays
 * @return {*}  An object containing the data from the table
 */
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
    operatorNames.push(rows[i].querySelectorAll('td')[3].querySelector('input').value);
  }

  return {
    deviceNames: deviceNames,
    barcodes: barcodes,
    retestPeriods: retestPeriods,
    operatorNames: operatorNames
  };
}

/**
 * Clear the inputs and regenerate an empty table
 *
 */
function clearTable() {
  document.getElementById('operatorNameInput').value = '';
  document.getElementById('deviceNameInput').value = '';
  document.getElementById('barcodePrefixInput').value = '';
  document.getElementById('retestPeriodInput').value = '';
  document.getElementById('barcodeStartInput').value = '';
  document.getElementById('barcodeEndInput').value = '';

  updateTable('', [], '', '')
}

/**
 * Called by the print buttons
 *
 * @param {boolean} whiteOnBlack - True to print white on black, false to print black on white
 * @param {boolean} [dbOnly] - True to only update the database
 * @return {boolean} True if the command was sent, false otherwise
 */
function print(whiteOnBlack, dbOnly) {
  let table = readTable(whiteOnBlack);

  if (checkTable(table)) {
    sendForPrint(table, 'testTag', selectedLabelVariant, whiteOnBlack, dbOnly)
  } else {
    return false;
  }

  return true;
}
