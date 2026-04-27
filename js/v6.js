
let enterpriseCache = null;
let currentEditUserV6 = null;

function v6esc(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function v6num(n){ return Number(n || 0).toLocaleString('es-PE'); }
function ensureEnterpriseSessionV6(){
  if (!getCurrentUser() || !getSessionToken() || isSessionExpired()) { window.location.href = 'index.html'; return false; }
  if (!(getCurrentRole() === ROLES.ADMIN || getCurrentRole() === ROLES.SUPERADMIN)) { alert('No tienes permisos para acceder.'); window.location.href = 'index.html'; return false; }
  injectSessionStyles(); renderUserBadge();
  return true;
}
function enterpriseEmpresaOptionsV6(){
  const sel = document.getElementById('entEmpresa');
  if (!sel) return;
  const opts = isSuperAdmin() ? ['ALL','ACP','QALI'] : [getCurrentEmpresa()];
  sel.innerHTML = opts.map(v => `<option value="${v}">${v === 'ALL' ? 'Corporativo' : v}</option>`).join('');
  sel.value = isSuperAdmin() ? 'ALL' : getCurrentEmpresa();
}
async function refreshEnterpriseV6(){
  try {
    const empresaVista = document.getElementById('entEmpresa')?.value || getCurrentEmpresa();
    const dashboard = await apiGet('getEnterpriseDashboardV6', { empresa: empresaVista === 'ALL' ? getCurrentEmpresa() : empresaVista });
    const users = await apiGet('getUsersAdminV6', { empresa: empresaVista === 'ALL' ? getCurrentEmpresa() : empresaVista });
    const sessions = await apiGet('getSessionTraceV6', { empresa: empresaVista === 'ALL' ? '' : empresaVista });
    const changes = await apiGet('getChangeAuditV6', { empresa: empresaVista === 'ALL' ? '' : empresaVista });
    enterpriseCache = { dashboard, users, sessions, changes, empresaVista };
    renderEnterpriseSummaryV6();
    renderUsersTableV6();
    renderSessionsTableV6();
    renderChangesTableV6();
    renderScheduleInfoV6();
  } catch (e) {
    if (!handleAuthError(e)) alert('No se pudo cargar enterprise: ' + e.message);
  }
}
function renderEnterpriseSummaryV6(){
  const d = enterpriseCache.dashboard;
  document.getElementById('entGenerated').textContent = d.generatedAt || '—';
  document.getElementById('enterpriseSummary').innerHTML = `
    <div class="mini-kpi"><small>Usuarios</small><strong>${v6num(d.users?.total)}</strong></div>
    <div class="mini-kpi"><small>Activos</small><strong>${v6num(d.users?.activos)}</strong></div>
    <div class="mini-kpi"><small>Admins</small><strong>${v6num(d.users?.admins)}</strong></div>
    <div class="mini-kpi"><small>Superadmins</small><strong>${v6num(d.users?.superadmins)}</strong></div>
    <div class="mini-kpi"><small>Sesiones activas</small><strong>${v6num(d.activeSessions)}</strong></div>
    <div class="mini-kpi"><small>Hora alerta</small><strong>${v6esc(d.alertSchedule?.hour || '—')}</strong></div>`;
}
function renderUsersTableV6(){
  const rows = enterpriseCache.users?.users || [];
  document.getElementById('usersTableWrap').innerHTML = `<table class="admin-table"><thead><tr><th>Usuario</th><th>Rol</th><th>Empresa</th><th>Estado</th><th>Cambio</th><th>Acción</th></tr></thead><tbody>${rows.map(r => `<tr><td>${v6esc(r.usuario)}</td><td>${v6esc(r.rol)}</td><td>${v6esc(r.empresa)}</td><td>${v6esc(r.estado)}</td><td>${v6esc(r.requiereCambio)}</td><td><button class="btn btn-ghost btn-sm" onclick='editUserV6(${JSON.stringify(r).replace(/'/g,"&#39;")})'>Editar</button></td></tr>`).join('') || '<tr><td colspan="6">Sin usuarios</td></tr>'}</tbody></table>`;
}
function renderSessionsTableV6(){
  const rows = enterpriseCache.sessions?.sessions || [];
  document.getElementById('sessionsTableWrap').innerHTML = `<table class="admin-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Rol</th><th>Empresa</th><th>Evento</th><th>Estado</th></tr></thead><tbody>${rows.slice(0,80).map(r => `<tr><td>${v6esc(r.fecha)}</td><td>${v6esc(r.usuario)}</td><td>${v6esc(r.rol)}</td><td>${v6esc(r.empresa)}</td><td>${v6esc(r.evento)}</td><td>${v6esc(r.estado)}</td></tr>`).join('') || '<tr><td colspan="6">Sin sesiones</td></tr>'}</tbody></table>`;
}
function renderChangesTableV6(){
  const rows = enterpriseCache.changes?.changes || [];
  document.getElementById('changesTableWrap').innerHTML = `<table class="admin-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Módulo</th><th>Acción</th><th>Entidad</th><th>Estado</th></tr></thead><tbody>${rows.slice(0,100).map(r => `<tr><td>${v6esc(r.fecha)}</td><td>${v6esc(r.usuario)}</td><td>${v6esc(r.modulo)}</td><td>${v6esc(r.accion)}</td><td>${v6esc(r.entidad)}</td><td>${v6esc(r.estado)}</td></tr>`).join('') || '<tr><td colspan="6">Sin cambios</td></tr>'}</tbody></table>`;
}
function renderScheduleInfoV6(){
  const info = enterpriseCache.dashboard?.alertSchedule || {};
  document.getElementById('alertRecipients').value = info.recipients || '';
  document.getElementById('alertHour').value = info.hour || 7;
  document.getElementById('alertScheduleInfo').innerHTML = `<div class="integrity-item"><strong>Programación actual</strong><div style="margin-top:6px">Hora: ${v6esc(info.hour || '—')} · Destinatarios: ${v6esc(info.recipients || '—')}</div></div>`;
}
function openUserModalV6(){ currentEditUserV6 = null; ['uUsuario','uClave'].forEach(id => document.getElementById(id).value=''); document.getElementById('uRol').value='READ'; document.getElementById('uEmpresa').value='ACP'; document.getElementById('uEstado').value='ACTIVO'; document.getElementById('uCambio').value='NO'; document.getElementById('userModal').style.display='flex'; }
function closeUserModalV6(){ document.getElementById('userModal').style.display='none'; }
function editUserV6(row){ currentEditUserV6 = row; document.getElementById('uUsuario').value=row.usuario||''; document.getElementById('uClave').value=''; document.getElementById('uRol').value=row.rol||'READ'; document.getElementById('uEmpresa').value=row.empresa||'ACP'; document.getElementById('uEstado').value=row.estado||'ACTIVO'; document.getElementById('uCambio').value=row.requiereCambio||'NO'; document.getElementById('userModal').style.display='flex'; }
async function saveUserAdminV6(){
  try {
    await apiPost({ action:'saveUserAdminV6', usuario:document.getElementById('uUsuario').value.trim().toUpperCase(), clave:document.getElementById('uClave').value, rol:document.getElementById('uRol').value, empresa:document.getElementById('uEmpresa').value, estado:document.getElementById('uEstado').value, requiereCambio:document.getElementById('uCambio').value });
    closeUserModalV6();
    await refreshEnterpriseV6();
    alert('Usuario guardado.');
  } catch (e) { if (!handleAuthError(e)) alert('No se pudo guardar el usuario: ' + e.message); }
}
async function loadSessionsV6(){ await refreshEnterpriseV6(); }
async function scheduleAutomaticAlertsV6(){
  try {
    await apiPost({ action:'scheduleAutomaticAlertsV6', recipients:document.getElementById('alertRecipients').value.trim(), hour:document.getElementById('alertHour').value });
    await refreshEnterpriseV6();
    alert('Alertas automáticas programadas.');
  } catch (e) { if (!handleAuthError(e)) alert('No se pudo programar: ' + e.message); }
}
async function disableAutomaticAlertsV6(){
  if (!confirm('¿Desactivar alertas automáticas?')) return;
  try { await apiPost({ action:'disableAutomaticAlertsV6' }); await refreshEnterpriseV6(); alert('Alertas desactivadas.'); } catch (e) { if (!handleAuthError(e)) alert('No se pudo desactivar: ' + e.message); }
}
async function exportExecutiveXlsxV6(){
  try {
    const empresaVista = document.getElementById('entEmpresa')?.value || getCurrentEmpresa();
    const res = await apiGet('exportExecutiveXlsxV6', { empresaVista: empresaVista === 'ALL' ? getCurrentEmpresa() : empresaVista });
    window.open(res.exportUrl, '_blank');
  } catch (e) { if (!handleAuthError(e)) alert('No se pudo exportar XLSX: ' + e.message); }
}
async function generateExecutivePdfV6(){
  try {
    const empresaVista = document.getElementById('entEmpresa')?.value || getCurrentEmpresa();
    const res = await apiGet('generateExecutivePdfV6', { empresaVista: empresaVista === 'ALL' ? getCurrentEmpresa() : empresaVista });
    window.open(res.pdfUrl, '_blank');
  } catch (e) { if (!handleAuthError(e)) alert('No se pudo generar PDF: ' + e.message); }
}
async function initEnterpriseV6(){
  if (!ensureEnterpriseSessionV6()) return;
  enterpriseEmpresaOptionsV6();
  document.getElementById('entEmpresa')?.addEventListener('change', refreshEnterpriseV6);
  await refreshEnterpriseV6();
}
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('enterpriseSummary')) initEnterpriseV6();
});
