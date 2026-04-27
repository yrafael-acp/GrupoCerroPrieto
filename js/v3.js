/* ============================================================
   V3 ADMINISTRATIVA UI
============================================================ */
let v3SystemStatusCache = null;
let v3CorporateCache = null;

function escapeHtmlV3(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderV3MetricCards(containerId, items) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = (items || []).map(item => `
        <div class="mini-kpi">
            <small>${escapeHtmlV3(item.label)}</small>
            <strong>${escapeHtmlV3(item.value)}</strong>
        </div>
    `).join('');
}

function renderV3SystemStatus(status) {
    v3SystemStatusCache = status;
    const card = document.getElementById('v3StatusCard');
    if (!card) return;
    card.style.display = 'block';

    renderV3MetricCards('v3StatusSummary', [
        { label: 'Generado', value: status.generatedAt || '—' },
        { label: 'Hojas faltantes', value: status.summary?.missingSheets ?? 0 },
        { label: 'Filas sin empresa', value: status.summary?.missingEmpresaRows ?? 0 },
        { label: 'Usuarios activos', value: status.summary?.activeUsers ?? 0 }
    ]);

    const alertsBox = document.getElementById('v3StatusAlerts');
    if (!alertsBox) return;

    const alertItems = [];
    Object.entries(status.byCompany || {}).forEach(([empresa, payload]) => {
        (payload.alerts || []).forEach(alert => alertItems.push({ empresa, ...alert }));
    });

    const sheetProblems = (status.sheets || []).filter(s => !s.exists || s.missingEmpresa > 0);
    const blocks = [];

    if (alertItems.length) {
        blocks.push(`
            <div class="v3-box">
                <strong>Alertas operativas</strong>
                <ul class="v3-list">${alertItems.map(a => `<li><b>${escapeHtmlV3(a.empresa)}</b>: ${escapeHtmlV3(a.message)} (${escapeHtmlV3(a.value)})</li>`).join('')}</ul>
            </div>
        `);
    }

    if (sheetProblems.length) {
        blocks.push(`
            <div class="v3-box">
                <strong>Observaciones en hojas</strong>
                <ul class="v3-list">${sheetProblems.map(s => `<li>${escapeHtmlV3(s.name)} · existe: ${s.exists ? 'SI' : 'NO'} · filas sin empresa: ${s.missingEmpresa || 0}</li>`).join('')}</ul>
            </div>
        `);
    }

    if (!blocks.length) {
        blocks.push('<div class="v3-box"><strong>Todo en orden</strong><div>No se detectaron alertas ni problemas estructurales.</div></div>');
    }

    alertsBox.innerHTML = blocks.join('');
}

function renderV3CorporateDashboard(data) {
    v3CorporateCache = data;
    const card = document.getElementById('v3CorporateCard');
    if (!card) return;
    card.style.display = isSuperAdmin() ? 'block' : 'none';
    if (!isSuperAdmin()) return;

    renderV3MetricCards('v3CorporateSummary', [
        { label: 'Diesel total', value: Number(data.totals?.diesel || 0).toFixed(2) },
        { label: 'Gasohol total', value: Number(data.totals?.gasohol || 0).toFixed(2) },
        { label: 'Flota activa', value: data.totals?.flotaActiva ?? 0 },
        { label: 'Alertas', value: data.totals?.alertCount ?? 0 }
    ]);

    const box = document.getElementById('v3CorporateCompanies');
    if (!box) return;
    box.innerHTML = (data.companies || []).map(c => `
        <div class="v3-box">
            <strong>${escapeHtmlV3(c.empresa)}</strong>
            <div class="v3-grid-2">
                <div>Diesel: <b>${Number(c.stocks?.diesel || 0).toFixed(2)}</b></div>
                <div>Gasohol: <b>${Number(c.stocks?.gasohol || 0).toFixed(2)}</b></div>
                <div>Flota activa: <b>${escapeHtmlV3(c.flotaActiva)}</b></div>
                <div>Últ. mov.: <b>${escapeHtmlV3(c.stocks?.lastDate || '—')}</b></div>
            </div>
            <div style="margin-top:8px;color:var(--text-muted);">Alertas: ${escapeHtmlV3(c.alertCount || 0)}</div>
        </div>
    `).join('');
}

async function cargarPanelesV3() {
    const canAdmin = getCurrentRole() === ROLES.ADMIN || getCurrentRole() === ROLES.SUPERADMIN;
    if (!canAdmin) return;
    try {
        const status = await apiGet('getSystemStatus');
        renderV3SystemStatus(status);
    } catch (e) {
        if (!handleAuthError(e)) console.warn('V3 status error', e);
    }
    if (isSuperAdmin()) {
        try {
            const corp = await apiGet('getCorporateDashboard');
            renderV3CorporateDashboard(corp);
        } catch (e) {
            if (!handleAuthError(e)) console.warn('V3 corporate error', e);
        }
    }
}

function injectV3Styles() {
    if (document.getElementById('v3Styles')) return;
    const style = document.createElement('style');
    style.id = 'v3Styles';
    style.textContent = `
        .mini-kpi{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);padding:12px 14px;border-radius:14px}
        .mini-kpi small{display:block;color:var(--text-muted);margin-bottom:4px}
        .mini-kpi strong{font-size:1.05rem}
        .v3-box{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);padding:12px 14px;border-radius:14px}
        .v3-list{margin:8px 0 0 18px;padding:0}
        .v3-list li{margin:6px 0}
        .v3-grid-2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
    `;
    document.head.appendChild(style);
}

injectV3Styles();
