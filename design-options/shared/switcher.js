/*
 * Preview-only helper: a small pill to flip between the ten options.
 * Not part of any design. It is removed when one option becomes the real site.
 * data-n="3" on the script tag says which option the page is.
 * Position: data-pos="br" (default) | "bl" | "tr" | "tl" | "bc" on the script tag.
 * data-lift="84" raises it by that many pixels on small screens, to clear a bottom bar.
 */
(function () {
  var opts = window.OPTIONS || [];
  if (!opts.length) return;
  var script = document.currentScript;
  var pos = (script && script.getAttribute("data-pos")) || "br";
  /* Which option is this? The page says so with data-n; the address is only the fallback. */
  var idx = -1, said = parseInt((script && script.getAttribute("data-n")) || "", 10);
  for (var i = 0; i < opts.length; i++) if (opts[i].n === said) idx = i;
  if (idx < 0) {
    var here = location.pathname.replace(/index\.html$/, "");
    for (var j = 0; j < opts.length; j++) if (here.indexOf("/" + opts[j].slug + "/") !== -1) idx = j;
  }
  if (idx < 0) return;
  var cur = opts[idx], prev = opts[(idx + opts.length - 1) % opts.length], next = opts[(idx + 1) % opts.length];

  var host = document.createElement("div");
  host.id = "opt-switcher";
  host.style.cssText = "position:fixed;z-index:2147483000;" +
    (pos.charAt(0) === "t" ? "top:calc(12px + env(safe-area-inset-top,0px));" : "bottom:calc(12px + env(safe-area-inset-bottom,0px));") +
    (pos.charAt(1) === "l" ? "left:12px;" : pos.charAt(1) === "c" ? "left:50%;transform:translateX(-50%);" : "right:12px;");
  var lift = parseInt((script && script.getAttribute("data-lift")) || "0", 10);
  if (lift && pos.charAt(0) === "b" && window.matchMedia) {
    var mq = window.matchMedia("(max-width:900px)");
    var place = function () { host.style.bottom = "calc(" + (12 + (mq.matches ? lift : 0)) + "px + env(safe-area-inset-bottom,0px))"; };
    place(); if (mq.addEventListener) mq.addEventListener("change", place);
  }
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  root.innerHTML =
    '<style>' +
    ':host{all:initial}' +
    '.bar{display:flex;align-items:center;gap:2px;padding:4px;border-radius:999px;background:rgba(18,18,22,.92);' +
    'color:#fff;font:500 12px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.14);' +
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}' +
    'a,button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;height:32px;min-width:32px;padding:0 8px;border-radius:999px;color:#fff}' +
    'a:hover,button:hover{background:rgba(255,255,255,.16)}' +
    'a:focus-visible,button:focus-visible{outline:2px solid #7cc4ff;outline-offset:1px}' +
    '.name{padding:0 10px;white-space:nowrap;max-width:44vw;overflow:hidden;text-overflow:ellipsis;display:block;line-height:32px}' +
    '.num{opacity:.6;margin-right:6px;font-variant-numeric:tabular-nums}' +
    '.sep{width:1px;height:16px;background:rgba(255,255,255,.2);margin:0 2px}' +
    '.min .full{display:none}' +
    '@media (max-width:520px){.name{max-width:36vw}}' +
    '</style>' +
    '<div class="bar" id="bar">' +
    '<a class="full" href="../' + prev.slug + '/index.html" title="Previous: ' + prev.name + '" aria-label="Previous option">&#8249;</a>' +
    '<a class="full name" href="../index.html" title="Back to all ten options"><span class="num">' + pad(cur.n) + '/' + pad(opts.length) + '</span>' + cur.name + '</a>' +
    '<a class="full" href="../' + next.slug + '/index.html" title="Next: ' + next.name + '" aria-label="Next option">&#8250;</a>' +
    '<span class="sep full"></span>' +
    '<button id="tg" title="Hide or show this switcher" aria-label="Hide or show the option switcher">&#9776;</button>' +
    '</div>';
  var bar = root.getElementById ? root.getElementById("bar") : host.querySelector("#bar");
  var tg = root.getElementById ? root.getElementById("tg") : host.querySelector("#tg");
  tg.addEventListener("click", function () { bar.classList.toggle("min"); });
  (document.body || document.documentElement).appendChild(host);
})();
