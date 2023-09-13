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

/**
 * Send a request to the server to regenerate the inverse files
 */
function regenerateInverses() {
  loading(true);

  var printPromise = fetch('/api/regenerateInverses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  printPromise.then(function (response) {
    loading(false);
    var responseText = response.text();
    return responseText;
  }, function (error) {
    loading(false);

    console.error(error.message);
  });
}

/**
 * Send a request to the server to change the printing enabled status
 * If an error occurs, request the current status from the server
 *
 * @param {*} enabled
 */
function sendPrintingEnabledStatus(enabled) {
  fetch('/api/printingEnabled', {
    method: 'POST',
    body: enabled,
    headers: {
      'Content-Type': 'text/plain'
    }
  }).then(function (response) {
    if (response.ok) {
      console.log('Printing enabled status updated');
      response.text().then(function (responseText) {
        setPrintingEnabledStatus(responseText === 'true');
      }, function (error) {
        console.error(error.message);
        getPrintingEnabledStatus();
        alert('Printing enabled status update failed');
      });
    } else {
      console.error('Printing enabled status update failed');
      getPrintingEnabledStatus();
      alert('Printing enabled status update failed');
    }
  }, function (error) {
    console.error(error.message);
    getPrintingEnabledStatus();
    alert('Printing enabled status update failed');
  });
}

getPrintingEnabledStatus();
/**
 * Send a request to the server to get the current printing enabled status and update the page
 *
 */
function getPrintingEnabledStatus() {
  loading(true);
  fetch('/api/printingEnabled', {
    method: 'GET'
  }).then(function (response) {
    response.text().then(function (responseText) {
      setPrintingEnabledStatus(responseText === 'true');

      loading(false);
      return;
    }, function (error) {
      console.error(error.message);

      loading(false);
      return;
    });
  }, function (error) {
    console.error(error.message);

    loading(false);
    return;
  });
}

/**
 * Update the printing enabled status on the page
 *
 * @param {*} enabled
 */
function setPrintingEnabledStatus(enabled) {
  if (enabled) {
    document.getElementById('enablePrinting').checked = true;
  } else {
    document.getElementById('disablePrinting').checked = true;
  }
}
