/* ============================================================
   INIT
============================================================ */
window.addEventListener('load', () => {
    const sess = sessionStorage.getItem('sessionGrifo');
    const role = sessionStorage.getItem('rolGrifo');
    const token = sessionStorage.getItem('tokenGrifo');
    if (sess && role && token && !isSessionExpired()) {
        startSession(sess);
    } else {
        sessionStorage.clear();
    }
});

setInterval(() => {
    if (currentUser && !isSessionExpired()) cargarDatos();
}, 60000);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
});
