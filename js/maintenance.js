/* ============================================================
   FILTROS Y MANTENIMIENTO
============================================================ */
async function gestionarFiltros(accion, tipo, equipo = '') {
    try {
        const res = await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(withEmpresa({ action: 'updateFiltros', subAction: accion, tipo, equipo }))
        });
        if (res.ok) cargarDatos();
    } catch(e) { alert('Error al actualizar filtros.'); }
}
