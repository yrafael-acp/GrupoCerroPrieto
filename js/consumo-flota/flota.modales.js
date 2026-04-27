/**
 * flota.modales.js
 * Lógica de modales: registrar, consultar, editar, config, rango
 */

'use strict';

const FlotaModales = {

    // ── HELPERS ───────────────────────────────────

    _open(id) { document.getElementById(id).classList.add('open'); },
    _close(id) { document.getElementById(id).classList.remove('open'); },

    _bloquearBtn(btn, texto = 'PROCESANDO...') {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn._originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${texto}`;
    },

    _liberarBtn(btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        if (btn._originalHTML) btn.innerHTML = btn._originalHTML;
    },

    // ── MODAL REGISTRO MANUAL ─────────────────────

    abrirModalRegistro() {
        document.getElementById('regPlaca').value = '';
        document.getElementById('regCant').value = '';

        const lunes = FlotaUtils.getLunesActual(new Date());
        document.getElementById('regFecha').setAttribute('min', FlotaUtils.toISODate(lunes));
        document.getElementById('regFecha').value = FlotaUtils.toISODate(new Date());

        this._open('modalRegistro');
    },

    cerrarModalRegistro() { this._close('modalRegistro'); },

    async guardarRegistroManual() {
        const btn = document.querySelector('#modalRegistro .btn-modal-primary');
        const placa = document.getElementById('regPlaca').value.toUpperCase().trim();
        const fecha = document.getElementById('regFecha').value;
        const tipo = document.getElementById('regTipo').value;
        const cant = parseFloat(document.getElementById('regCant').value);

        if (!placa || !fecha || isNaN(cant) || cant <= 0) {
            FlotaUI.toast('⚠️ Completa todos los campos correctamente.', 'warning');
            return;
        }

        // Validar que no sea semana pasada
        const lunesActual = FlotaUtils.getLunesActual(new Date());
        lunesActual.setHours(0, 0, 0, 0);
        const fechaReg = new Date(fecha + 'T12:00:00');
        fechaReg.setHours(0, 0, 0, 0);

        if (fechaReg < lunesActual) {
            FlotaUI.toast(`🚫 No puedes registrar despachos de semanas pasadas. Solo desde el ${lunesActual.toLocaleDateString()}`, 'error');
            return;
        }

        this._bloquearBtn(btn, 'ENVIANDO...');
        FlotaUI.setSyncIndicator(true, 'ENVIANDO AL SERVIDOR...');

        try {
            await FlotaAPI.saveTemporal(placa, fecha, tipo, cant);
            await FlotaUtils.sleep(FlotaConfig.DELAY_POST_SAVE);

            document.getElementById('regPlaca').value = '';
            document.getElementById('regCant').value = '';
            document.getElementById('regFecha').value = '';

            this.cerrarModalRegistro();
            FlotaUI.toast(`✅ Despacho de ${placa} registrado correctamente.`, 'success');

            FlotaUI.setSyncIndicator(true, 'ACTUALIZANDO CONSUMOS...');
            await sincronizarDesdeNube();

        } catch (e) {
            FlotaUI.toast('❌ Error de conexión con el servidor.', 'error');
        } finally {
            this._liberarBtn(btn);
            FlotaUI.setSyncIndicator(false);
        }
    },

    // ── MODAL CONSULTA ÓRDENES ────────────────────

    abrirModalConsulta() { this._open('modalConsulta'); },
    cerrarModalConsulta() { this._close('modalConsulta'); },

    async ejecutarConsultaOrden() {
        const input = document.getElementById('inputOrdenes').value.trim();
        if (!input) {
            FlotaUI.toast('Por favor ingresa al menos un número de orden.', 'warning');
            return;
        }

        const fD = document.getElementById('fechaDesde').value;
        const fH = document.getElementById('fechaHasta').value;

        const loader = document.getElementById('cargaConsulta');
        const resumen = document.getElementById('resumenConsultaOrden');
        const container = document.getElementById('tablaConsultaContainer');
        const estado = document.getElementById('estadoConsulta');

        loader.classList.remove('hidden');
        resumen.classList.add('hidden');
        container.classList.add('hidden');
        estado.classList.add('hidden');

        try {
            const data = await FlotaAPI.getDetalleOrden(input, fD, fH);
            const tbody = document.querySelector('#tablaResultadoOrden tbody');
            tbody.innerHTML = '';

            if (data.status === 'OK') {
                let totalImporte = 0;

                data.items.forEach(i => {
                    totalImporte += i.importe;
                    tbody.insertAdjacentHTML('beforeend', `
                        <tr>
                            <td style="color:var(--text-secondary)">${i.fecha}</td>
                            <td><span class="badge-material">${i.tipo}</span></td>
                            <td><span class="badge-placa-order">${i.placa}</span></td>
                            <td style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted)">${i.documento}</td>
                            <td class="text-center"><span class="cant-value">${i.cantidad.toFixed(2)}</span></td>
                            <td class="text-right"><span class="importe-soles">S/ ${i.importe.toFixed(2)}</span></td>
                            <td class="text-center"><span class="badge-orden">${i.orden}</span></td>
                        </tr>`);
                });

                document.getElementById('totalGlnOrden').innerHTML = `${data.total.toFixed(2)} <span style="font-size:10px;opacity:0.7">GLN</span>`;
                document.getElementById('totalSolesOrden').innerHTML = `<span style="font-size:11px">S/</span> ${totalImporte.toFixed(2)}`;

                resumen.classList.remove('hidden');
                container.classList.remove('hidden');

            } else {
                estado.innerHTML = `
                    <div style="padding:60px;text-align:center">
                        <i class="fas fa-exclamation-circle" style="color:#f97316;font-size:36px;opacity:0.5;margin-bottom:12px;display:block"></i>
                        <p style="color:var(--text-secondary);font-weight:600">Sin resultados para estas órdenes.</p>
                    </div>`;
                estado.classList.remove('hidden');
            }

        } catch (e) {
            FlotaUI.toast('Error de conexión con el servidor.', 'error');
            estado.classList.remove('hidden');
        } finally {
            loader.classList.add('hidden');
        }
    },

    exportarConsultaExcel() {
        const tabla = document.getElementById('tablaResultadoOrden');
        const wb = XLSX.utils.table_to_book(tabla, { sheet: 'Consulta de Ordenes' });
        const fecha = FlotaUtils.toISODate(new Date());
        XLSX.writeFile(wb, `Reporte_Ordenes_ACP_${fecha}.xlsx`);
    },

    // ── MODAL EDITAR DOTACIÓN ─────────────────────

    abrirEditarFlota(placa, dotActual) {
        const rol = sessionStorage.getItem('rolGrifo');
        if (rol === 'READ') {
            FlotaUI.toast('⛔ No tienes permisos para modificar dotaciones.', 'error');
            return;
        }
        if (!FlotaUtils.tienePermisoEspecial()) return;

        document.getElementById('editPlaca').value = placa;
        document.getElementById('editDotacion').value = dotActual;
        this._open('modalEditarFlota');
    },

    cerrarModalEditarFlota() { this._close('modalEditarFlota'); },

    async guardarExcepcionSemanal() {
        const btn = document.querySelector('#modalEditarFlota .btn-modal-primary');
        const placa = document.getElementById('editPlaca').value;
        const nuevaDot = parseFloat(document.getElementById('editDotacion').value);
        const placaNorm = FlotaUtils.normalizarPlaca(placa);
        const semana = document.getElementById('selectorSemanas').value;

        if (isNaN(nuevaDot)) {
            FlotaUI.toast('⚠️ Ingrese un monto válido.', 'warning');
            return;
        }

        this._bloquearBtn(btn, 'APLICANDO...');
        FlotaUI.setSyncIndicator(true, 'APLICANDO EXCEPCIÓN SEMANAL...');

        try {
            const infoActual = FlotaState.ESTRUCTURA_FLOTA.find(g => g.p.includes(placa));
            const dotAnterior = infoActual ? infoActual.a : 0;
            const userLog = sessionStorage.getItem('usuarioGrifo') || sessionStorage.getItem('sessionGrifo');

            await FlotaAPI.saveExcepcion(semana, placaNorm, nuevaDot, userLog);
            await FlotaUtils.sleep(FlotaConfig.DELAY_POST_SAVE);

            const diff = nuevaDot - dotAnterior;
            if (diff > 0) {
                FlotaUI.toast(`✅ ${placa}: +${diff.toFixed(2)} GLN asignados extra.`, 'success');
            } else {
                FlotaUI.toast(`✅ Dotación ajustada para ${placa}.`, 'success');
            }

            this.cerrarModalEditarFlota();
            FlotaUI.setSyncIndicator(true, 'ACTUALIZANDO TABLA...');
            await sincronizarDesdeNube();

        } catch (e) {
            FlotaUI.toast('❌ Error al conectar con el servidor.', 'error');
        } finally {
            this._liberarBtn(btn);
            FlotaUI.setSyncIndicator(false);
        }
    },

    // ── MODAL CONFIGURACIÓN ───────────────────────

    abrirModalConfig() {
        if (FlotaUtils.esSemanaPasada()) {
            FlotaUI.toast('⚠️ Modo CONSULTA — Semana pasada. Las altas/bajas requieren Llave Maestra.', 'warning');
        }
        this._open('modalConfig');
        this.renderListaConfig();
    },

    cerrarModalConfig() { this._close('modalConfig'); },

    cambiarTabConfig(tab) {
        const isLista = tab === 'lista';
        document.getElementById('panelListaConfig').classList.toggle('hidden', !isLista);
        document.getElementById('panelAltaConfig').classList.toggle('hidden', isLista);

        document.getElementById('btnTabLista').className = `config-tab ${isLista ? 'config-tab-active' : ''}`;
        document.getElementById('btnTabAlta').className = `config-tab ${!isLista ? 'config-tab-active' : ''}`;

        if (isLista) this.renderListaConfig();
    },

    renderListaConfig() {
        const contenedor = document.getElementById('listaConfigFlota');
        if (!FlotaState.ESTRUCTURA_FLOTA.length) {
            contenedor.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;font-size:11px">No hay datos cargados. Sincroniza primero.</p>';
            return;
        }

        contenedor.innerHTML = FlotaState.ESTRUCTURA_FLOTA.map(g => `
            <div class="config-item">
                <div class="config-item-info">
                    <span class="config-item-placa">${g.p[0]}</span>
                    <span class="config-item-resp">${g.r} | ${g.area}</span>
                </div>
                <button onclick="FlotaModales.ejecutarBajaMaestro('${g.p[0]}')" class="btn-dar-baja">
                    <i class="fas fa-arrow-down mr-1"></i>DAR DE BAJA
                </button>
            </div>`).join('');
    },

    async registrarAltaMaestro() {
        if (!FlotaUtils.tienePermisoEspecial()) return;

        const placa = document.getElementById('newPlaca').value.trim();
        const fechaAlta = document.getElementById('newFechaAlta').value;

        if (!placa || !fechaAlta) {
            FlotaUI.toast('Placa y Fecha de Alta son obligatorios.', 'warning');
            return;
        }

        const data = {
            placa,
            dotacion: document.getElementById('newDot').value,
            idVinculo: document.getElementById('newIdVinculo').value,
            responsable: document.getElementById('newResp').value,
            area: document.getElementById('newArea').value,
            fechaAlta,
        };

        FlotaUI.setSyncIndicator(true, 'REGISTRANDO EN MAESTRO...');

        try {
            await FlotaAPI.insertarFlota(data);
            FlotaUI.toast(`✅ Unidad ${placa.toUpperCase()} registrada exitosamente.`, 'success');
            this.cerrarModalConfig();
            await sincronizarDesdeNube();
        } catch (e) {
            FlotaUI.toast('❌ Error al registrar la unidad.', 'error');
        } finally {
            FlotaUI.setSyncIndicator(false);
        }
    },

    async ejecutarBajaMaestro(placa) {
        if (!FlotaUtils.tienePermisoEspecial()) return;

        const fechaBaja = prompt(`Confirme la fecha de BAJA para ${placa}:`, FlotaUtils.toISODate(new Date()));
        if (!fechaBaja) return;

        FlotaUI.setSyncIndicator(true, 'PROCESANDO BAJA...');

        try {
            await FlotaAPI.darBajaFlota(placa, fechaBaja);
            FlotaUI.toast(`✅ Baja procesada para ${placa}.`, 'success');
            this.cerrarModalConfig();
            await sincronizarDesdeNube();
        } catch (e) {
            FlotaUI.toast('❌ Error al procesar la baja.', 'error');
        } finally {
            FlotaUI.setSyncIndicator(false);
        }
    },

    // ── MODAL RANGO SAP ───────────────────────────

    abrirModalRango() { this._open('modalRango'); },
    cerrarModalRango() { this._close('modalRango'); },

    async ejecutarSincronizacionRango() {
        const desde = document.getElementById('rangoDesde').value;
        const hasta = document.getElementById('rangoHasta').value;

        if (!desde || !hasta) {
            FlotaUI.toast('Selecciona ambas fechas.', 'warning');
            return;
        }

        FlotaUI.setSyncIndicator(true, 'SINCRONIZANDO RANGO SAP...');
        this.cerrarModalRango();

        try {
            await FlotaAPI.distribuirDataPorRango(desde, hasta);
            FlotaUI.toast('✅ Sincronización enviada. En unos segundos la data estará lista.', 'success');
            await sincronizarDesdeNube();
        } catch (e) {
            FlotaUI.toast('❌ Error al conectar con la nube.', 'error');
        } finally {
            FlotaUI.setSyncIndicator(false);
        }
    },
};

// ── EXPONER FUNCIONES GLOBALES (COMPATIBILIDAD HTML ONCLICK) ──

function abrirModalRegistro() { FlotaModales.abrirModalRegistro(); }
function cerrarModalRegistro() { FlotaModales.cerrarModalRegistro(); }
function guardarRegistroManual() { FlotaModales.guardarRegistroManual(); }

function abrirModalConsulta() { FlotaModales.abrirModalConsulta(); }
function cerrarModalConsulta() { FlotaModales.cerrarModalConsulta(); }
function ejecutarConsultaOrden() { FlotaModales.ejecutarConsultaOrden(); }
function exportarConsultaExcel() { FlotaModales.exportarConsultaExcel(); }

function abrirEditarFlota(p, d) { FlotaModales.abrirEditarFlota(p, d); }
function cerrarModalEditarFlota() { FlotaModales.cerrarModalEditarFlota(); }
function guardarExcepcionSemanal() { FlotaModales.guardarExcepcionSemanal(); }

function abrirModalConfig() { FlotaModales.abrirModalConfig(); }
function cerrarModalConfig() { FlotaModales.cerrarModalConfig(); }
function cambiarTabConfig(t) { FlotaModales.cambiarTabConfig(t); }
function registrarAltaMaestro() { FlotaModales.registrarAltaMaestro(); }
function ejecutarBajaMaestro(p) { FlotaModales.ejecutarBajaMaestro(p); }

function abrirModalRango() { FlotaModales.abrirModalRango(); }
function cerrarModalRango() { FlotaModales.cerrarModalRango(); }
function ejecutarSincronizacionRango() { FlotaModales.ejecutarSincronizacionRango(); }
