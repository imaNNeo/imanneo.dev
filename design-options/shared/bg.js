/*
 * Shared background helper for the minimal samples (21 to 30).
 *
 * BG.mount(canvas, options) draws one full-screen fragment shader on the canvas and looks after
 * the boring parts: size, pixel ratio, pointer, pausing when the tab is hidden, and standing
 * still when the system asks for less motion.
 *
 * If WebGL is missing or breaks, mount() returns null and <html> gets the class "nogl",
 * so every page can show a plain CSS background instead.
 *
 * The shader gets these for free:
 *   uRes    size of the drawing in device pixels
 *   uTime   seconds
 *   uMouse  pointer in device pixels, origin bottom left, eased
 *   uHover  0 to 1, how much a pointer is on the page
 *   uScroll page scroll in device pixels
 *   uDpr    device pixels per CSS pixel
 * plus the small noise library in BG.LIB.
 */
(function () {
  "use strict";

  var VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";

  var HEAD = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uHover; uniform float uScroll; uniform float uDpr;"
  ].join("\n");

  var LIB = [
    "float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }",
    "float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }",
    "vec2 hash22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }",
    "float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);",
    "  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), u.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), u.x), u.y); }",
    "float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);",
    "  float a = dot(hash22(i) * 2. - 1., f), b = dot(hash22(i + vec2(1., 0.)) * 2. - 1., f - vec2(1., 0.));",
    "  float c = dot(hash22(i + vec2(0., 1.)) * 2. - 1., f - vec2(0., 1.)), d = dot(hash22(i + vec2(1., 1.)) * 2. - 1., f - vec2(1., 1.));",
    "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * .7 + .5; }",
    "float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.02 + vec2(17.3, 9.1); a *= .5; } return s; }",
    "float gfbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * gnoise(p); p = p * 2.03 + vec2(11.7, 5.3); a *= .5; } return s; }"
  ].join("\n");

  function fail(o, why) {
    document.documentElement.classList.add("nogl");
    if (o && typeof o.onFail === "function") { try { o.onFail(why); } catch (e) {} }
    return null;
  }

  function mount(canvas, o) {
    o = o || {};
    if (!canvas || !canvas.getContext) return fail(o, "no canvas");
    var gl = null, attrs = { antialias: false, alpha: !!o.alpha, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: "low-power" };
    try { gl = canvas.getContext("webgl", attrs) || canvas.getContext("experimental-webgl", attrs); } catch (e) { gl = null; }
    if (!gl) return fail(o, "no webgl");

    var deriv = o.derivatives ? gl.getExtension("OES_standard_derivatives") : null;
    function shader(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { if (window.console && console.warn) console.warn("BG shader: " + gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var src = (deriv ? "#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIV 1\n" : "") + HEAD + "\n" + (o.lib === false ? "" : LIB + "\n") + o.frag;
    var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, src);
    if (!vs || !fs) return fail(o, "compile");
    var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return fail(o, "link");
    gl.useProgram(prog);

    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var locs = {}, texs = {}, units = 0;
    function U(name) { if (!(name in locs)) locs[name] = gl.getUniformLocation(prog, name); return locs[name]; }
    function set(name, v) {
      var l = U(name); if (!l) return;
      if (typeof v === "number") gl.uniform1f(l, v);
      else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
      else if (v.length === 3) gl.uniform3f(l, v[0], v[1], v[2]);
      else if (v.length === 4) gl.uniform4f(l, v[0], v[1], v[2], v[3]);
    }
    function slot(name, opt) {
      var t = texs[name];
      if (!t) {
        t = texs[name] = { tex: gl.createTexture(), unit: units++ };
        gl.activeTexture(gl.TEXTURE0 + t.unit); gl.bindTexture(gl.TEXTURE_2D, t.tex);
        var f = opt && opt.filter === "nearest" ? gl.NEAREST : gl.LINEAR;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        var l = U(name); if (l) gl.uniform1i(l, t.unit);
      } else { gl.activeTexture(gl.TEXTURE0 + t.unit); gl.bindTexture(gl.TEXTURE_2D, t.tex); }
      return t;
    }
    /* A picture: canvas, image or video. The top of the picture is v = 1. */
    function tex(name, source, opt) {
      slot(name, opt);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source); } catch (e) { return false; }
      dirty = true; return true;
    }
    /* Raw bytes, one per cell (0 to 255), row 0 at v = 0. */
    function data(name, w, h, bytes, opt) {
      slot(name, opt || { filter: "nearest" });
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, w, h, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
      dirty = true;
    }

    var still = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) && o.motion !== "always";
    var maxDpr = o.maxDpr || 1.5, scale = o.scale || 1;
    var size = { w: 0, h: 0, dpr: 1, cw: 0, ch: 0 };
    var mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, hover: 0, on: 0, seen: false };
    var dirty = true, dead = false, paused = false, raf = 0, last = 0, t0 = performance.now(), visible = true, time = o.stillTime == null ? 20 : o.stillTime;

    function resize() {
      var cw = canvas.clientWidth || window.innerWidth, ch = canvas.clientHeight || window.innerHeight;
      var dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * scale;
      var w = Math.max(2, Math.round(cw * dpr)), h = Math.max(2, Math.round(ch * dpr));
      if (w === size.w && h === size.h) return false;
      size.w = w; size.h = h; size.dpr = dpr; size.cw = cw; size.ch = ch;
      canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
      dirty = true;
      if (typeof o.onResize === "function") o.onResize(api);
      return true;
    }
    function point(e) {
      var r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) * size.dpr; mouse.ty = (r.height - (e.clientY - r.top)) * size.dpr;
      if (!mouse.seen) { mouse.x = mouse.tx; mouse.y = mouse.ty; mouse.seen = true; }
      mouse.on = 1; dirty = true;
      if (still) kick();
    }
    function leave() { mouse.on = 0; dirty = true; if (still) kick(); }

    function frame(now) {
      raf = 0; if (dead) return;
      var dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
      resize();
      if (!still) time = (now - t0) / 1000 + (o.timeOffset || 0);
      var k = Math.min(1, dt * (o.ease || 9));
      mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
      mouse.hover += (mouse.on - mouse.hover) * Math.min(1, dt * 5);
      if (typeof o.onFrame === "function") o.onFrame(time, dt, api);
      set("uRes", [size.w, size.h]); set("uTime", time); set("uMouse", [mouse.x, mouse.y]); set("uHover", mouse.hover);
      set("uScroll", (window.pageYOffset || 0) * size.dpr); set("uDpr", size.dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      dirty = false;
      if (!still) kick();
      else if (Math.abs(mouse.tx - mouse.x) + Math.abs(mouse.ty - mouse.y) > .5 || Math.abs(mouse.on - mouse.hover) > .01) kick();
    }
    function kick() { if (!raf && !dead && !paused && visible && !document.hidden) raf = requestAnimationFrame(frame); }

    var api = { gl: gl, canvas: canvas, size: size, mouse: mouse, still: still, set: set, tex: tex, data: data, draw: kick,
      pause: function (p) { paused = !!p; if (!paused) { last = performance.now(); kick(); } },
      stop: function () { dead = true; if (raf) cancelAnimationFrame(raf); } };

    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); api.stop(); fail(o, "lost"); });
    window.addEventListener("resize", function () { dirty = true; kick(); });
    window.addEventListener("pointermove", point, { passive: true });
    window.addEventListener("pointerdown", point, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    window.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") leave(); }, { passive: true });
    window.addEventListener("pointercancel", leave, { passive: true });
    if (still) window.addEventListener("scroll", function () { kick(); }, { passive: true });
    document.addEventListener("visibilitychange", function () { if (!document.hidden) { last = performance.now(); kick(); } });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; if (visible) { last = performance.now(); kick(); } }).observe(canvas);
    }

    resize();
    if (o.uniforms) for (var n in o.uniforms) set(n, o.uniforms[n]);
    last = performance.now(); kick();
    document.documentElement.classList.add("gl");
    return api;
  }

  /* A grid of glyphs, white on black, for shaders that draw with characters. */
  function atlas(chars, opt) {
    opt = opt || {};
    var list = Array.from ? Array.from(chars) : chars.split("");
    var cw = opt.cw || opt.cell || 48, ch = opt.ch || opt.cell || 48, cols = opt.cols || 8, rows = Math.ceil(list.length / cols);
    var c = document.createElement("canvas"); c.width = cols * cw; c.height = rows * ch;
    var x = c.getContext("2d");
    x.fillStyle = "#000"; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = (opt.weight || 500) + " " + Math.round(Math.min(cw * 1.25, ch) * (opt.size || .74)) + "px " + (opt.font || 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace');
    for (var i = 0; i < list.length; i++) x.fillText(list[i], (i % cols + .5) * cw, (Math.floor(i / cols) + .54) * ch);
    return { canvas: c, cols: cols, rows: rows, n: list.length, chars: list };
  }

  /* "#0369ad" to [r, g, b] in 0 to 1, for colour uniforms. */
  function rgb(hex) {
    var h = hex.replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }

  window.BG = { mount: mount, atlas: atlas, rgb: rgb, LIB: LIB };
})();
