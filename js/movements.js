/* ============================================================
   REGISTRO DE MOVIMIENTO
============================================================ */
function toggleCisterna() {
    document.getElementById('extraData').style.display =
        document.getElementById('tipoMov').value === 'ingreso' ? 'block' : 'none';
}

async function procesarMovimiento() {
    const cant = parseFloat(document.getElementById('cant').value);
    if (isNaN(cant) || cant <= 0) { alert('Ingresa una cantidad válida mayor a 0.'); return; }

    const btn = document.getElementById('btnRegistrar');
    btn.textContent = '⏳ Registrando…';
    btn.disabled = true;

    const payload = {
        action: 'write',
        mov: document.getElementById('tipoMov').value.toUpperCase(),
        prod: document.getElementById('prod').value.toUpperCase(),
        cant,
        ref: document.getElementById('referencia').value || 'DESPACHO',
        fechaManual: document.getElementById('fechaMov').value || null
    };

    try {
        const res = await apiPost(payload);
        document.getElementById('cant').value = '';
        document.getElementById('referencia').value = '';
        document.getElementById('fechaMov').value = '';
        alert(res.message || '✅ Registro guardado correctamente.');
        await cargarDatos();
    } catch (e) {
        if (!handleAuthError(e)) alert(e.message || '❌ Error de conexión con el servidor.');
    } finally {
        btn.textContent = 'Guardar Registro';
        btn.disabled = false;
    }
}
