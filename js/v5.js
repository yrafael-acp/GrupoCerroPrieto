
let execMonthlyChart = null;
let execDailyChart = null;
let executiveCache = null;

function execEscape(v){ return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function execNum(n){ return Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function ensureExecutiveSession(){
  return bootstrapProtectedView({ roles: [ROLES.ADMIN, ROLES.SUPERADMIN], forbiddenMessage: 'No tienes permisos para acceder al panel ejecutivo.' });
}
function getExecEmpresaVista(){ return document.getElementById('empresaVista')?.value || getCurrentEmpresa(); }
function renderExecEmpresaOptions(){
  const sel = document.getElementById('empresaVista');
  if (!sel) return;
  const options = isSuperAdmin() ? ['ACP','QALI','ALL'] : [getCurrentEmpresa()];
  sel.innerHTML = options.map(v => `<option value="${v}">${v === 'ALL' ? 'Corporativo' : v}</option>`).join('');
  sel.value = isSuperAdmin() ? 'ALL' : getCurrentEmpresa();
}
async function fetchExecutiveV5(){
  const params = { empresaVista: getExecEmpresaVista() };
  return apiGet('getExecutiveDashboardV5', params);
}
function renderExecutiveKpis(data){
  const k = data.kpis || {};
  document.getElementById('execGenerated').textContent = data.generatedAt || '—';
  document.getElementById('execKpis').innerHTML = `
    <div class="mini-kpi"><small>Ámbito</small><strong>${execEscape(data.scope || '—')}</strong></div>
    <div class="mini-kpi"><small>Stock Diesel</small><strong>${execNum(k.stockDiesel)}</strong></div>
    <div class="mini-kpi"><small>Stock Gasohol</small><strong>${execNum(k.stockGasohol)}</strong></div>
    <div class="mini-kpi"><small>Consumo semana</small><strong>${execNum(k.consumoSemana?.total)}</strong></div>
    <div class="mini-kpi"><small>Consumo mes</small><strong>${execNum(k.consumoMes?.total)}</strong></div>
    <div class="mini-kpi"><small>Último movimiento</small><strong>${execEscape(k.lastMovement || '—')}</strong></div>`;
}
function renderExecutiveComparative(data){
  const box = document.getElementById('execComparative');
  const rows = data.comparative || [];
  box.innerHTML = rows.map(r => `
    <div class="v3-box" style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>${execEscape(r.empresa)}</strong><span class="code-pill">${execEscape(r.stocks?.fecha || '—')}</span></div>
      <div class="v3-grid-2" style="margin-top:8px">
        <div>Diesel <div class="kpi-hero">${execNum(r.stocks?.diesel)}</div></div>
        <div>Gasohol <div class="kpi-hero">${execNum(r.stocks?.gasohol)}</div></div>
        <div>Semana total: <b>${execNum(r.week?.total)}</b></div>
        <div>Mes total: <b>${execNum(r.month?.total)}</b></div>
      </div>
    </div>`).join('') || '<div class="integrity-item">Sin datos.</div>';
}
function renderExecutiveAlerts(data){
  const box = document.getElementById('execAlerts');
  const alerts = data.alerts || [];
  box.innerHTML = alerts.length ? alerts.map(a => `
    <div class="integrity-item">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><strong>${execEscape(a.code || 'ALERTA')}</strong><span class="alert-pill ${a.level === 'error' ? 'alert-error' : 'alert-warn'}">${execEscape((a.level || 'warn').toUpperCase())}</span></div>
      <div style="margin-top:6px">${execEscape(a.message || '')}</div>
      <div style="margin-top:6px;color:var(--text-muted)">Valor: ${execEscape(a.value)} · Umbral: ${execEscape(a.threshold)}</div>
    </div>`).join('') : '<div class="integrity-item">No hay alertas activas.</div>';
}
function renderExecutiveCharts(data){
  const monthly = data.charts?.monthly12 || { labels:[], diesel:[], gasohol:[] };
  const daily = data.charts?.daily30 || { labels:[], diesel:[], gasohol:[] };
  if (execMonthlyChart) execMonthlyChart.destroy();
  if (execDailyChart) execDailyChart.destroy();
  execMonthlyChart = new Chart(document.getElementById('execMonthlyChart').getContext('2d'), {
    type: 'bar',
    data: { labels: monthly.labels, datasets: [
      { label:'Diesel', data: monthly.diesel, backgroundColor:'rgba(29,78,216,.75)', borderRadius:6 },
      { label:'Gasohol', data: monthly.gasohol, backgroundColor:'rgba(5,150,105,.75)', borderRadius:6 }
    ]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
  });
  execDailyChart = new Chart(document.getElementById('execDailyChart').getContext('2d'), {
    type: 'line',
    data: { labels: daily.labels, datasets: [
      { label:'Diesel', data: daily.diesel, borderColor:'#1d4ed8', backgroundColor:'rgba(29,78,216,.08)', tension:.3, fill:true },
      { label:'Gasohol', data: daily.gasohol, borderColor:'#059669', backgroundColor:'rgba(5,150,105,.08)', tension:.3, fill:true }
    ]},
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }
  });
}
async function refreshExecutiveV5(){
  try {
    const data = await fetchExecutiveV5();
    executiveCache = data;
    renderExecutiveKpis(data);
    renderExecutiveComparative(data);
    renderExecutiveAlerts(data);
    renderExecutiveCharts(data);
  } catch (e) {
    if (!handleAuthError(e)) alert('No se pudo cargar el panel ejecutivo: ' + e.message);
  }
}
function exportExecutiveCsvV5(){
  if (!executiveCache) return;
  const rows = [['Ambito', executiveCache.scope], ['Generado', executiveCache.generatedAt], [], ['KPI','Valor'], ['Stock Diesel', executiveCache.kpis?.stockDiesel || 0], ['Stock Gasohol', executiveCache.kpis?.stockGasohol || 0], ['Consumo Semana', executiveCache.kpis?.consumoSemana?.total || 0], ['Consumo Mes', executiveCache.kpis?.consumoMes?.total || 0], []];
  rows.push(['Empresa','Stock Diesel','Stock Gasohol','Semana','Mes']);
  (executiveCache.comparative || []).forEach(r => rows.push([r.empresa, r.stocks?.diesel || 0, r.stocks?.gasohol || 0, r.week?.total || 0, r.month?.total || 0]));
  const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(',')).join('
');
  const blob = new Blob([csv], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `panel_ejecutivo_${executiveCache.scope || 'ACP'}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}
async function sendExecutiveAlertV5(){
  try {
    await apiPost({ action:'sendExecutiveAlertV5', empresaVista:getExecEmpresaVista() });
    alert('Resumen ejecutivo enviado por correo.');
  } catch (e) {
    if (!handleAuthError(e)) alert('No se pudo enviar el resumen: ' + e.message);
  }
}
async function initExecutiveV5(){
  if (!ensureExecutiveSession()) return;
  renderExecEmpresaOptions();
  document.getElementById('empresaVista').addEventListener('change', refreshExecutiveV5);
  await refreshExecutiveV5();
}
document.addEventListener('DOMContentLoaded', initExecutiveV5);
