/**
 * flota.api.js
 * Capa de datos: todas las llamadas al backend GAS
 * Centraliza fetch GET y POST, maneja errores uniformemente
 */

'use strict';

const FlotaAPI = {
    _url: FlotaConfig.WEB_APP_URL,

    getEmpresa() {
        return sessionStorage.getItem('empresaGrifo') || 'ACPAGRO';
    },

    getUsuario() {
        return sessionStorage.getItem('sessionGrifo') || 'S/U';
    },

    async get(params) {
        const qs = new URLSearchParams({ ...params, empresa: this.getEmpresa() }).toString();
        const res = await fetch(`${this._url}?${qs}`);
        return res.json();
    },

    async post(payload, expectResponse = false) {
        const options = {
            method: 'POST',
            body: JSON.stringify({ empresa: this.getEmpresa(), user: this.getUsuario(), ...payload }),
        };

        if (!expectResponse) {
            options.mode = 'no-cors';
            await fetch(this._url, options);
            return { status: 'OK' };
        }

        const res = await fetch(this._url, options);
        return res.json();
    },

    async getFlota(fechaISO) {
        return this.get({ action: 'getFlota', fecha: fechaISO });
    },

    async saveExcepcion(semana, placa, dotacion, userLog) {
        return this.post({ action: 'saveExcepcion', semana, placa, dotacion, userLog: userLog || this.getUsuario() });
    },

    async saveTemporal(placa, fecha, tipo, cantidad) {
        return this.post({ action: 'saveTemporal', placa: placa.toUpperCase().trim(), fecha, tipo, cantidad });
    },

    async limpiarTemporales() {
        return this.post({ action: 'limpiarTemporales' });
    },

    async getDetalleOrden(ordenes, desde, hasta) {
        return this.get({ action: 'getDetalleOrden', orden: encodeURIComponent(ordenes), desde, hasta });
    },

    async distribuirDataPorRango(desde, hasta) {
        return this.post({ action: 'distribuirDataPorRango', desde, hasta });
    },

    async insertarFlota(data) {
        return this.post({ action: 'insertFlota', ...data });
    },

    async darBajaFlota(placa, fechaBaja) {
        return this.post({ action: 'updateFlota', placa, fechaBaja });
    },

    async auditar(tipo, anio, mes) {
        return this.get({ action: 'auditar', tipo, anio, mes });
    },

    async uploadSAPData(payload, user) {
        return this.post({ action: 'uploadSAPData', user: user || this.getUsuario(), payload }, true);
    },
};
