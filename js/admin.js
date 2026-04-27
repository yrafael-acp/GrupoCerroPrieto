
let adminDashboardCache = null;
let adminConfigCache = null;
let adminLogsCache = null;
let adminIntegrityCache = null;

function adminEscape(text){return String(text==null?'':text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
function adminBadge(level){
  const cls = level==='error'?'alert-error':level==='warn'?'alert-warn':'alert-ok';
  return `<span class="alert-pill ${cls}">${adminEscape(level || 'ok').toUpperCase()}</span>`;
}
function adminFormatNum(n){ return Number(n || 0).toLocaleString('es-PE',{minimumFractionDigits:2, maximumFractionDigits:2}); }

function ensureAdminSession(){
  if (!getCurrentUser() || !getSessionToken() || isSessionExpired()) { window.location.href='index.html'; return false; }
  if (!(getCurrentRole()===ROLES.ADMIN || getCurrentRole()===ROLES.SUPERADMIN)) { alert('No tienes permisos para acceder al panel administrativo.'); window.location.href='index.html'; return false; }
  injectSessionStyles(); renderUserBadge();
  const superBlock = document.querySelectorAll('.superadmin-only');
  superBlock.forEach(el => el.style.display = isSuperAdmin() ? 'block' : 'none');
  const roleEls = document.querySelectorAll('[data-role="superadmin-only"]');
  roleEls.forEach(el => el.style.display = isSuperAdmin() ? '' : 'none');
  return true;
}

async function cargarAdminDashboard(){
  try{
    const data = await apiGet('getAdminDashboardV4');
    adminDashboardCache = data;
    renderAdminSummary(data);
  }catch(e){ if(!handleAuthError(e)) alert('No se pudo cargar el dashboard administrativo: ' + e.message); }
}

function renderAdminSummary(data){
  const sum = data.summary || {};
  const wrap = document.getElementById('adminSummary');
  wrap.innerHTML = `
    <div class="mini-kpi"><small>Generado</small><strong>${adminEscape(data.generatedAt || '—')}</strong></div>
    <div class="mini-kpi"><small>Sesiones activas</small><strong>${adminEscape(sum.activeSessions || 0)}</strong></div>
    <div class="mini-kpi"><small>Alertas abiertas</small><strong>${adminEscape(sum.totalAlerts || 0)}</strong></div>
    <div class="mini-kpi"><small>Registros auditados</small><strong>${adminEscape(sum.auditRows || 0)}</strong></div>
  `;

  const corp = document.getElementById('adminCorporate');
  const companies = data.companies || [];
  corp.innerHTML = companies.map(c => `
    <div class="v3-box">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${adminEscape(c.empresa)}</strong>${adminBadge((c.alerts||[]).length ? 'warn' : 'ok')}</div>
      <div class="v3-grid-2" style="margin-top:10px">
        <div>Diesel <div class="kpi-hero">${adminFormatNum(c.stocks?.diesel)}</div></div>
        <div>Gasohol <div class="kpi-hero">${adminFormatNum(c.stocks?.gasohol)}</div></div>
        <div>Flota activa: <b>${adminEscape(c.flotaActiva || 0)}</b></div>
        <div>Usuarios: <b>${adminEscape(c.usuarios || 0)}</b></div>
      </div>
      <div style="margin-top:8px;color:var(--text-muted)">Último movimiento: ${adminEscape(c.stocks?.lastDate || '—')}</div>
    </div>
  `).join('');

  const alerts = [];
  companies.forEach(c => (c.alerts||[]).forEach(a => alerts.push({empresa:c.empresa, ...a})));
  document.getElementById('adminAlerts').innerHTML = alerts.length ? alerts.map(a => `
    <div class="integrity-item">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${adminEscape(a.empresa)} · ${adminEscape(a.code || 'ALERTA')}</strong>${adminBadge(a.level || 'warn')}</div>
      <div style="margin-top:6px">${adminEscape(a.message || '')}</div>
      <div style="margin-top:6px;color:var(--text-muted)">Valor: ${adminEscape(a.value)}${a.threshold != null ? ` · Umbral: ${adminEscape(a.threshold)}`:''}</div>
    </div>
  `).join('') : '<div class="integrity-item">No hay alertas activas.</div>';

  const recent = document.getElementById('adminRecentLogs');
  recent.innerHTML = (data.recentLogs||[]).length ? `
    <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Fecha</th><th>Empresa</th><th>Módulo</th><th>Acción</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>
    ${(data.recentLogs||[]).map(r => `<tr><td>${adminEscape(r.fecha)}</td><td>${adminEscape(r.empresa)}</td><td>${adminEscape(r.modulo)}</td><td>${adminEscape(r.accion)}</td><td>${adminEscape(r.estado)}</td><td>${adminEscape(r.detalle)}</td></tr>`).join('')}
    </tbody></table></div>` : '<div class="integrity-item">Sin registros recientes.</div>';
}

async function cargarConfigV4(){
  try{
    const data = await apiGet('getConfigCatalogV4');
    adminConfigCache = data;
    renderConfigV4(data);
  }catch(e){ if(!handleAuthError(e)) alert('No se pudo cargar la configuración: ' + e.message); }
}

function renderConfigV4(data){
  const box = document.getElementById('configRows');
  const items = data.items || [];
  const editable = isSuperAdmin();
  box.innerHTML = items.map(item => `
    <div class="config-row">
      <div class="config-grid">
        <div><div><strong>${adminEscape(item.key)}</strong></div><small style="color:var(--text-muted)">${adminEscape(item.description || '')}</small></div>
        <div><span class="code-pill">${adminEscape(item.category || 'GENERAL')}</span></div>
        <div>${editable ? `<input data-config-key="${adminEscape(item.key)}" value="${adminEscape(item.value || '')}" />` : `<strong>${adminEscape(item.value || '')}</strong>`}</div>
        <div>${adminEscape(item.active || 'SI')}</div>
      </div>
    </div>
  `).join('');
  const btn = document.getElementById('btnSaveConfigV4');
  if (btn) btn.style.display = editable ? 'inline-flex' : 'none';
}

async function guardarConfigV4(){
  if (!isSuperAdmin()) return;
  const entries = {};
  document.querySelectorAll('[data-config-key]').forEach(input => entries[input.getAttribute('data-config-key')] = input.value);
  try{
    await apiPost({ action:'saveConfigV4', entries });
    alert('Configuración actualizada correctamente.');
    cargarConfigV4();
    cargarAdminDashboard();
  }catch(e){ if(!handleAuthError(e)) alert('No se pudo guardar la configuración: ' + e.message); }
}

async function cargarLogsV4(){
  const empresa = document.getElementById('logEmpresa').value;
  const modulo = document.getElementById('logModulo').value.trim();
  const accion = document.getElementById('logAccion').value.trim();
  const estado = document.getElementById('logEstado').value;
  const desde = document.getElementById('logDesde').value;
  const hasta = document.getElementById('logHasta').value;
  try{
    const data = await apiGet('getAuditLogsV4', { empresaFiltro: empresa, modulo, accion, estado, desde, hasta, limit: 150 });
    adminLogsCache = data;
    renderLogsV4(data.rows || []);
  }catch(e){ if(!handleAuthError(e)) alert('No se pudieron cargar los logs: ' + e.message); }
}

function renderLogsV4(rows){
  const box = document.getElementById('logsTableWrap');
  if (!rows.length) { box.innerHTML = '<div class="integrity-item">No hay resultados para esos filtros.</div>'; return; }
  box.innerHTML = `<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Fecha</th><th>Empresa</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Estado</th><th>Referencia</th><th>Detalle</th></tr></thead><tbody>${rows.map(r => `<tr><td>${adminEscape(r.fecha)}</td><td>${adminEscape(r.empresa)}</td><td>${adminEscape(r.usuario)}</td><td>${adminEscape(r.modulo)}</td><td>${adminEscape(r.accion)}</td><td>${adminEscape(r.estado)}</td><td>${adminEscape(r.referencia)}</td><td>${adminEscape(r.detalle)}</td></tr>`).join('')}</tbody></table></div>`;
}

async function cargarIntegridadV4(){
  try{
    const data = await apiGet('getIntegrityCheckV4');
    adminIntegrityCache = data;
    const box = document.getElementById('integrityList');
    const items = data.items || [];
    box.innerHTML = items.length ? items.map(it => `<div class="integrity-item"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${adminEscape(it.title)}</strong>${adminBadge(it.level || 'ok')}</div><div style="margin-top:6px">${adminEscape(it.message)}</div>${it.count != null ? `<div style="margin-top:6px;color:var(--text-muted)">Cantidad: ${adminEscape(it.count)}</div>`:''}</div>`).join('') : '<div class="integrity-item">No se encontraron inconsistencias.</div>';
  }catch(e){ if(!handleAuthError(e)) alert('No se pudo cargar la integridad del sistema: ' + e.message); }
}

async function inicializarAdminV4(){
  if (!ensureAdminSession()) return;
  document.getElementById('displayYear').textContent = new Date().getFullYear();
  await Promise.all([cargarAdminDashboard(), cargarConfigV4(), cargarLogsV4(), cargarIntegridadV4()]);
}

document.addEventListener('DOMContentLoaded', inicializarAdminV4);
