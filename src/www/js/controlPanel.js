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
    console.log(responseText);
    return responseText;
  }, function (error) {
    loading(false);

    console.error(error.message);
  });
}

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
function getPrintingEnabledStatus() {
  loading(true);
  fetch('/api/printingEnabled', {
    method: 'GET'
  }).then(function (response) {
    response.text().then(function (responseText) {
      console.log(responseText);

      if (responseText === 'true') {
        document.getElementById('enablePrinting').checked = true;
      } else if (responseText === 'false') {
        document.getElementById('disablePrinting').checked = true;
      } else {
        console.error('Invalid response from server');
      }

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
