/* ============================================================
   AUTENTICACIÓN V2
============================================================ */
async function handleLogin() {
    const user = (document.getElementById('userInput').value || '').trim().toUpperCase();
    const pass = (document.getElementById('passInput').value || '').trim();
    const errEl = document.getElementById('loginError');
    errEl.style.display = 'none';

    if (!user || !pass) { showLoginError('Completa usuario y contraseña.'); return; }

    const btn = document.getElementById('btnLogin');
    btn.textContent = 'Verificando…';
    btn.disabled = true;

    try {
        const resp = await fetch(`${WEB_APP_URL}?action=login&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);
        const raw = await resp.text();
        if (!resp.ok) throw new Error('HTTP ' + resp.status);

        let res;
        try {
            res = JSON.parse(raw);
        } catch (_) {
            throw new Error(raw || 'Respuesta inválida del servidor');
        }

        if (res.auth === 'OK') {
            applySessionData(res);
            if (res.forceChange) {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('changePassForm').style.display = 'block';
            } else {
                startSession(getCurrentUser());
            }
        } else {
            showLoginError(res.msg || res.message || 'Credenciales incorrectas.');
        }
    } catch (e) {
        const msg = (e && e.message ? e.message : 'Error de conexión. Intenta nuevamente.');
        showLoginError(msg.includes('HTTP ') ? 'Error de conexión. Intenta nuevamente.' : msg);
    } finally {
        btn.textContent = 'Ingresar →';
        btn.disabled = false;
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg;
    el.style.display = 'block';
}

async function saveNewPassword() {
    const p1 = document.getElementById('newPassInput').value;
    const p2 = document.getElementById('confirmPassInput').value;
    const errEl = document.getElementById('passError');
    errEl.style.display = 'none';

    if (p1 !== p2) {
        errEl.textContent = 'Las claves no coinciden.';
        errEl.style.display = 'block';
        return;
    }
    if (p1.length < 8) {
        errEl.textContent = 'La clave debe tener al menos 8 caracteres.';
        errEl.style.display = 'block';
        return;
    }
    if (!/^(?=.*[A-Z])(?=.*\d).+$/.test(p1)) {
        errEl.textContent = 'Incluye al menos 1 mayúscula y 1 número.';
        errEl.style.display = 'block';
        return;
    }

    try {
        await apiPost({ action: 'updatePassword', user: getCurrentUser(), newPass: p1 });
        startSession(getCurrentUser());
    } catch (e) {
        if (!handleAuthError(e)) {
            errEl.textContent = e.message || 'Error al guardar. Intenta nuevamente.';
            errEl.style.display = 'block';
        }
    }
}

function renderUserBadge() {
    const display = document.getElementById('displayUser');
    if (!display) return;
    const user = getCurrentUser();
    const empresa = getCurrentEmpresa();
    const role = getCurrentRole();
    const badgeClass = empresa === EMPRESAS.QALI ? 'badge-qali' : 'badge-acp';
    display.innerHTML = `${user} <span class="session-pill ${badgeClass}">${empresa}</span> <span class="session-pill role-pill">${role}</span>`;
}

function injectSessionStyles() {
    if (document.getElementById('sessionPillStyles')) return;
    const style = document.createElement('style');
    style.id = 'sessionPillStyles';
    style.textContent = `
        .session-pill{display:inline-block;margin-left:8px;padding:3px 8px;border-radius:999px;font-size:.72rem;font-weight:800;vertical-align:middle}
        .badge-acp{background:#dbeafe;color:#1d4ed8}
        .badge-qali{background:#f3e8ff;color:#7c3aed}
        .role-pill{background:#ecfeff;color:#155e75}
    `;
    document.head.appendChild(style);
}

function startSession(user) {
    currentUser = user;
    injectSessionStyles();

    const role = getCurrentRole();
    const empresa = getCurrentEmpresa();
    sessionStorage.setItem('sessionGrifo', user);
    sessionStorage.setItem('rolGrifo', role);
    sessionStorage.setItem('empresaGrifo', empresa);

    if (role === ROLES.READ) {
        window.location.href = 'consumo-flota.html';
        return;
    }

    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('fabVarilla').style.display = 'flex';
    renderUserBadge();

    const canAdmin = role === ROLES.ADMIN || role === ROLES.SUPERADMIN;
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = canAdmin ? 'block' : 'none');

    document.querySelectorAll('.only-admin-grifo').forEach(el => {
        if (canAdmin && (empresa === EMPRESAS.ACP || isSuperAdmin())) {
            el.style.display = 'inline-flex';
        } else {
            el.style.display = 'none';
        }
    });

    const thAcc = document.getElementById('thAccion');
    if (thAcc) thAcc.style.display = canAdmin ? 'table-cell' : 'none';

    cargarDatos().then(() => { renderizarSimuladorBase(); cargarPanelesV3(); });
}

function logout(confirmar = true) {
    if (confirmar && !confirm('¿Cerrar sesión ahora?')) return;
    sessionStorage.clear();
    location.reload();
}
