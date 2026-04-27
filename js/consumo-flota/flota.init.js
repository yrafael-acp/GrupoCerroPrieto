/**
 * flota.init.js
 * Punto de entrada: inicialización, orquestación y funciones de ciclo de vida
 */

'use strict';

// ── SINCRONIZACIÓN PRINCIPAL ───────────────────────────────────

async function sincronizarDesdeNube() {
    FlotaUI.setSyncIndicator(true, 'SINCRONIZANDO...');

    try {
        const fStr = FlotaUtils.toISODate(FlotaState.lunesReferencia);
        const data = await FlotaAPI.getFlota(fStr);
        FlotaState.ESTRUCTURA_FLOTA = data;
        FlotaTabla.render(data);
    } catch (e) {
        console.error('Error sincronizando flota:', e);
        FlotaUI.toast('Error al sincronizar datos.', 'error');
    } finally {
        FlotaUI.setSyncIndicator(false);
    }
}

// ── AUDITORÍA RADAR ───────────────────────────────────────────

async function auditarInactivos(rango) {
    const textoRango = document.getElementById('rangoAuditoria');
    const anio = document.getElementById('selectorAnio').value;
    const selector = document.getElementById('selectorSemanas');

    if (!selector.value) {
        FlotaUI.toast('Selecciona una semana primero.', 'warning');
        return;
    }

    const mesReferencia = selector.value.split('-')[1];
    const nombresMeses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // Toggle botones activos
    document.getElementById('btnAuditMes').className = `radar-btn ${rango === 'mes' ? 'radar-btn-active' : ''}`;
    document.getElementById('btnAuditAnio').className = `radar-btn ${rango === 'anio' ? 'radar-btn-active' : ''}`;

    textoRango.textContent = rango === 'mes'
        ? `Auditando: ${nombresMeses[parseInt(mesReferencia) - 1]} ${anio}`
        : `Auditando: Todo el año ${anio}`;

    FlotaUI.radarLoading();

    try {
        const inactivos = await FlotaAPI.auditar(rango, anio, mesReferencia);
        FlotaUI.renderRadarInactivos(inactivos);
    } catch (e) {
        document.getElementById('listaInactivos').innerHTML = `
            <p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted)">
                Error al conectar con SAP.
            </p>`;
    }
}

// ── LIMPIEZA DE VALES ─────────────────────────────────────────

async function limpiarValesManuales() {
    if (!confirm('⚠️ ¿Eliminar todos los registros manuales (vales)?\nConfirma que ya fueron procesados en SAP.')) return;

    FlotaUI.setSyncIndicator(true, 'LIMPIANDO VALES...');

    try {
        await FlotaAPI.limpiarTemporales();
        FlotaUI.toast('✅ Hoja temporal de vales limpiada con éxito.', 'success');
        await sincronizarDesdeNube();
    } catch (e) {
        FlotaUI.toast('Error al limpiar los datos.', 'error');
    } finally {
        FlotaUI.setSyncIndicator(false);
    }
}

// ── UPLOAD SAP EXCEL ──────────────────────────────────────────

async function procesarArchivoSAPFlota(input) {
    const file = input.files[0];
    if (!file) return;

    const status = document.getElementById('statusCargaSAP');
    status.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Procesando archivo...';

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (!jsonData.length) {
                FlotaUI.toast('⚠️ El archivo está vacío.', 'warning');
                status.textContent = '';
                return;
            }

            status.innerHTML = `<i class="fas fa-sync fa-spin mr-1"></i>Sincronizando ${jsonData.length} registros...`;

            const user = sessionStorage.getItem('sessionGrifo') || 'S/U';
            const res = await FlotaAPI.uploadSAPData(jsonData, user);

            if (res.status === 'OK') {
                FlotaUI.toast(`✅ ${jsonData.length} registros sincronizados con SAP.`, 'success');
                if (typeof sincronizarDesdeNube === 'function') await sincronizarDesdeNube();
            } else {
                FlotaUI.toast('❌ Error: ' + (res.message || 'Desconocido'), 'error');
            }

        } catch (err) {
            console.error(err);
            FlotaUI.toast('❌ Error al procesar el Excel. Verifica el formato SAP.', 'error');
        } finally {
            status.textContent = '';
            input.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
}

// ── SELECTORES DE SEMANA / AÑO ────────────────────────────────

function gestionarCambioSemana() {
    const selector = document.getElementById('selectorSemanas');
    if (!selector?.value) return;

    FlotaState.lunesReferencia = new Date(selector.value + 'T12:00:00');
    FlotaUI.actualizarEtiquetaEstado();
    sincronizarDesdeNube();
}

function cambiarAnio() {
    const anio = document.getElementById('selectorAnio').value;
    FlotaUtils.poblarSemanasPorAnio(anio);

    const sel = document.getElementById('selectorSemanas');
    FlotaState.lunesReferencia = new Date(sel.value + 'T12:00:00');
    FlotaUI.actualizarEtiquetaEstado();
    sincronizarDesdeNube();
}

// ── NAVEGACIÓN ────────────────────────────────────────────────

function irAPaginaPrincipal() {
    window.location.href = 'index.html';
}

function logout() {
    if (confirm('¿Ya terminaste tu turno? Se cerrará la sesión.')) {
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// ── INIT ──────────────────────────────────────────────────────

window.onload = async () => {
    const rol = sessionStorage.getItem('rolGrifo');
    const anioActual = new Date().getFullYear();

    // 1. Poblar selectores
    FlotaUtils.poblarAnios();
    FlotaUtils.poblarSemanasPorAnio(anioActual);

    // 2. Sincronizar fecha de referencia
    const selectorSemanas = document.getElementById('selectorSemanas');
    if (selectorSemanas?.value) {
        FlotaState.lunesReferencia = new Date(selectorSemanas.value + 'T12:00:00');
    } else {
        FlotaState.lunesReferencia = FlotaUtils.getLunesActual(new Date());
    }

    // 3. Aplicar restricciones de rol
    FlotaUI.aplicarRestriccionesRol(rol);

    // 4. Estado de semana
    FlotaUI.actualizarEtiquetaEstado();

    // 5. Cargar datos
    setTimeout(sincronizarDesdeNube, 300);

    // 6. Auto-sync
    setInterval(() => {
        if (sessionStorage.getItem('rolGrifo')) {
            sincronizarDesdeNube();
        }
    }, FlotaConfig.DELAY_SYNC_INTERVAL);

    // 7. Cerrar modales al hacer click fuera
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });

    // 8. Cerrar modales con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
        }
    });
};
