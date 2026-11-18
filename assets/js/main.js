/*
 * imanneo.dev: the email button, a little film grain, and the moving background.
 * Without this file the page still reads the same. It adds the motion and the button that shows the email address.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- The email address ----------
   * The page does not contain the address as text, so that robots that collect addresses for spam do not
   * find it. It sits in data-mail on the line with id "mail", written backwards and base64-encoded.
   * The button on that line is hidden until this script runs. Its first press shows the address, as a link
   * that opens the mail app. Every press after that copies it: the label says "Copied" for a moment, and the
   * line with id "said" tells a screen reader what happened. If the clipboard is closed, the address is
   * selected instead, ready to copy by hand.
   */
  var said = $("said"), box = $("mail"), btn = $("mail-b");
  if (box && btn) {
    var label = btn.querySelector("[data-t]") || btn, link = null, timer = 0;
    var tell = function (msg) { if (said) said.textContent = msg; };
    var flash = function (msg, told) {
      label.textContent = msg; btn.classList.add("did"); tell(told || msg);
      clearTimeout(timer);
      timer = setTimeout(function () { label.textContent = "Copy"; btn.classList.remove("did"); tell(""); }, 1800);
    };
    var select = function () {
      if (window.getSelection && document.createRange) {
        var r = document.createRange(); r.selectNodeContents(link);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        flash("Selected", "The address is selected, ready to copy.");
      } else flash("Copy it by hand");
    };
    btn.hidden = false;
    btn.addEventListener("click", function () {
      var address = "";
      try { address = atob(box.getAttribute("data-mail")).split("").reverse().join(""); } catch (e) {}
      if (!address) return;
      if (!link) {
        link = document.createElement("a");
        link.className = "mail-a"; link.id = "mail-a"; link.href = "mailto:" + address; link.textContent = address;
        box.insertBefore(link, btn);
        label.textContent = "Copy";
        Array.prototype.forEach.call(btn.querySelectorAll("[data-on]"), function (n) { n.hidden = n.getAttribute("data-on") !== "shown"; });
        tell("The email address is shown: " + address);
        return;
      }
      try { navigator.clipboard.writeText(address).then(function () { flash("Copied", "The email address is copied."); }, select); } catch (e) { select(); }
    });
  }

  /* ---------- Grain ----------
   * A little film grain over the colour, drawn once.
   */
  try {
    var c = document.createElement("canvas"); c.width = c.height = 160;
    var x = c.getContext("2d"), im = x.createImageData(160, 160);
    for (var i = 0; i < im.data.length; i += 4) { var v = 96 + Math.floor(Math.random() * 64); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0);
    $("grain").style.backgroundImage = "url(" + c.toDataURL("image/png") + ")";
  } catch (e) {}

  /* ---------- Background ----------
   * One full-screen fragment shader on the canvas. It looks after size, the pointer, pausing when the tab
   * is hidden, and standing still when the system asks for less motion. It also watches its own speed:
   * a device that cannot keep up gets a smaller drawing first, and one still picture if that is not enough.
   * If WebGL is missing, breaks, or could only be drawn in software, the canvas is hidden and the still
   * colours in the CSS stay.
   */
  var canvas = $("bg");
  if (!canvas) return;

  var VERT = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
  var HEAD = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uHover;"
  ].join("\n");
  /* Smooth noise, and four layers of it. */
  var NOISE = [
    "vec2 hash22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }",
    "float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.);",
    "  float a = dot(hash22(i) * 2. - 1., f), b = dot(hash22(i + vec2(1., 0.)) * 2. - 1., f - vec2(1., 0.));",
    "  float c = dot(hash22(i + vec2(0., 1.)) * 2. - 1., f - vec2(0., 1.)), d = dot(hash22(i + vec2(1., 1.)) * 2. - 1., f - vec2(1., 1.));",
    "  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * .7 + .5; }",
    "float gfbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a * gnoise(p); p = p * 2.03 + vec2(11.7, 5.3); a *= .5; } return s; }"
  ].join("\n");
  /* A slow flow of colour: noise bent by noise, in the blue and green of the logo. */
  var AURORA = [
    "uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uBg; uniform float uAmt;",
    "void main(){",
    "  vec2 uv = gl_FragCoord.xy / uRes.y, m = uMouse / uRes.y;",
    "  float t = uTime * .045, md = distance(uv, m);",
    "  uv += (uv - m) * .3 * exp(-md * md * 5.) * uHover;",
    "  vec2 q = vec2(gfbm(uv * 1.05 + vec2(0., t)), gfbm(uv * 1.05 + vec2(5.2, 1.3 - t)));",
    "  vec2 r = vec2(gfbm(uv * 1.2 + q * 2. + vec2(1.7, 9.2) + t * .6), gfbm(uv * 1.2 + q * 2. + vec2(8.3, 2.8) - t * .5));",
    "  float f = gfbm(uv * 1.1 + r * 1.7);",
    "  vec3 col = mix(uA, uB, smoothstep(.34, .64, r.y));",
    "  col = mix(col, uC, smoothstep(.44, .7, q.x) * .7);",
    "  float fall = smoothstep(-.25, .95, gl_FragCoord.y / uRes.y + (gl_FragCoord.x / uRes.x - .5) * .55);",
    "  float a = smoothstep(.36, .6, f) * mix(.3, 1., fall) * uAmt + .1 * exp(-md * md * 9.) * uHover;",
    "  gl_FragColor = vec4(mix(uBg, col, clamp(a, 0., 1.)), 1.);",
    "}"
  ].join("\n");

  function noGl() { root.classList.remove("gl"); root.classList.add("nogl"); }

  var gl = null;
  try {
    /* failIfMajorPerformanceCaveat: no context where the browser has no graphics chip to draw with, because that is slow. */
    var attrs = { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power", failIfMajorPerformanceCaveat: true };
    gl = canvas.getContext("webgl", attrs) || canvas.getContext("experimental-webgl", attrs);
  } catch (e) { gl = null; }
  if (!gl) { noGl(); return; }
  /* Some browsers hand out a context that draws in software all the same. Its name gives it away. */
  try {
    var info = gl.getExtension("WEBGL_debug_renderer_info");
    var chip = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    if (/swiftshader|llvmpipe|software|basic render/i.test(chip)) { noGl(); return; }
  } catch (e) {}

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, HEAD + "\n" + NOISE + "\n" + AURORA);
  if (!vs || !fs) { noGl(); return; }
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { noGl(); return; }
  gl.useProgram(prog);

  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var locs = {};
  function set(name, v) {
    if (!(name in locs)) locs[name] = gl.getUniformLocation(prog, name);
    var l = locs[name]; if (!l) return;
    if (typeof v === "number") gl.uniform1f(l, v);
    else if (v.length === 2) gl.uniform2f(l, v[0], v[1]);
    else gl.uniform3f(l, v[0], v[1], v[2]);
  }
  /* "#0369ad" to [r, g, b] in 0 to 1. */
  function rgb(hex) {
    var h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }

  var mq = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var still = mq("(prefers-reduced-motion: reduce)").matches;
  var darkMq = mq("(prefers-color-scheme: dark)"), isDark = false;
  /* The drawing is half the size of the screen: the colours are soft, so nobody sees it, and it is four times cheaper. */
  var scale = .5, STILL_TIME = 31;
  /* The flow is slow, so thirty pictures a second look the same as sixty and cost half. */
  var GAP = 30;
  var size = { w: 0, h: 0, ch: 0, dpr: 1 }, stale = true;
  var mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4, hover: 0, on: 0, seen: false };
  var dead = false, raf = 0, last = 0, t0 = performance.now(), visible = true, time = STILL_TIME;
  /* For noticing a device that cannot keep up: pictures drawn, and the time they took, since the last look. */
  var drawn = 0, count = 0, spent = 0, tired = false;

  function resize() {
    stale = false;
    var cw = canvas.clientWidth || window.innerWidth, ch = canvas.clientHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1) * scale;
    var w = Math.max(2, Math.round(cw * dpr)), h = Math.max(2, Math.round(ch * dpr));
    size.ch = ch;
    if (w === size.w && h === size.h) return;
    size.w = w; size.h = h; size.dpr = dpr;
    canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
  }
  /* A still picture is only drawn again when something asks for it. A tired device is left alone. */
  function nudge() { if (still && !tired) kick(); }
  function point(e) {
    /* The canvas covers the window, so the pointer needs no measuring of the page. */
    mouse.tx = e.clientX * size.dpr; mouse.ty = (size.ch - e.clientY) * size.dpr;
    if (!mouse.seen) { mouse.x = mouse.tx; mouse.y = mouse.ty; mouse.seen = true; }
    mouse.on = 1;
    nudge();
  }
  function leave() { mouse.on = 0; nudge(); }

  /* Called after every 30 pictures. Under about 18 a second counts as too slow. */
  function pace() {
    if (spent / count > 55) {
      if (scale > .3) { scale = .25; stale = true; mouse.seen = false; mouse.on = 0; }
      else { still = true; tired = true; }
    }
    count = 0; spent = 0;
  }

  function frame(now) {
    raf = 0; if (dead) return;
    var gap = now - last;
    /* The very first picture is drawn at once, so the canvas never shows empty. */
    if (!still && drawn && gap < GAP) { kick(); return; }
    var dt = Math.min(.05, Math.max(0, gap) / 1000 || .016); last = now;
    if (stale) resize();
    drawn++;
    if (!still) {
      time = (now - t0) / 1000;
      /* The first second of a page is busy with other things, and a long gap is a pause, not a slow picture. */
      if (drawn > 30 && gap < 500) { count++; spent += gap; if (count === 30) pace(); }
    }
    var k = Math.min(1, dt * 9);
    mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
    mouse.hover += (mouse.on - mouse.hover) * Math.min(1, dt * 5);
    /* The colour calms down as the page scrolls, so the cards stay easy to read. */
    var s = Math.min(1, (window.pageYOffset || 0) / (window.innerHeight * .9));
    set("uAmt", (isDark ? .8 : .95) * (1 - .4 * s));
    set("uRes", [size.w, size.h]); set("uTime", time); set("uMouse", [mouse.x, mouse.y]); set("uHover", mouse.hover);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still) kick();
    else if (!tired && (Math.abs(mouse.tx - mouse.x) + Math.abs(mouse.ty - mouse.y) > .5 || Math.abs(mouse.on - mouse.hover) > .01)) kick();
  }
  function kick() { if (!raf && !dead && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  /* Dark when the page is told so (data-theme on the root element), otherwise when the device is. */
  function paint() {
    var a = root.getAttribute("data-theme");
    isDark = a === "dark" || (a !== "light" && darkMq.matches);
    set("uBg", rgb(isDark ? "#06080c" : "#f6f8fb"));
    set("uA", rgb(isDark ? "#0f55c4" : "#8fc4ff"));
    set("uB", rgb(isDark ? "#0b9a5e" : "#8be8bd"));
    set("uC", rgb(isDark ? "#2a1f8f" : "#c3b9ff"));
    kick();
  }

  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); dead = true; if (raf) cancelAnimationFrame(raf); noGl(); });
  window.addEventListener("resize", function () { stale = true; kick(); });
  window.addEventListener("pointermove", point, { passive: true });
  window.addEventListener("pointerdown", point, { passive: true });
  document.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  window.addEventListener("pointerup", function (e) { if (e.pointerType !== "mouse") leave(); }, { passive: true });
  window.addEventListener("pointercancel", leave, { passive: true });
  window.addEventListener("scroll", nudge, { passive: true });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) { last = performance.now(); kick(); } });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { visible = es[es.length - 1].isIntersecting; if (visible) { last = performance.now(); kick(); } }).observe(canvas);
  }
  if (darkMq.addEventListener) darkMq.addEventListener("change", paint); else if (darkMq.addListener) darkMq.addListener(paint);
  if ("MutationObserver" in window) new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  resize();
  last = performance.now();
  paint();
  root.classList.add("gl");

})();
