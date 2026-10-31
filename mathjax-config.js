// MathJax configuration — must load before lib/tex-svg-full.js.
// Kept in a separate file so the CSP does not need 'unsafe-inline' for scripts.
window.MathJax = {
    tex: {
        // braket: Dirac notation. Without 'noundefined', an unknown macro like \foo
        // raises an error we can show to the user, instead of being drawn in red
        // inside the PNG.
        packages: { '[+]': ['braket'], '[-]': ['noundefined'] }
    },
    svg: { fontCache: 'none' },          // self-contained SVGs (no shared glyph cache)
    startup: { typeset: false }          // we only call tex2svgPromise() on demand
};
