function setDif(elId, valor) {
  const el = document.getElementById(elId);
  el.textContent = fmt(valor);
  el.className = "dif-value " + (valor > 0 ? "dif-positive" : valor < 0 ? "dif-negative" : "dif-zero");
}

function actualizarLabelFecha(fecha) {
  const tags = ["tagFechaGas","tagFechaPet"];
  tags.forEach(t => { document.getElementById(t).textContent = fecha || "—"; });
  document.getElementById("labelFecha").textContent = "Mostrando: " + (fecha || "—");
}

function limpiarFormulario() {
  campos.forEach(id => { document.getElementById(id).value = ""; });
  recalcular();
  mostrarMsg("msgGuardar","","");
}

function mostrarMsg(elId, tipo, texto) {
  const el = document.getElementById(elId);
  el.className = "status-msg " + tipo;
  el.textContent = texto;
  el.style.display = texto ? "inline-block" : "none";
}

function setLoader(on) {
  document.getElementById("loader").style.display = on ? "flex" : "none";
}

function usarHoy() {
  const hoy = new Date();
  const iso = hoy.toISOString().split("T")[0];
  document.getElementById("fechaSelector").value = iso;
  actualizarLabelFecha(iso);
}

function getFechaSeleccionada() {
  return document.getElementById("fechaSelector").value;
}
