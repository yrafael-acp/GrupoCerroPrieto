/* ============================================================
   GRÁFICO
============================================================ */
function llenarSelectorMeses() {
    const sel = document.getElementById('filtroMesGrafico');
    if (!sel || !datosCache.length) return;

    const mesesSet = new Set();
    datosCache.forEach(h => {
        const f = parseFechaBase(h.fecha);
        if (f) mesesSet.add(`${MESES_ES[f.getMonth()]} ${f.getFullYear()}`);
    });

    const sorted = [...mesesSet].sort((a, b) => {
        const [mA, yA] = a.split(' ');
        const [mB, yB] = b.split(' ');
        return (new Date(yB, MESES_ES.indexOf(mB)) - new Date(yA, MESES_ES.indexOf(mA)));
    });

    const prev = sel.value;
    sel.innerHTML = sorted.map(m => `<option value="${m}">${m}</option>`).join('');
    if (prev && sorted.includes(prev)) sel.value = prev;
    else if (sorted.length) sel.value = sorted[0];
}

function obtenerConsumoMes(lista, mesAnio) {
    const [mesLabel, anio] = mesAnio.toLowerCase().split(' ');
    const idx = MESES_ES.findIndex(m => m.toLowerCase() === mesLabel);
    let d = 0, g = 0;
    lista.forEach(h => {
        const f = parseFechaBase(h.fecha);
        if (!f || f.getMonth() !== idx || f.getFullYear().toString() !== anio) return;
        if (!h.mov?.toUpperCase().includes('SALIDA')) return;
        if (h.prod?.toUpperCase().includes('DIESEL'))  d += parseFloat(h.cant) || 0;
        if (h.prod?.toUpperCase().includes('GASOHOL')) g += parseFloat(h.cant) || 0;
    });
    return { diesel: d, gasohol: g };
}

function toggleGrafico() {
    vistaGrafico = vistaGrafico === 'mensual' ? 'anual' : 'mensual';
    const btn = document.getElementById('btnToggleGrafico');
    const sel = document.getElementById('filtroMesGrafico');
    const tit = document.getElementById('tituloGrafico');
    if (vistaGrafico === 'anual') {
        btn.textContent = 'Ver Mensual';
        sel.style.display = 'none';
        tit.textContent  = 'Tendencia de Consumo Anual';
    } else {
        btn.textContent = 'Ver Tendencia Anual';
        sel.style.display = '';
        tit.textContent  = 'Consumo vs Mes Anterior';
    }
    procesarGrafico();
}

function procesarGrafico() {
    const canvas = document.getElementById('consumoChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (miGrafico) { miGrafico.destroy(); miGrafico = null; }

    const opts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };

    if (vistaGrafico === 'mensual') {
        const sel = document.getElementById('filtroMesGrafico');
        if (!sel?.value) return;
        const actual = obtenerConsumoMes(datosCache, sel.value);
        const prevIdx = sel.selectedIndex + 1;
        const prev = prevIdx < sel.options.length
            ? obtenerConsumoMes(datosCache, sel.options[prevIdx].value)
            : { diesel: 0, gasohol: 0 };

        miGrafico = new Chart(ctx, {
            data: {
                labels: ['Diesel', 'Gasohol'],
                datasets: [
                    { type: 'bar',  label: sel.value,    data: [actual.diesel, actual.gasohol], backgroundColor: ['#1d4ed8','#059669'], borderRadius: 6, order: 2 },
                    { type: 'line', label: 'Mes Anterior', data: [prev.diesel, prev.gasohol],   borderColor: '#f59e0b', borderWidth: 3, pointBackgroundColor: '#f59e0b', fill: false, tension: .1, order: 1 }
                ]
            },
            options: opts
        });
    } else {
        const anio = document.getElementById('selectAnioFiscal')?.value;
        const d = new Array(12).fill(0);
        const g = new Array(12).fill(0);
        datosCache.forEach(h => {
            const f = parseFechaBase(h.fecha);
            if (!f || f.getFullYear().toString() !== anio || !h.mov?.toUpperCase().includes('SALIDA')) return;
            const m = f.getMonth();
            if (h.prod?.toUpperCase().includes('DIESEL'))  d[m] += parseFloat(h.cant) || 0;
            if (h.prod?.toUpperCase().includes('GASOHOL')) g[m] += parseFloat(h.cant) || 0;
        });
        miGrafico = new Chart(ctx, {
            type: 'line',
            data: {
                labels: MESES_SHORT,
                datasets: [
                    { label: 'Diesel',  data: d, borderColor: '#1d4ed8', backgroundColor: 'rgba(29,78,216,.1)', tension: .3, fill: true, borderWidth: 2.5, pointRadius: 3 },
                    { label: 'Gasohol', data: g, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,.1)',  tension: .3, fill: true, borderWidth: 2.5, pointRadius: 3 }
                ]
            },
            options: { ...opts, scales: { y: { beginAtZero: true, title: { display: true, text: 'Galones (gl)', font: { weight: '600' } } } } }
        });
    }
}

function calcularConsumoAnual() {
    const anio = parseInt(document.getElementById('selectAnioFiscal')?.value || new Date().getFullYear());
    let td = 0, tg = 0;
    datosCache.forEach(h => {
        const f = parseFechaBase(h.fecha);
        if (!f || f.getFullYear() !== anio || !h.mov?.toUpperCase().includes('SALIDA')) return;
        if (h.prod?.toUpperCase().includes('DIESEL'))  td += parseFloat(h.cant) || 0;
        if (h.prod?.toUpperCase().includes('GASOHOL')) tg += parseFloat(h.cant) || 0;
    });
    const elD = document.getElementById('annualDiesel');
    const elG = document.getElementById('annualGasohol');
    if (elD) elD.textContent = td.toLocaleString('es-PE', { minimumFractionDigits: 2 }) + ' gl';
    if (elG) elG.textContent = tg.toLocaleString('es-PE', { minimumFractionDigits: 2 }) + ' gl';
}
