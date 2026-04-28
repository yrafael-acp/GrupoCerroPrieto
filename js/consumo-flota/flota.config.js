/**
 * flota.config.js
 * Configuración global y constantes del sistema de flota ACP/QALI
 */
'use strict';

const FlotaConfig = {
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbxkTus1dbIG10z-fMi3Lnr_S0cynkMbYl81aUqVdi_c0DaFl_qCMD7xSPMRLWaiXtOLrw/exec',
    DELAY_POST_SAVE: 800,
    DELAY_SYNC_INTERVAL: 60000,
    TOAST_DURATION: 4000,
    MAX_RADAR_HEIGHT: 380,
};

const FlotaState = {
    ESTRUCTURA_FLOTA: [],
    lunesReferencia: new Date(),
    miGrafico: null,
};
