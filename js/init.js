/* ============================================================
   INIT
============================================================ */
window.addEventListener('load', () => {
    const sess = sessionStorage.getItem('sessionGrifo');
    if (sess && sessionStorage.getItem('rolGrifo')) startSession(sess);
});

setInterval(() => {
    if (currentUser) cargarDatos();
}, 60000);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
    }
});
