/**
 * flota.ui.js
 * Módulo UI: toasts, estado de semana, modales, indicadores
 */

'use strict';

const FlotaUI = {

    // ── TOAST SYSTEM ──────────────────────────────

    /**
     * Muestra un toast notification
     * @param {string} msg
     * @param {'success'|'error'|'warning'|'info'} type
     */
    toast(msg, type = 'info') {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
        };

        const container = document.getElementById('toastContainer');
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `<i class="${icons[type]} toast-icon"></i><span>${msg}</span>`;

        container.appendChild(el);

        setTimeout(() => {
            el.style.animation = 'slideInToast 0.3s ease reverse';
            setTimeout(() => el.remove(), 300);
        }, FlotaConfig.TOAST_DURATION);
    },

    // ── ESTADO DE SEMANA ──────────────────────────

    /**
     * Actualiza el badge de estado de semana (Activo/Bloqueado)
     */
    actualizarEtiquetaEstado() {
        const el = document.getElementById('estadoSemana');
        if (!el) return;

        if (FlotaUtils.esSemanaPasada()) {
            el.textContent = '🔒 BLOQUEADO';
            el.className = 'week-status locked';
        } else {
            el.textContent = '🔓 ACTIVO';
            el.className = 'week-status active';
        }
    },

    // ── INDICADOR DE CARGA ────────────────────────

    /**
     * Muestra / oculta el indicador de sincronización
     * @param {boolean} visible
     * @param {string} label
     */
    setSyncIndicator(visible, label = 'SINCRONIZANDO...') {
        const ind = document.getElementById('indicadorCarga');
        const lbl = document.getElementById('syncLabel');
        if (!ind) return;
        if (visible) {
            ind.classList.remove('hidden');
            if (lbl) lbl.textContent = label;
        } else {
            ind.classList.add('hidden');
        }
    },

    // ── KPIs ──────────────────────────────────────

    /**
     * Actualiza los 4 KPI cards
     * @param {number} tA - total asignado
     * @param {number} tC - total consumido
     */
    actualizarResumen(tA, tC) {
        const saldo = tA - tC;
        const efic = tA > 0 ? ((tC / tA) * 100).toFixed(1) : 0;

        document.getElementById('resumenAsignado').textContent = tA.toFixed(2);
        document.getElementById('resumenConsumido').textContent = tC.toFixed(2);
        document.getElementById('resumenSaldo').textContent = saldo.toFixed(2);
        document.getElementById('resumenEficiencia').textContent = efic + '%';

        // Actualizar el ring SVG de eficiencia
        const arc = document.getElementById('efficiencyArc');
        if (arc) {
            const pct = Math.min(parseFloat(efic), 100);
            arc.setAttribute('stroke-dasharray', `${pct} 100`);
        }

        // Color del saldo
        const saldoEl = document.getElementById('resumenSaldo');
        saldoEl.style.color = saldo < 0 ? '#f87171' : '';
    },

    // ── CONTADOR DE FILAS ─────────────────────────

    /**
     * Actualiza el badge con número de unidades
     * @param {number} n
     */
    actualizarContador(n) {
        const el = document.getElementById('contadorFilas');
        if (el) el.textContent = `${n} unidades`;
    },

    // ── RADAR ─────────────────────────────────────

    /**
     * Muestra spinner en el radar
     */
    radarLoading() {
        const lista = document.getElementById('listaInactivos');
        lista.innerHTML = `
            <div class="radar-empty" style="grid-column:1/-1">
                <i class="fas fa-satellite-dish fa-spin" style="color:#3b82f6;opacity:0.8"></i>
                <p style="color:#60a5fa;font-weight:700;letter-spacing:2px">ESCANEANDO HISTORIAL EN SAP...</p>
            </div>`;
    },

    /**
     * Renderiza la lista de inactivos en el radar
     * @param {Array} inactivos
     */
    renderRadarInactivos(inactivos) {
        const lista = document.getElementById('listaInactivos');

        if (inactivos.length === 0) {
            lista.innerHTML = `
                <div class="radar-empty" style="grid-column:1/-1">
                    <i class="fas fa-check-circle" style="color:#4ade80;opacity:0.8"></i>
                    <p style="color:#4ade80;font-weight:700">¡Flota al 100%! Todas las unidades registran consumos.</p>
                </div>`;
            return;
        }

        lista.innerHTML = inactivos.map(d => {
            const esNueva = d.alta && d.alta.includes('/26');
            return `
                <div class="radar-inactivo">
                    <div class="radar-inactivo-info">
                        <span class="radar-inactivo-placa">${d.p}</span>
                        <span class="radar-inactivo-resp">${d.r}</span>
                        <div class="radar-inactivo-badges">
                            <span class="badge-alta">ALTA: ${d.alta}</span>
                            ${d.baja ? `<span class="badge-baja">BAJA: ${d.baja}</span>` : ''}
                            ${esNueva ? '<span class="badge-alta">NUEVO</span>' : ''}
                        </div>
                    </div>
                    <button onclick="FlotaModales.ejecutarBajaMaestro('${d.p}')" class="btn-baja-inactivo">
                        <i class="fas fa-arrow-down mr-1"></i>BAJA
                    </button>
                </div>`;
        }).join('');
    },

    // ── RESTRICCIONES DE ROL ──────────────────────

    /**
     * Aplica restricciones de UI según el rol del usuario
     * @param {'ADMIN'|'READ'} rol
     */
    aplicarRestriccionesRol(rol) {
        const btnCalc = document.getElementById('btnCalcFlota');
        const btnSalir = document.getElementById('btnSalirFlota');
        const btnCerrar = document.getElementById('btnCerrarAdmin');

        if (rol === 'ADMIN') {
            if (btnCalc) btnCalc.style.display = 'none';
            if (btnSalir) btnSalir.style.display = 'none';
            if (btnCerrar) btnCerrar.style.display = 'flex';
        } else {
            if (btnCerrar) btnCerrar.style.display = 'none';
        }

        if (rol === 'READ') {
            const botonesOcultar = ['btnConsulta', 'btnRango', 'btnConfig', 'btnLimpiar'];
            botonesOcultar.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            // Ocultar panel SAP
            document.querySelectorAll('.sap-upload-panel, .admin-only').forEach(el => {
                el.style.display = 'none';
            });

            // Bloquear clicks en placas
            const style = document.createElement('style');
            style.textContent = `.placa-btn { pointer-events: none !important; color: var(--text-secondary) !important; cursor: default !important; } .placa-btn .edit-icon { display: none !important; }`;
            document.head.appendChild(style);
        }

        // ── KPIs resumen (solo ADMIN) ──────────────────────
        const kpiGrid = document.getElementById('kpiGrid');
        if (kpiGrid) {
            kpiGrid.style.display = rol === 'READ' ? 'none' : '';
        }

        // ── RADAR SOLO ADMIN ──────────────────────
        const radar = document.querySelector('.radar-panel');
        if (radar) {
            radar.style.display = (rol === 'ADMIN') ? '' : 'none';
        }
    }
};
