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
 */
'use strict';

/**
 * Enable or disable the loading spinner
 *
 * @param {boolean} enabled
 * @param {string} [spinnerID] - Defaults to 'loadingSpinner'
 */
function loading(enabled, spinnerID) {
  spinnerID = spinnerID || 'loadingSpinner';
  if (enabled) {
    document.getElementById(spinnerID).classList.remove('d-none');
  } else {
    document.getElementById(spinnerID).classList.add('d-none');
  }
}

/**
 * Process input from the user, and update the preview table
 *
 * @param {string} field - The field that was changed
 * @param {*} [params] - Any additional parameters
 */
function processInput(field, ...params) {
  if (field == 'labelSelector') {
    let tableName = params[0]
    selectedLabelVariant[tableName] = params[1].toLowerCase() == 'small' ? 'Small' : 'Large';

    // Set which label is now selected
    const options = document.querySelectorAll(`.${tableName} .labelSelectorItems`);
    for (let i = 0; i < options.length; i++) {
      const element = options[i];
      element.classList.remove('active');
    };

    document.querySelector(`.${tableName} .labelSelector${selectedLabelVariant[tableName]}`).classList.add('active');
    document.querySelector(`.${tableName} .labelSelectorDropdownButton`).innerText = selectedLabelVariant[tableName];

  } else if (field == 'table') {
    if (params[0] == 'lastRow') {
      // If the last fow is not empty, add a new empty row
      const row = params[1].parentElement.parentElement;
      const rowInputs = row.querySelectorAll('input');
      for (const input of rowInputs) {
        if (input.value != '') {
          row.querySelector('button.btn-close').disabled = false;
          row.parentElement.appendChild(document.createElement('tr')).innerHTML = tableEmptyRow;
          updateTableListeners();
        }
      }
    } else if (params[0] == 'removeRow') {
      const row = params[1].parentElement.parentElement;
      const sectionContainer = row.parentElement.parentElement.parentElement.parentElement;

      if (sectionContainer.classList.contains('batch') && row.parentElement.childElementCount <= 2) {
        sectionContainer.style.display = 'none';
      }
      row.remove();
    }
  } else {
    updatePreview(field, ...params);
  }
}

/**
 * Generate a list of barcodes from the given parameters
 *
 * @param {number} barcodeEnd - The last barcode number, or the quantity if barcodeStart is undefined
 * @param {number} [barcodeStart] - The first barcode number, or undefined to use barcodeEnd as a quantity
 * @param {string} [barcodePrefix] - A string to put before the number
 * @return {*}
 */
function generateBarcodes(barcodeEnd, barcodeStart, barcodePrefix) {
  barcodePrefix = barcodePrefix || '';

  let barcodes = [];
  let quantity;

  // If only a starting number is provided, set the end to the start
  if (barcodeStart !== undefined && barcodeEnd === undefined) {
    barcodeEnd = barcodeStart;
  }

  // If no start is provided, then end represents the quantity
  if (barcodeStart === undefined) {
    quantity = barcodeEnd || 1; // Default to 1
  } else { // Calculate the quantity as you would expect
    quantity = barcodeEnd - barcodeStart + 1;
  }

  if (barcodeStart === undefined) {
    // If no start is provided, then generate a list of barcodes using only the prefix
    barcodes = Array(quantity).fill(barcodePrefix);
  } else {
    // Generate a list of barcodes using the prefix and incrementing numbers
    for (let i = 0; i < quantity; i++) {
      barcodes.push(barcodePrefix + (barcodeStart + i));
    }
  }

  return barcodes;
}

/**
 * Send a request to the server to print the given values
 *
 * @param {*} values - The object of values to print
 * @param {string} template - Which template to use
 * @param {string} variant - Which template variant to use
 * @param {boolean} [whiteOnBlack] - True to print white on black, false to print black on white
 * @param {boolean} [dbOnly] - True to only update the database, false to print
 * @param {string} [tableName] - The name of the table to print (used for the loading spinner)
 */
function sendForPrint(values, template, variant, whiteOnBlack, dbOnly, tableName, overrideLimit) {
  if (dbOnly) {
    variant = 'dbOnly';
  } else {
    if (whiteOnBlack && !overrideLimit && values.barcodes.length > 20) {
      if (!splitModal) {
        splitModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('splitModal'));
      }
      splitModal.show();
      document.getElementById('splitRemaining').innerText = values.barcodes.length;

      window.printOptionsStore = {
        values: values,
        template: template,
        variant: variant,
        whiteOnBlack: whiteOnBlack,
        tableName: tableName
      };

      return;
    }
  }

  let data = JSON.stringify({
    variant: variant,
    values: values,
    template: template,
    whiteOnBlack: whiteOnBlack
  });

  loading(true, tableName == 'batch' ? 'batchLoadingSpinner' : 'loadingSpinner');

  let printPromise = fetch('/api/print', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data
  });

  console.log(data);

  console.log('Sent');

  printPromise.then(function (response) {
    loading(false, tableName == 'batch' ? 'batchLoadingSpinner' : 'loadingSpinner');
    return response.text();
  }, function (error) {
    loading(false, tableName == 'batch' ? 'batchLoadingSpinner' : 'loadingSpinner');

    console.error(error.message);
  });
}

var splitModal;

function printSplit(split) {
  const options = window.printOptionsStore;

  let splitSize = document.getElementById('splitSize').value;

  if (split) {
    let splitValues = {};
    console.log(options.values);
    for (const key in options.values) {
      if (Object.hasOwnProperty.call(options.values, key)) {
        splitValues[key] = options.values[key].splice(0, splitSize);
      }
    }

    if (options.values['barcodes'].length < 1) {
      splitModal.hide();
      sendForPrint(splitValues, options.template, options.variant, options.whiteOnBlack, false, options.tableName, true);
      return;
    } else {
      document.getElementById('splitRemaining').innerText = options.values.barcodes.length;
      sendForPrint(splitValues, options.template, options.variant, options.whiteOnBlack, false, options.tableName, true);
    }

    sendForPrint(splitValues, options.template, options.variant, options.whiteOnBlack, false, options.tableName, true);
  } else {
    sendForPrint(options.values, options.template, options.variant, options.whiteOnBlack, false, options.tableName, true);
  }
}

/**
 * Added as an input listener to the inputs of the last row of the table
 */
const tableListener = function () {
  processInput('table', 'lastRow', this);
};

document.addEventListener('DOMContentLoaded', function () {
  updateTableListeners();
});
/**
 * Remove all listeners from the table, then add them to the last row
 */
function updateTableListeners() {
  let inputs = document.querySelectorAll('.preview .table tbody tr input');
  for (const input of inputs) {
    input.removeEventListener('input', tableListener);
  }

  let lastRowInputs = document.querySelectorAll('.preview .table tbody tr:last-child input');
  for (const input of lastRowInputs) {
    input.addEventListener('input', tableListener);
  }
}

/*!
 * Color mode toggler for Bootstrap's docs (https://getbootstrap.com/)
 * Copyright 2011-2023 The Bootstrap Authors
 * Licensed under the Creative Commons Attribution 3.0 Unported License.
 */
(() => {
  'use strict'

  const getStoredTheme = () => localStorage.getItem('theme')
  const setStoredTheme = theme => localStorage.setItem('theme', theme)

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme()
    if (storedTheme) {
      return storedTheme
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const setTheme = theme => {
    if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-bs-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme)
    }
  }

  setTheme(getPreferredTheme())

  const showActiveTheme = (theme, focus = false) => {
    const themeSwitcher = document.querySelector('#bd-theme')

    if (!themeSwitcher) {
      return
    }

    const themeSwitcherText = document.querySelector('#bd-theme-text')
    const activeThemeIcon = document.querySelector('.theme-icon-active use')
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`)
    const svgOfActiveBtn = btnToActive.querySelector('svg use').getAttribute('href')

    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
      element.classList.remove('active')
      element.setAttribute('aria-pressed', 'false')
    })

    btnToActive.classList.add('active')
    btnToActive.setAttribute('aria-pressed', 'true')
    activeThemeIcon.setAttribute('href', svgOfActiveBtn)
    const themeSwitcherLabel = `${themeSwitcherText.textContent} (${btnToActive.dataset.bsThemeValue})`
    themeSwitcher.setAttribute('aria-label', themeSwitcherLabel)

    if (focus) {
      themeSwitcher.focus()
    }
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const storedTheme = getStoredTheme()
    if (storedTheme !== 'light' && storedTheme !== 'dark') {
      setTheme(getPreferredTheme())
    }
  })

  window.addEventListener('DOMContentLoaded', () => {
    showActiveTheme(getPreferredTheme())

    document.querySelectorAll('[data-bs-theme-value]')
      .forEach(toggle => {
        toggle.addEventListener('click', () => {
          let theme = toggle.getAttribute('data-bs-theme-value')

          // Added this to allow for a toggle button
          if (theme == 'toggle') {
            theme = (getStoredTheme() == 'light') ? 'dark' : 'light';
          }

          setStoredTheme(theme)
          setTheme(theme)
          showActiveTheme(theme, true)
        })
      })
  })
})()
