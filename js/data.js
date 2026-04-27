/* ============================================================
   CARGA DE DATOS
============================================================ */
async function cargarDatos() {
    try {
        const data = await apiGet('read');

        if (data.simulacion) {
            const sd = data.simulacion.diesel || {};
            const sg = data.simulacion.gasohol || {};
            const aperD = document.getElementById('saldo_ini_d');
            const aperG = document.getElementById('saldo_ini_g');
            if (aperD) aperD.value = sd.apertura || 0;
            if (aperG) aperG.value = sg.apertura || 0;
            proyeccionesDual.DIESEL.saldoIni = parseFloat(sd.apertura) || 0;
            proyeccionesDual.GASOHOL.saldoIni = parseFloat(sg.apertura) || 0;
            try { if (sd.consumos) proyeccionesDual.DIESEL.cons = JSON.parse(sd.consumos); } catch (_) {}
            try { if (sd.ingresos) proyeccionesDual.DIESEL.ing = JSON.parse(sd.ingresos); } catch (_) {}
            try { if (sg.consumos) proyeccionesDual.GASOHOL.cons = JSON.parse(sg.consumos); } catch (_) {}
            try { if (sg.ingresos) proyeccionesDual.GASOHOL.ing = JSON.parse(sg.ingresos); } catch (_) {}
        }

        datosCache = data.historial || [];
        stockTotalDiesel = parseFloat(data.stocks?.diesel) || 0;
        stockTotalGasohol = parseFloat(data.stocks?.gasohol) || 0;

        const isoD = document.getElementById('inputIsoDiesel');
        const isoG = document.getElementById('inputIsoGasohol');
        if (isoD) isoD.value = data.reservas?.diesel || 0;
        if (isoG) isoG.value = data.reservas?.gasohol || 0;

        actualizarUI(data);
        llenarSelectorMeses();
        procesarGrafico();
        calcularConsumoAnual();
        renderHistorial(datosCache);

        for (let i = 0; i < 7; i++) {
            const dc = document.getElementById(`d_cons_${i}`);
            if (dc) {
                dc.value = proyeccionesDual.DIESEL.cons[i] || 0;
                document.getElementById(`d_ing_${i}`).value = proyeccionesDual.DIESEL.ing[i] || 0;
                document.getElementById(`g_cons_${i}`).value = proyeccionesDual.GASOHOL.cons[i] || 0;
                document.getElementById(`g_ing_${i}`).value = proyeccionesDual.GASOHOL.ing[i] || 0;
            }
        }
        actualizarCalculosSimulacion();
        document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('es-PE');
        if (typeof cargarPanelesV3 === 'function') cargarPanelesV3();
        setTimeout(() => { cargandoDataInicial = false; }, 1000);
    } catch (e) {
        console.error('cargarDatos error:', e);
        handleAuthError(e);
    }
}
