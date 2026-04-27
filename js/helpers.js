/* ============================================================
   HELPERS
============================================================ */
function parseFechaBase(str) {
    if (!str) return null;
    if (str instanceof Date) return isNaN(str) ? null : str;
    const s = str.toString().split(' ')[0].split(',')[0].trim();
    const p = s.split(/[/-]/);
    if (p.length === 3) {
        const [a,b,c] = p.map(Number);
        return p[0].length === 4 ? new Date(a, b-1, c) : new Date(c, b-1, a);
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}
