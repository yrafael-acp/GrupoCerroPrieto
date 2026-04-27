/**
 * flota.api.js
 * Capa de datos: todas las llamadas al backend GAS
 */
'use strict';

const FlotaAPI = {
    _url: FlotaConfig.WEB_APP_URL,
    getEmpresa() { return sessionStorage.getItem('empresaGrifo') || 'ACP'; },
    getUsuario() { return sessionStorage.getItem('sessionGrifo') || 'S/U'; },
    getToken() { return sessionStorage.getItem('tokenGrifo') || ''; },

    async get(params) {
        const qs = new URLSearchParams({ ...params, empresa: this.getEmpresa(), token: this.getToken() }).toString();
        const res = await fetch(`${this._url}?${qs}`);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data && data.status === 'ERROR') throw new Error(data.message || 'Error de servidor');
        return data;
    },

    async post(payload) {
        const res = await fetch(this._url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ empresa: this.getEmpresa(), user: this.getUsuario(), token: this.getToken(), ...payload }),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data && data.status === 'ERROR') throw new Error(data.message || 'Error de servidor');
        return data;
    },

    async getFlota(fechaISO) { return this.get({ action: 'getFlota', fecha: fechaISO }); },
    async saveExcepcion(semana, placa, dotacion, userLog) { return this.post({ action: 'saveExcepcion', semana, placa, dotacion, userLog: userLog || this.getUsuario() }); },
    async saveTemporal(placa, fecha, tipo, cantidad) { return this.post({ action: 'saveTemporal', placa: placa.toUpperCase().trim(), fecha, tipo, cantidad }); },
    async limpiarTemporales() { return this.post({ action: 'limpiarTemporales' }); },
    async getDetalleOrden(ordenes, desde, hasta) { return this.get({ action: 'getDetalleOrden', orden: encodeURIComponent(ordenes), desde, hasta }); },
    async distribuirDataPorRango(desde, hasta) { return this.post({ action: 'distribuirDataPorRango', desde, hasta }); },
    async insertarFlota(data) { return this.post({ action: 'insertFlota', ...data }); },
    async darBajaFlota(placa, fechaBaja) { return this.post({ action: 'updateFlota', placa, fechaBaja }); },
    async auditar(tipo, anio, mes) { return this.get({ action: 'auditar', tipo, anio, mes }); },
    async uploadSAPData(payload, user) { return this.post({ action: 'uploadSAPData', user: user || this.getUsuario(), payload }); },
};
