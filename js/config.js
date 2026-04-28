/* ============================================================
   CONFIGURACIÓN GLOBAL V2
============================================================ */
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwfmWFdfyzFEftjS76Xd6Id14WsVuo4kbvHoPYWaXfBSDhbS6DwZgukt9YVabvTAlkGzA/exec';

const EMPRESAS = {
    ACP: 'ACP',
    QALI: 'QALI'
};

const ROLES = {
    READ: 'READ',
    ADMIN: 'ADMIN',
    SUPERADMIN: 'SUPERADMIN'
};

let currentUser = null;
let datosCache = [];
let miGrafico = null;
let stockTotalDiesel = 0;
let stockTotalGasohol = 0;
let vistaGrafico = 'mensual';
let cargandoDataInicial = true;
let timerApertura;

let proyeccionesDual = {
    DIESEL:  { cons: [1500,1500,1500,1500,1500,1500,1500], ing: [0,0,0,0,0,0,0], saldoIni: 0 },
    GASOHOL: { cons: [150,150,150,150,150,150,150], ing: [0,0,0,0,0,0,0], saldoIni: 0 }
};

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MESES_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function getCurrentUser() {
    return sessionStorage.getItem('sessionGrifo') || currentUser || '';
}

function getCurrentRole() {
    return sessionStorage.getItem('rolGrifo') || ROLES.READ;
}

function getCurrentEmpresa() {
    return sessionStorage.getItem('empresaGrifo') || EMPRESAS.ACP;
}

function getSessionToken() {
    return sessionStorage.getItem('tokenGrifo') || '';
}

function getSessionExpiresAt() {
    return sessionStorage.getItem('tokenExpGrifo') || '';
}

function isSessionExpired() {
    const exp = getSessionExpiresAt();
    return !!exp && Date.now() > new Date(exp).getTime();
}

function isSuperAdmin() {
    return getCurrentRole() === ROLES.SUPERADMIN;
}

function buildApiUrl(action, extraParams = {}) {
    const params = new URLSearchParams({ action, empresa: getCurrentEmpresa(), token: getSessionToken(), ...extraParams });
    return `${WEB_APP_URL}?${params.toString()}`;
}

function withEmpresa(payload = {}) {
    return {
        empresa: payload.empresa || getCurrentEmpresa(),
        user: payload.user || getCurrentUser(),
        token: payload.token || getSessionToken(),
        ...payload,
    };
}

function jsonpRequest(url) {
    return new Promise((resolve, reject) => {
        const cbName = '__jsonp_cb_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
        const sep = url.includes('?') ? '&' : '?';
        const script = document.createElement('script');
        let done = false;
        const cleanup = () => {
            if (script.parentNode) script.parentNode.removeChild(script);
            try { delete window[cbName]; } catch (_) { window[cbName] = undefined; }
        };
        window[cbName] = (data) => {
            done = true;
            cleanup();
            resolve(data);
        };
        script.onerror = () => {
            cleanup();
            reject(new Error('No se pudo conectar con el servidor.'));
        };
        script.src = url + sep + 'callback=' + encodeURIComponent(cbName) + '&_ts=' + Date.now();
        document.body.appendChild(script);
        setTimeout(() => {
            if (!done) { cleanup(); reject(new Error('Tiempo de espera agotado.')); }
        }, 20000);
    });
}

async function apiGet(action, extraParams = {}) {
    const data = await jsonpRequest(buildApiUrl(action, extraParams));
    if (data && data.status === 'ERROR') throw new Error(data.message || 'Error de servidor');
    return data;
}

async function apiPost(payload = {}) {
    const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(withEmpresa(payload))
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (data && data.status === 'ERROR') throw new Error(data.message || 'Error de servidor');
    return data;
}

function handleAuthError(error) {
    const msg = (error && error.message ? error.message : String(error || '')).toLowerCase();
    if (msg.includes('sesi') || msg.includes('token') || msg.includes('autoriz')) {
        alert('Tu sesión venció o ya no es válida. Vuelve a iniciar sesión.');
        logout(false);
        return true;
    }
    return false;
}

function applySessionData(res) {
    currentUser = (res.user || '').toString().toUpperCase();
    sessionStorage.setItem('sessionGrifo', currentUser);
    sessionStorage.setItem('rolGrifo', (res.role || ROLES.READ).toUpperCase());
    sessionStorage.setItem('empresaGrifo', (res.empresa || EMPRESAS.ACP).toUpperCase());
    sessionStorage.setItem('tokenGrifo', res.token || '');
    sessionStorage.setItem('tokenExpGrifo', res.sessionExpiresAt || '');
}


function bootstrapProtectedView(options = {}) {
    const sess = getCurrentUser();
    const role = getCurrentRole();
    const token = getSessionToken();
    const roles = options.roles || [];

    if (!sess || !role || !token || isSessionExpired()) {
        sessionStorage.clear();
        window.location.href = 'index.html';
        return false;
    }

    currentUser = sess;
    injectSessionStyles();
    renderUserBadge();

    if (roles.length && !roles.includes(role)) {
        alert(options.forbiddenMessage || 'No tienes permisos para acceder a este módulo.');
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

