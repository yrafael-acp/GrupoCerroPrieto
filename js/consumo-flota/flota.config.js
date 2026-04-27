/**
 * flota.config.js
 * Configuración global y constantes del sistema de flota ACP
 */

'use strict';

const FlotaConfig = {
    // ── BACKEND ──
    WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwfmWFdfyzFEftjS76Xd6Id14WsVuo4kbvHoPYWaXfBSDhbS6DwZgukt9YVabvTAlkGzA/exec',

    // ── SEGURIDAD ──
    LLAVE_MAESTRA: '@Shelby12032020',

    // ── DELAYS ──
    DELAY_POST_SAVE: 800,         // ms después de guardar para refrescar
    DELAY_SYNC_INTERVAL: 60000,   // Auto-sync cada 60 segundos

    // ── UI ──
    TOAST_DURATION: 4000,         // ms que dura el toast
    MAX_RADAR_HEIGHT: 380,        // px máximo del panel radar
};

// Estado global del módulo
const FlotaState = {
    ESTRUCTURA_FLOTA: [],
    lunesReferencia: new Date(),
    miGrafico: null,
};
