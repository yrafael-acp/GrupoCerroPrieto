/* ============================================================
   CONFIGURACIÓN GLOBAL
============================================================ */
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz3096Smc2hIbjEr39pWKFRhVO91KlnJAVqhsbaCziqZ10pd5W2M_UudWLi3IqKth4hig/exec';

const EMPRESAS = {
    ACPAGRO: 'ACPAGRO',
    QALI: 'QALI'
};

let currentUser    = null;
let datosCache     = [];
let miGrafico      = null;
let stockTotalDiesel  = 0;
let stockTotalGasohol = 0;
let vistaGrafico   = 'mensual';
let cargandoDataInicial = true;
let timerApertura;

let proyeccionesDual = {
    DIESEL:  { cons: [1500,1500,1500,1500,1500,1500,1500], ing: [0,0,0,0,0,0,0], saldoIni: 0 },
    GASOHOL: { cons: [150,150,150,150,150,150,150],         ing: [0,0,0,0,0,0,0], saldoIni: 0 }
};

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getCurrentUser() {
    return sessionStorage.getItem('sessionGrifo') || currentUser || '';
}

function getCurrentRole() {
    return sessionStorage.getItem('rolGrifo') || 'READ';
}

function getCurrentEmpresa() {
    return sessionStorage.getItem('empresaGrifo') || EMPRESAS.ACPAGRO;
}

function buildApiUrl(action, extraParams = {}) {
    const params = new URLSearchParams({ action, empresa: getCurrentEmpresa(), ...extraParams });
    return `${WEB_APP_URL}?${params.toString()}`;
}

function withEmpresa(payload = {}) {
    return {
        empresa: getCurrentEmpresa(),
        user: payload.user || getCurrentUser(),
        ...payload,
    };
}
