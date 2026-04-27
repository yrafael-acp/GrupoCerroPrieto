async function consultarFecha() {
  const fecha = getFechaSeleccionada();
  if (!fecha) { alert("Selecciona una fecha primero."); return; }
  actualizarLabelFecha(fecha);
  setLoader(true);
  mostrarMsg("msgGuardar","","");
  try {
    const empresa = sessionStorage.getItem('empresaGrifo') || 'ACPAGRO';
    const url = SCRIPT_URL + '?action=getGrifoControl&fecha=' + fecha + '&empresa=' + encodeURIComponent(empresa);
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === "OK" && data.registro) {
      const r = data.registro;
      document.getElementById("gas_falta").value = r.gas_falta || "";
      document.getElementById("gas_sap").value   = r.gas_sap   || "";
      document.getElementById("gas_tanque").value= r.gas_tanque|| "";
      document.getElementById("gas_iso").value   = r.gas_iso   || "";
      document.getElementById("pet_falta").value = r.pet_falta || "";
      document.getElementById("pet_sap").value   = r.pet_sap   || "";
      document.getElementById("pet_tanque").value= r.pet_tanque|| "";
      document.getElementById("pet_iso").value   = r.pet_iso   || "";
      document.getElementById("pet_hipo").value  = r.pet_hipo  || "";
      recalcular();
      mostrarMsg("msgGuardar","status-ok","✓ Registro cargado");
    } else {
      limpiarFormulario();
      mostrarMsg("msgGuardar","status-load","Sin registro para esta fecha");
    }
  } catch(e) {
    mostrarMsg("msgGuardar","status-err","Error de conexión");
  }
  setLoader(false);
}

async function guardarRegistro() {
  const fecha = getFechaSeleccionada();
  if (!fecha) { alert("Selecciona una fecha antes de guardar."); return; }

  const payload = {
    empresa: sessionStorage.getItem('empresaGrifo') || 'ACPAGRO',
    user: sessionStorage.getItem('sessionGrifo') || 'S/U',
    action: "saveGrifoControl",
    fecha,
    gas_falta:  getVal("gas_falta"),
    gas_sap:    getVal("gas_sap"),
    gas_tanque: getVal("gas_tanque"),
    gas_iso:    getVal("gas_iso"),
    pet_falta:  getVal("pet_falta"),
    pet_sap:    getVal("pet_sap"),
    pet_tanque: getVal("pet_tanque"),
    pet_iso:    getVal("pet_iso"),
    pet_hipo:   getVal("pet_hipo"),
    gas_totalSis: parseFloat(document.getElementById("gas_totalSis").textContent),
    gas_totalFis: parseFloat(document.getElementById("gas_totalFis").textContent),
    gas_dif:      parseFloat(document.getElementById("gas_dif").textContent),
    pet_totalSis: parseFloat(document.getElementById("pet_totalSis").textContent),
    pet_totalFis: parseFloat(document.getElementById("pet_totalFis").textContent),
    pet_dif:      parseFloat(document.getElementById("pet_dif").textContent)
  };

  setLoader(true);
  mostrarMsg("msgGuardar","status-load","Guardando...");

  try {
    const resp = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (data.status === "OK") {
      mostrarMsg("msgGuardar","status-ok","✓ Guardado correctamente");
    } else {
      mostrarMsg("msgGuardar","status-err","Error: " + (data.message || "desconocido"));
    }
  } catch(e) {
    mostrarMsg("msgGuardar","status-err","Error de conexión");
  }
  setLoader(false);
}
