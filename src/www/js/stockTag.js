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

  var deviceName = document.getElementById('deviceNameInput').value;
  var barcodePrefix = document.getElementById('barcodePrefixInput').value;
  var barcodeStart = parseInt(document.getElementById('barcodeStartInput').value);
  var barcodeEnd = parseInt(document.getElementById('barcodeEndInput').value);

  if (!Number.isInteger(barcodeStart)) {
    barcodeStart = undefined;
  }
  if (!Number.isInteger(barcodeEnd)) {
    barcodeEnd = undefined;
  }

  if (deviceName == '' &&
      barcodePrefix == '' &&
      barcodeStart == '' &&
      barcodeEnd == '') {
    clearTable();
  } else if (barcodeStart != undefined && barcodeEnd != undefined && barcodeStart > barcodeEnd) {
    updateTable(deviceName, generateBarcodes(barcodeStart, barcodeEnd, barcodePrefix));
  } else {
    updateTable(deviceName, generateBarcodes(barcodeEnd, barcodeStart, barcodePrefix));
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
function updateTable(deviceName, barcodes) {
  var previewTableBody = '<tr><th>Device Name</th><th>Barcode</th></tr>';

  for (let i = 0; i < barcodes.length; i++) {
    previewTableBody += `<tr><td><input type="text" class="form-control" value="${deviceName}"></td><td><input type="text" class="form-control" value="${barcodes[i]}"></td></tr>`;
  }

  // add an empty row to the end
  previewTableBody += tableEmptyRow;
  document.getElementById('previewTable').innerHTML = previewTableBody;

  updateTableListeners();
}


/**
 * Read data from the preview table.
 *
 * @return {*}  An object containing the data from the table
 */
function readTable() {
  let rows = document.querySelectorAll('#previewTable tr');

  let deviceNames = [];
  let barcodes = [];

  // Skip the header row, and last empty row
  for (let i = 1; i < rows.length-1; i++) {
    deviceNames.push(rows[i].querySelectorAll('td')[0].querySelector('input').value);
    barcodes.push(rows[i].querySelectorAll('td')[1].querySelector('input').value);
  }

  return {
    deviceNames: deviceNames,
    barcodes: barcodes
  };
}

/**
 * Clear the inputs and regenerate an empty table
 *
 */
function clearTable() {
  document.getElementById('deviceNameInput').value = '';
  document.getElementById('barcodePrefixInput').value = '';
  document.getElementById('barcodeStartInput').value = '';
  document.getElementById('barcodeEndInput').value = '';

  updateTable('', []);
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
    sendForPrint(table, 'stockTag', selectedLabelVariant, whiteOnBlack, dbOnly)
  } else {
    return false;
  }

  return true;
}
