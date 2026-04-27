/* ============================================================
   AUTENTICACIÓN
============================================================ */
async function handleLogin() {
    const user = (document.getElementById('userInput').value || '').trim().toUpperCase();
    const pass = (document.getElementById('passInput').value || '').trim();
    const errEl = document.getElementById('loginError');
    errEl.style.display = 'none';

    if (!user || !pass) { showLoginError('Completa usuario y contraseña.'); return; }

    const btn = document.getElementById('btnLogin');
    btn.textContent = 'Verificando…'; btn.disabled = true;

    try {
        const resp = await fetch(`${WEB_APP_URL}?action=login&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`);
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const res = await resp.json();

        if (res.auth === 'OK') {
            currentUser = (res.user || user).toString().toUpperCase();
            sessionStorage.setItem('sessionGrifo', currentUser);
            sessionStorage.setItem('rolGrifo', res.role || 'READ');
            sessionStorage.setItem('empresaGrifo', (res.empresa || EMPRESAS.ACPAGRO).toUpperCase());

            if (res.forceChange) {
                document.getElementById('loginForm').style.display = 'none';
                document.getElementById('changePassForm').style.display = 'block';
            } else {
                startSession(currentUser);
            }
        } else {
            showLoginError(res.msg || 'Credenciales incorrectas.');
        }
    } catch (e) {
        showLoginError('Error de conexión. Intenta nuevamente.');
    } finally {
        btn.textContent = 'Ingresar →'; btn.disabled = false;
    }
}

function showLoginError(msg) {
    const el = document.getElementById('loginError');
    el.textContent = msg; el.style.display = 'block';
}

async function saveNewPassword() {
    const p1   = document.getElementById('newPassInput').value;
    const p2   = document.getElementById('confirmPassInput').value;
    const errEl = document.getElementById('passError');
    errEl.style.display = 'none';

    if (p1 !== p2) { errEl.textContent = 'Las claves no coinciden.'; errEl.style.display = 'block'; return; }
    if (!/^(?=.*[A-Z])(?=.*\d).+$/.test(p1)) { errEl.textContent = 'Incluye al menos 1 mayúscula y 1 número.'; errEl.style.display = 'block'; return; }

    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            body: JSON.stringify(withEmpresa({ action: 'updatePassword', user: getCurrentUser(), newPass: p1 }))
        });
        startSession(getCurrentUser());
    } catch(e) {
        errEl.textContent = 'Error al guardar. Intenta nuevamente.'; errEl.style.display = 'block';
    }
}

function startSession(user) {
    currentUser = user;
    const role = getCurrentRole();
    const empresa = getCurrentEmpresa();
    sessionStorage.setItem('sessionGrifo', user);
    sessionStorage.setItem('rolGrifo', role);
    sessionStorage.setItem('empresaGrifo', empresa);

    if (role === 'READ') {
        window.location.href = 'consumo-flota.html';
        return;
    }

    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('fabVarilla').style.display = 'flex';
    document.getElementById('displayUser').textContent = `${user} - ${empresa}`;

    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');

    document.querySelectorAll('.only-admin-grifo').forEach(el => {
        if (empresa === EMPRESAS.ACPAGRO && (user === 'ERAFAEL' || user === 'CVILLANUEVA')) {
            el.style.display = 'inline-flex';
        } else {
            el.style.display = 'none';
        }
    });

    const thAcc = document.getElementById('thAccion');
    if (thAcc) thAcc.style.display = 'table-cell';

    cargarDatos().then(() => {
        renderizarSimuladorBase();
    });
}

function logout() {
    sessionStorage.clear();
    location.reload();
}
