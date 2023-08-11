function loading(bool) {
  if (bool) {
    document.getElementById("loadingSpinner").classList.remove('d-none');
  } else {
    document.getElementById("loadingSpinner").classList.add('d-none');
  }
}
