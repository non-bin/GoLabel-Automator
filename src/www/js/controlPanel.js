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
function getPrintingEnabledStatus() {
  loading(true);
  fetch('/api/printingEnabled', {
    method: 'GET'
  }).then(function (response) {
    response.text().then(function (responseText) {
      console.log(responseText);

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

function setPrintingEnabledStatus(enabled) {
  if (enabled) {
    document.getElementById('enablePrinting').checked = true;
  } else {
    document.getElementById('disablePrinting').checked = true;
  }
}
