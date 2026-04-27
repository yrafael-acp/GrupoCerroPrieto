/* ============================================================
   CALCULADORA VARILLA
============================================================ */
function ejecutarSimulacionVarilla() {
    const ini  = parseFloat(document.getElementById('simStockIni').value) || 0;
    const varl = parseFloat(document.getElementById('simVarilla').value)  || 0;
    const res  = Math.max(ini - varl, 0);
    const el   = document.getElementById('simResultadoVarilla');
    if (el) {
        el.textContent = res.toFixed(2) + ' gl';
        el.style.color = res > 500 ? 'var(--danger)' : 'var(--acp-green)';
    }
}
