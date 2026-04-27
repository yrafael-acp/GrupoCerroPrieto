/* ============================================================
   UI UPDATE
============================================================ */
function actualizarUI(data) {
    stockTotalDiesel  = parseFloat(data.stocks?.diesel)  || 0;
    stockTotalGasohol = parseFloat(data.stocks?.gasohol) || 0;

    document.getElementById('sDiesel').textContent  = stockTotalDiesel.toFixed(2);
    document.getElementById('sGasohol').textContent = stockTotalGasohol.toFixed(2);

    actualizarDesgloseLocal();

    const f60  = document.getElementById('f60');
    const f100 = document.getElementById('f100');
    if (f60  && data.filtros) f60.textContent  = data.filtros.cf60  ?? '—';
    if (f100 && data.filtros) f100.textContent = data.filtros.cf100 ?? '—';

    const hoy = new Date(); hoy.setHours(0,0,0,0);
    if (data.equipos?.length) {
        document.getElementById('mantoBody').innerHTML = data.equipos.map(e => {
            const fManto = parseFechaBase(e.ult);
            const diff   = fManto ? Math.floor((hoy - fManto) / 86400000) : 0;
            const css    = diff >= 90 ? 'badge-danger' : diff >= 85 ? 'badge-warn' : 'badge-ok';
            const label  = diff >= 90 ? 'VENCIDO' : diff >= 85 ? 'PRÓXIMO' : 'OK';

            const tipoFiltro = e.f?.includes('CF60') ? 'cf60' : e.f?.includes('CF100') ? 'cf100' : 'malla';
            const btnReset   = getCurrentRole() === 'ADMIN'
                ? `<td data-label="Acción"><button class="btn btn-primary btn-sm" onclick="gestionarFiltros('reset','${tipoFiltro}','${e.id}')">Reset</button></td>`
                : '';

            return `<tr>
                <td data-label="Equipo"><strong>${e.id}</strong></td>
                <td data-label="Filtro">${e.f ?? '—'}</td>
                <td data-label="Último Mant.">${e.ult ?? '—'}</td>
                <td data-label="Días">${diff} d</td>
                <td data-label="Estado"><span class="badge ${css}">${label}</span></td>
                ${btnReset}
            </tr>`;
        }).join('');
    }
}

function actualizarDesgloseLocal() {
    const isoD = parseFloat(document.getElementById('inputIsoDiesel')?.value)  || 0;
    const isoG = parseFloat(document.getElementById('inputIsoGasohol')?.value) || 0;
    const td   = stockTotalDiesel  - isoD;
    const tg   = stockTotalGasohol - isoG;

    const elTD = document.getElementById('tanqueDiesel');
    const elTG = document.getElementById('tanqueGasohol');
    if (elTD) { elTD.textContent = td.toFixed(2) + ' gl'; elTD.style.color = td < 0 ? 'var(--danger)' : ''; }
    if (elTG) { elTG.textContent = tg.toFixed(2) + ' gl'; elTG.style.color = tg < 0 ? 'var(--danger)' : ''; }
}

async function actualizarReservaNube(prod) {
    actualizarDesgloseLocal();
    const id  = prod === 'diesel' ? 'inputIsoDiesel' : 'inputIsoGasohol';
    const val = parseFloat(document.getElementById(id).value) || 0;
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(withEmpresa({ action: 'updateReservas', producto: prod, cantidad: val }))
        });
    } catch(e) { console.warn('Error sincronizando reserva:', e); }
}
