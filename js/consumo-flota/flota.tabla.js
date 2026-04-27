/**
 * flota.tabla.js
 * Renderizado de la tabla principal de flota y filtros
 */

'use strict';

const FlotaTabla = {

    /**
     * Renderiza la tabla completa con los datos de flota
     * @param {Array} datos
     */
    render(datos) {
        console.log("Datos recibidos de la nube:", datos);
        const cuerpo = document.getElementById('cuerpoTabla');
        cuerpo.innerHTML = '';

        if (!datos || datos.length === 0) {
            FlotaUI.actualizarResumen(0, 0);
            FlotaUI.actualizarContador(0);
            return;
        }

        // Filtrar por fecha de alta
        const fechaFinSemana = new Date(FlotaState.lunesReferencia);
    fechaFinSemana.setDate(fechaFinSemana.getDate() + 6);
    fechaFinSemana.setHours(23, 59, 59, 999);

        const datosFiltrados = datos.filter(g => {
        if (!g.fAlta || g.fAlta === 'null' || g.fAlta === '-') return true;
        
        try {
            const [dia, mes, anio] = g.fAlta.split('/');
            const fechaAlta = new Date(Number(anio), Number(mes) - 1, Number(dia), 0, 0, 0);
            return fechaAlta <= fechaFinSemana;
        } catch (e) {
            console.warn("Error parseando fecha de alta:", g.fAlta);
            return true; 
        }
    });

        if (datosFiltrados.length === 0) {
            FlotaUI.actualizarResumen(0, 0);
            FlotaUI.actualizarContador(0);
            return;
        }

        let tA = 0, tC = 0;
        const vinculosMostrados = {};
        const conteoVinculos = {};

        // Contar placas por vínculo
        datosFiltrados.forEach(g => {
            const id = g.id || g.p[0];
            conteoVinculos[id] = (conteoVinculos[id] || 0) + 1;
        });

        // Renderizar filas
        datosFiltrados.forEach(g => {
            const idVinculo = g.id || g.p[0];
            const yaMostrado = vinculosMostrados[idVinculo];

            const asig = parseFloat(g.a) || 0;
            const totalGrupo = parseFloat(g.totalGrupo) || 0;
            const saldoGrupo = asig - totalGrupo;

            if (!yaMostrado) {
                tA += asig;
                tC += totalGrupo;
                vinculosMostrados[idVinculo] = true;
            }

            const rowspan = conteoVinculos[idVinculo];
            const grupoItems = datosFiltrados.filter(d => (d.id || d.p[0]) === idVinculo);
            const miIndice = grupoItems.indexOf(g);

            const fila = this._buildRow(g, asig, totalGrupo, saldoGrupo, rowspan, miIndice);
            cuerpo.insertAdjacentHTML('beforeend', fila);
        });

        FlotaUI.actualizarResumen(tA, tC);
        FlotaUI.actualizarContador(datosFiltrados.length);
    },

    /**
     * Construye el HTML de una fila
     * @private
     */
    _buildRow(g, asig, totalGrupo, saldoGrupo, rowspan, miIndice) {
        const placa = g.p[0];
        const idVinculo = g.id || placa;
        const esAdmin = sessionStorage.getItem('rolGrifo') === 'ADMIN';

        const labelBaja = (g.baja && g.baja !== 'null' && g.baja !== '')
        ? `<span class="badge-baja-label"><i class="fas fa-arrow-down"></i>BAJA</span>` : '';

        const idHtml = esAdmin
        ? `<div class="placa-id-ref">ID: ${idVinculo}</div>`
        : '';

        // Días de la semana
        const dias = ['L', 'M', 'Mi', 'J', 'V', 'S', 'D'];
        const diasHtml = dias.map(d => {
            const val = g[d];
            const hasVal = val && parseFloat(val) > 0;
            return `<td class="text-center" data-label="${d}">
                        <span class="day-value ${hasVal ? 'has-value' : ''}">${hasVal ? parseFloat(val).toFixed(2) : '-'}</span>
                    </td>`;
        }).join('');

        // Celdas de resumen (solo en primera fila del grupo)
        let resumenHtml = '';
        if (miIndice === 0) {
            const iconoExc = g.exc
                ? '<i class="fas fa-bolt exc-icon" title="Dotación ajustada solo para esta semana"></i>' : '';

            const saldoClass = saldoGrupo < 2 ? 'saldo-cell-critical' : 'saldo-cell-ok';

            resumenHtml = `
                <td rowspan="${rowspan}" class="asig-cell" data-label="ASIG.">
                    ${iconoExc}<span>${asig.toFixed(2)}</span>
                </td>
                <td rowspan="${rowspan}" class="cons-cell" data-label="CONS.">
                    ${totalGrupo.toFixed(2)}
                </td>
                <td rowspan="${rowspan}" class="${saldoClass}" data-label="SALDO">
                    ${saldoGrupo.toFixed(2)}
                    ${saldoGrupo < 2 ? '<i class="fas fa-exclamation-triangle ml-1" style="font-size:10px"></i>' : ''}
                </td>`;
        }

        return `
            <tr>
               <td data-label="PLACA">
                <div class="placa-wrap">
                <button onclick="FlotaModales.abrirEditarFlota('${placa}', ${asig})" class="placa-btn">
                <i class="fas fa-pencil-alt edit-icon"></i>${placa}
                </button>
            ${idHtml}
        </div>
    </td>
                <td data-label="RESPONSABLE">
                    <div class="resp-name">${g.r}${labelBaja}</div>
                    <div class="resp-area">${g.area}</div>
                </td>
                ${diasHtml}
                ${resumenHtml}
            </tr>`;
    },

    /**
     * Filtra las filas de la tabla por texto
     */
    filtrar() {
        const q = document.getElementById('buscador').value.toUpperCase();
        const filas = document.querySelectorAll('#cuerpoTabla tr');
        let visibles = 0;

        filas.forEach(r => {
            const match = r.innerText.toUpperCase().includes(q);
            r.style.display = match ? '' : 'none';
            if (match) visibles++;
        });

        FlotaUI.actualizarContador(visibles);
    },
};

// Expose para HTML onkeyup
function filtrarTabla() { FlotaTabla.filtrar(); }
