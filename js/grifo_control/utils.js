function getVal(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function fmt(n) {
  return n.toFixed(2);
}
