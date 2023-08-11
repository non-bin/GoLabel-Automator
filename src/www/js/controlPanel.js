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
