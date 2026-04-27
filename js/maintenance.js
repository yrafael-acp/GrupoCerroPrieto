/* ============================================================
   FILTROS Y MANTENIMIENTO
============================================================ */
async function gestionarFiltros(accion, tipo, equipo = '') {
    try {
        await apiPost({ action: 'updateFiltros', subAction: accion, tipo, equipo });
        await cargarDatos();
    } catch (e) {
        if (!handleAuthError(e)) alert(e.message || 'Error al actualizar filtros.');
    }
}
