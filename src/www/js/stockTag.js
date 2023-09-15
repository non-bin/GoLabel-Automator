/**
 * Automate label printing from templates, with GoLabel II
 * Common functions for all web pages
 * Copyright (C) 2023  Alice Jacka
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
**/
'use strict';

var selectedLabelVariant = // Default label variant
{
  single: 'Large',
  batch: 'Large'
};

// The empty row to add to the end of the table, when needed
const tableEmptyRow = `
<tr>
  <td>
    <input type="text" class="form-control">
  </td>
  <td>
    <input type="text" class="form-control">
  </td>
  <td>
    <button type="button" class="btn-close" aria-label="Remove Row" disabled onclick="processInput('table', 'removeRow', this)"></button>
  </td>
</tr>`;


/**
 * Run by processInput() when the inputs are updated.
 *
 * @param {string} field - The field that was updated.
 * @param {*} [params] - Extra params
 */
function updatePreview(field, ...params) {
  let value = document.getElementById(field).value;

  if (field == 'barcodeStartInput') {
    if (value == '') {
      document.getElementById('barcodeEndLabel').innerText = 'Quantity';
    } else {
      document.getElementById('barcodeEndLabel').innerText = 'Barcode Number End';
    }
  }

  let deviceName = document.getElementById('deviceNameInput').value;
  let barcodePrefix = document.getElementById('barcodePrefixInput').value;
  let barcodeStart = parseInt(document.getElementById('barcodeStartInput').value);
  let barcodeEnd = parseInt(document.getElementById('barcodeEndInput').value);

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
  let previewTable = `
  <thead>
    <tr>
      <th>Device Name</th>
      <th>Barcode</th>
      <th></th>
    </tr>
  </thead>
  <tbody>`;

  for (let i = 0; i < barcodes.length; i++) {
    previewTable += `
    <tr>
      <td>
        <input type="text" class="form-control" value="${deviceName}">
      </td>
      <td>
        <input type="text" class="form-control" value="${barcodes[i]}">
      </td>
      <td>
        <button type="button" class="btn-close" aria-label="Remove Row" onclick="processInput('table', 'removeRow', this)"></button>
      </td>
    </tr>`;
  }

  // add an empty row to the end
  previewTable += tableEmptyRow + '</tbody>';
  document.querySelector('.single .preview .table').innerHTML = previewTable;

  updateTableListeners();
}


/**
 * Read data from the preview table.
 *
 * @param {string} tableName - Which table to read (ie. preview or batch)
 * @return {*}  An object containing the data from the table
 */
function readTable(tableName) {
  let rows = document.querySelectorAll(`.${tableName} .preview .table tbody tr`);

  let deviceNames = [];
  let barcodes = [];

  // Skip the last empty row
  for (let i = 0; i < rows.length-1; i++) {
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
 * @param {string} tableName - Which table to clear (ie. single or batch)
 */
function clearTable(tableName) {
  if (tableName == 'single') {
    document.getElementById('deviceNameInput').value = '';
    document.getElementById('barcodePrefixInput').value = '';
    document.getElementById('barcodeStartInput').value = '';
    document.getElementById('barcodeEndInput').value = '';

    updateTable('', []);
  } else if (tableName == 'batch') {
    document.querySelector('.batch .preview .table tbody').innerHTML = tableEmptyRow;
    document.querySelector('.batch').style.display = 'none';
  }
}

/**
 * Called by the print buttons
 *
 * @param {string} tableName - Which table to print (ie. single or batch)
 * @param {boolean} whiteOnBlack - True to print white on black, false to print black on white
 * @param {boolean} [dbOnly] - True to only update the database
 * @return {boolean} True if the command was sent, false otherwise
 */
function print(tableName, whiteOnBlack, dbOnly) {
  let table = readTable(tableName);

  if (checkTable(table)) {
    sendForPrint(table, 'stockTag', selectedLabelVariant[tableName], whiteOnBlack, dbOnly, tableName);
  } else {
    return false;
  }

  return true;
}

/**
 * Add all rows from the single table, to the batch table
 */
function addToBatch() {
  const data = readTable('single');
  const batchTBody = document.querySelector('.batch .table tbody');

  for (let i = 0; i < data.barcodes.length; i++) {
    const newRow = document.createElement('tr')
    newRow.innerHTML = `
    <tr>
      <td>
        <input type="text" class="form-control" value="${data.deviceNames[i]}">
      </td>
      <td>
        <input type="text" class="form-control" value="${data.barcodes[i]}">
      </td>
      <td>
        <button type="button" class="btn-close" aria-label="Remove Row" onclick="processInput('table', 'removeRow', this)"></button>
      </td>
    </tr>`
    batchTBody.prepend(newRow);
  }

  if (data.barcodes.length > 0) {
    document.querySelector('.batch').style.display = 'block';
  }
}
