function processRPProdList(event) {
  const input = event.target.parentElement.querySelector('input#formFile');

  const reader = new FileReader();
  reader.onload = function(){
    const input = reader.result;

    const sequence = input.match(/"Sequence: (.*)"/)[1];

    let output = input;
    output = input.replace(/;;+/g, ';');
    output = output.replace(/"Printed.*?Sequence:[^\r\n]*/gs, '');

    let key = output.match(/"Code No".*/)[0];

    let lines = output.split(/[\r\n]+/);
    lines = lines.filter(line => (
      line !== '' &&
      line !== ';' &&
      line !== key
    ));

    if (sequence == 'Category' || sequence == 'Sequence #' || sequence == 'Group') {
      let groupType = 'Group';
      if (sequence == 'Category') {
        groupType = 'Category';
      }
      const originalKey = key;
      key = `"${groupType}";${key}`;

      const inputLines = lines;
      lines = [key];
      groupName = '';
      for (let i = 0; i < inputLines.length; i++) {
        const line = inputLines[i];
        if (line.startsWith('"Group: ')) {
          groupName = line.match(/"Group: (.*?) *"/)[1];
        } else if (inputLines[i] != originalKey) {
          lines.push(`"${groupName}";${line}`);
        }
      }
    }

    output = lines.join('\n');
    writeFile(output);
  };
  reader.readAsText(input.files[0]);
};

function writeFile(contents) {
  var pom = document.createElement('a');
  pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(contents));
  pom.setAttribute('download', 'Product Listing.csv');
  pom.click();
}
