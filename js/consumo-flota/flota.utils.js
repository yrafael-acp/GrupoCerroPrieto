/**
 * flota.utils.js
 * Utilidades puras: fechas, formato, cálculos
 */

'use strict';

const FlotaUtils = {

    /**
     * Obtiene el lunes de la semana de una fecha dada
     * @param {Date} f
     * @returns {Date}
     */
    getLunesActual(f) {
        const d = new Date(f);
        d.setHours(12, 0, 0, 0);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    },

    /**
     * Verifica si la semana seleccionada ya pasó
     * @returns {boolean}
     */
    esSemanaPasada() {
        const hoy = new Date();
        const lunesActual = this.getLunesActual(hoy);
        lunesActual.setHours(0, 0, 0, 0);

        const fechaSeleccionada = new Date(FlotaState.lunesReferencia);
        fechaSeleccionada.setHours(0, 0, 0, 0);

        return fechaSeleccionada < lunesActual;
    },

    /**
     * Convierte una fecha a string ISO yyyy-MM-dd
     * @param {Date} d
     * @returns {string}
     */
    toISODate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Formatea un número a 2 decimales, devuelve '-' si es 0
     * @param {number} val
     * @param {boolean} showZero
     * @returns {string}
     */
    fmt2(val, showZero = false) {
        const n = parseFloat(val) || 0;
        if (n === 0 && !showZero) return '-';
        return n.toFixed(2);
    },

    /**
     * Normaliza una placa quitando guiones y espacios
     * @param {string} placa
     * @returns {string}
     */
    normalizarPlaca(placa) {
        return (placa || '').toString().replace(/[-\s]/g, '').toUpperCase().trim();
    },

    /**
     * Verifica si tiene permiso para editar (semana activa o llave maestra)
     * @returns {boolean}
     */
    tienePermisoEspecial() {
        if (!this.esSemanaPasada()) return true;
        const pass = prompt('⚠️ ESTA SEMANA YA CERRÓ.\nIngrese la Llave Maestra para editar:');
        if (pass === FlotaConfig.LLAVE_MAESTRA) return true;
        FlotaUI.toast('❌ Llave incorrecta. Acción cancelada.', 'error');
        return false;
    },

    /**
     * Pobla el selector de años
     */
    poblarAnios() {
        const sel = document.getElementById('selectorAnio');
        const anioActual = new Date().getFullYear();
        for (let y = 2025; y <= anioActual; y++) {
            sel.add(new Option(y, y, y === anioActual, y === anioActual));
        }
    },

    /**
     * Pobla el selector de semanas para un año dado
     * @param {number} anio
     */
    poblarSemanasPorAnio(anio) {
        const sel = document.getElementById('selectorSemanas');
        sel.innerHTML = '';

        const hoy = new Date();
        const hoyLunes = this.getLunesActual(hoy);
        hoyLunes.setHours(0, 0, 0, 0);

        let f = this.getLunesActual(new Date(`${anio}-01-01T12:00:00`));
        const ops = [];

        while (f.getFullYear() <= anio) {
            const fechaLunesObj = new Date(f);
            fechaLunesObj.setHours(0, 0, 0, 0);
            if (fechaLunesObj > hoyLunes) break;

            let fin = new Date(f);
            fin.setDate(f.getDate() + 6);

            ops.push({
                val: this.toISODate(f),
                text: `Sem: ${f.toLocaleDateString()} al ${fin.toLocaleDateString()}`
            });

            f.setDate(f.getDate() + 7);
        }

        ops.reverse().forEach((op, index) => {
            const opt = new Option(op.text, op.val);
            if (index === 0) opt.selected = true;
            sel.add(opt);
        });
    },

    /**
     * Genera delay asíncrono
     * @param {number} ms
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
