/* ============================================================
   HISTORIAL
============================================================ */
function renderHistorial(lista) {
    const bodyEl = document.getElementById('historialBody');
    if (!bodyEl) return;

    const desdeRaw = document.getElementById('filtroDesde')?.value;
    const hastaRaw = document.getElementById('filtroHasta')?.value;

    let filtrada = [...lista].sort((a, b) => {
        return (parseFechaBase(b.fecha)?.getTime() || 0) - (parseFechaBase(a.fecha)?.getTime() || 0);
    });

    if (desdeRaw || hastaRaw) {
        filtrada = filtrada.filter(h => {
            const fh = parseFechaBase(h.fecha);
            if (!fh) return false;
            fh.setHours(0,0,0,0);
            const t = fh.getTime();
            const okD = !desdeRaw || t >= new Date(desdeRaw + 'T00:00:00').getTime();
            const okH = !hastaRaw || t <= new Date(hastaRaw + 'T23:59:59').getTime();
            return okD && okH;
        });
    }

    if (!filtrada.length) {
        bodyEl.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:var(--text-muted);">Sin registros para el rango seleccionado.</td></tr>';
        return;
    }

    bodyEl.innerHTML = filtrada.map(h => {
        const isIngreso = h.mov?.toUpperCase().includes('INGRESO');
        return `<tr>
            <td data-label="Fecha">${(h.fecha || '').replace('T',' ').substring(0,16)}</td>
            <td data-label="Operación"><span class="badge ${isIngreso ? 'badge-ingreso' : 'badge-salida'}">${h.mov}</span></td>
            <td data-label="Producto">${h.prod}</td>
            <td data-label="Cantidad" style="font-family:'DM Mono',monospace; font-weight:700;">${h.cant}</td>
            <td data-label="Referencia">${h.ref || '—'}</td>
            <td data-label="Saldo Final" style="font-family:'DM Mono',monospace; font-weight:700;">${h.saldo}</td>
        </tr>`;
    }).join('');
}

function aplicarFiltros() { renderHistorial(datosCache); }

function limpiarFiltros() {
    document.getElementById('filtroDesde').value = '';
    document.getElementById('filtroHasta').value = '';
    renderHistorial(datosCache);
}

function exportarExcel() {
    const desdeRaw = document.getElementById('filtroDesde')?.value;
    const hastaRaw = document.getElementById('filtroHasta')?.value;

    let datos = [...datosCache].sort((a,b) => (parseFechaBase(b.fecha)?.getTime()||0) - (parseFechaBase(a.fecha)?.getTime()||0));
    if (desdeRaw || hastaRaw) {
        datos = datos.filter(h => {
            const fh = parseFechaBase(h.fecha);
            if (!fh) return false;
            fh.setHours(0,0,0,0);
            const t = fh.getTime();
            const okD = !desdeRaw || t >= new Date(desdeRaw + 'T00:00:00').getTime();
            const okH = !hastaRaw || t <= new Date(hastaRaw + 'T23:59:59').getTime();
            return okD && okH;
        });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(datos);
    XLSX.utils.book_append_sheet(wb, ws, 'Historial');
    XLSX.writeFile(wb, `Reporte_ACP_${new Date().toISOString().substring(0,10)}.xlsx`);
}
