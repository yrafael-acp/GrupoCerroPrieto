/* ============================================================
   SIMULADOR SEMANAL
============================================================ */
function renderizarSimuladorBase() {
    const tbody = document.getElementById('bodySimuladoDual');
    if (!tbody) return;

    tbody.innerHTML = '';
    const DIAS = ['DOMINGO','LUNES','MARTES','MIÉRCOLES','JUEVES','VIERNES','SÁBADO'];

    const hoy  = new Date();
    const dow  = hoy.getDay();
    const diff = hoy.getDate() - dow + (dow === 0 ? -6 : 1);
    const lunes = new Date(hoy); lunes.setDate(diff); lunes.setHours(0,0,0,0);

    tbody.innerHTML += `
    <tr style="background:var(--warning-lt); border-bottom:2px solid var(--accent);">
        <td style="padding:8px; font-weight:800; color:var(--warning); border-right:2px solid var(--border); font-size:.75rem;">🏁 APERTURA</td>
        <td colspan="2" style="padding:4px; background:var(--warning-lt);">
            <input type="number" id="saldo_ini_d" class="input-sim" style="border:1px dashed #f59e0b; color:#92400e; font-weight:800; width:80px !important;"
                   value="${proyeccionesDual.DIESEL.saldoIni || 0}" placeholder="Saldo D" oninput="actualizarCalculosSimulacion()">
        </td>
        <td style="border-right:2px solid var(--border); font-size:.6rem; color:var(--text-muted); text-align:center;">gl</td>
        <td colspan="2" style="padding:4px; background:var(--warning-lt);">
            <input type="number" id="saldo_ini_g" class="input-sim" style="border:1px dashed #f59e0b; color:#92400e; font-weight:800; width:80px !important;"
                   value="${proyeccionesDual.GASOHOL.saldoIni || 0}" placeholder="Saldo G" oninput="actualizarCalculosSimulacion()">
        </td>
        <td style="font-size:.6rem; color:var(--text-muted); text-align:center;">gl</td>
    </tr>`;

    for (let i = 0; i < 7; i++) {
        const fecha = new Date(lunes); fecha.setDate(lunes.getDate() + i);
        const isPast = fecha < new Date().setHours(0,0,0,0);
        tbody.innerHTML += `
        <tr id="fila_dual_${i}" style="${isPast ? 'background:var(--surface-2);' : ''}">
            <td style="padding:8px; font-weight:700; border-right:2px solid var(--border); font-size:.75rem;">
                ${DIAS[fecha.getDay()]}<br>
                <small style="font-weight:400; font-size:.6rem; color:var(--text-muted);">${fecha.toLocaleDateString('es-PE')}</small>
            </td>
            <td style="padding:3px;">
                <input type="number" id="d_cons_${i}" value="${proyeccionesDual.DIESEL.cons[i] || 0}"
                       class="input-sim input-cons" oninput="actualizarCalculosSimulacion()">
            </td>
            <td style="padding:3px;">
                <input type="number" id="d_ing_${i}" value="${proyeccionesDual.DIESEL.ing[i] || 0}"
                       class="input-sim input-ing" oninput="actualizarCalculosSimulacion()">
            </td>
            <td id="d_saldo_${i}" style="padding:8px; text-align:right; font-family:'DM Mono',monospace; font-weight:700; border-right:2px solid var(--border); font-size:.78rem;">0.00</td>
            <td style="padding:3px;">
                <input type="number" id="g_cons_${i}" value="${proyeccionesDual.GASOHOL.cons[i] || 0}"
                       class="input-sim input-cons" oninput="actualizarCalculosSimulacion()">
            </td>
            <td style="padding:3px;">
                <input type="number" id="g_ing_${i}" value="${proyeccionesDual.GASOHOL.ing[i] || 0}"
                       class="input-sim input-ing" oninput="actualizarCalculosSimulacion()">
            </td>
            <td id="g_saldo_${i}" style="padding:8px; text-align:right; font-family:'DM Mono',monospace; font-weight:700; font-size:.78rem;">0.00</td>
        </tr>`;
    }
    actualizarCalculosSimulacion();
}

function actualizarCalculosSimulacion() {
    if (!document.getElementById('saldo_ini_d')) return;

    let sD = parseFloat(document.getElementById('saldo_ini_d').value) || 0;
    let sG = parseFloat(document.getElementById('saldo_ini_g').value) || 0;

    proyeccionesDual.DIESEL.saldoIni  = sD;
    proyeccionesDual.GASOHOL.saldoIni = sG;

    clearTimeout(timerApertura);
    timerApertura = setTimeout(() => {
        apiPost({ action:'saveSimDual', user:getCurrentUser(), producto:'CONFIG_INICIAL', data:{ dieselIni:sD, gasoholIni:sG }, apertura:{ diesel:sD, gasohol:sG } }).catch(() => {});
    }, 1000);

    let totalD = 0, totalG = 0;

    for (let j = 0; j < 7; j++) {
        proyeccionesDual.DIESEL.cons[j]  = parseFloat(document.getElementById(`d_cons_${j}`)?.value) || 0;
        proyeccionesDual.DIESEL.ing[j]   = parseFloat(document.getElementById(`d_ing_${j}`)?.value)  || 0;
        proyeccionesDual.GASOHOL.cons[j] = parseFloat(document.getElementById(`g_cons_${j}`)?.value) || 0;
        proyeccionesDual.GASOHOL.ing[j]  = parseFloat(document.getElementById(`g_ing_${j}`)?.value)  || 0;
        totalD += proyeccionesDual.DIESEL.ing[j];
        totalG += proyeccionesDual.GASOHOL.ing[j];
    }

    for (let i = 0; i < 7; i++) {
        sD = (sD - proyeccionesDual.DIESEL.cons[i])  + proyeccionesDual.DIESEL.ing[i];
        sG = (sG - proyeccionesDual.GASOHOL.cons[i]) + proyeccionesDual.GASOHOL.ing[i];
        aplicarAlertasVisuales(`d_saldo_${i}`, sD, proyeccionesDual.DIESEL.cons[i],  5000);
        aplicarAlertasVisuales(`g_saldo_${i}`, sG, proyeccionesDual.GASOHOL.cons[i], 1000);
    }

    const elD = document.getElementById('totalIngresoD');
    const elG = document.getElementById('totalIngresoG');
    if (elD) elD.textContent = totalD.toFixed(2);
    if (elG) elG.textContent = totalG.toFixed(2);
}

function aplicarAlertasVisuales(id, saldo, consDia, tope) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = saldo.toFixed(2);
    el.removeAttribute('class');

    if      (saldo < 0)                        { el.textContent += ' 🚨'; el.style.cssText = 'color:#dc2626;background:#fee2e2;padding:2px 6px;border-radius:4px;font-weight:800;'; }
    else if (saldo > tope)                     { el.textContent += ' ⚠️'; el.style.cssText = 'color:#7e22ce;background:#f3e8ff;padding:2px 6px;border-radius:4px;font-weight:700;'; }
    else if (consDia > 0 && saldo < consDia*2) { el.textContent += ' ⏳'; el.style.cssText = 'color:#ea580c;background:#ffedd5;padding:2px 6px;border-radius:4px;font-weight:700;'; }
    else                                       { el.style.cssText = 'color:var(--primary);'; }
}

function limpiarSimulacion() {
    if (!confirm('¿Deseas resetear la proyección a valores base?')) return;
    proyeccionesDual.DIESEL  = { cons:[1500,1500,1500,1500,1500,1500,1500], ing:[0,0,0,0,0,0,0], saldoIni: proyeccionesDual.DIESEL.saldoIni  || 0 };
    proyeccionesDual.GASOHOL = { cons:[150,150,150,150,150,150,150],         ing:[0,0,0,0,0,0,0], saldoIni: proyeccionesDual.GASOHOL.saldoIni || 0 };
    renderizarSimuladorBase();
}

async function guardarProyeccionSemanal() {
    const btn = document.getElementById('btnGuardarSim');
    btn.textContent = '⏳ Sincronizando…'; btn.disabled = true;

    const apertura = {
        diesel:  parseFloat(document.getElementById('saldo_ini_d')?.value) || 0,
        gasohol: parseFloat(document.getElementById('saldo_ini_g')?.value) || 0
    };

    try {
        await apiPost({ action:'saveSimDual', user:getCurrentUser(), producto:'DIESEL', data:proyeccionesDual, apertura });
        await apiPost({ action:'saveSimDual', user:getCurrentUser(), producto:'GASOHOL', data:proyeccionesDual, apertura });
        alert('✅ Proyección y apertura guardadas correctamente.');
    } catch(e) {
        alert('❌ Error al guardar. Intenta nuevamente.');
    } finally {
        btn.textContent = '✅ Confirmar y Sincronizar'; btn.disabled = false;
    }
}
