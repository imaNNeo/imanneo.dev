/*
 * Small helpers shared by samples 21 to 40.
 * Nothing here draws a design: it only copies text, reveals things on scroll and decodes a line of text.
 */
(function () {
  "use strict";
  var mm = function (q) { return !!(window.matchMedia && window.matchMedia(q).matches); };

  var KIT = {
    /* True when the system asks for less motion. */
    still: mm("(prefers-reduced-motion: reduce)"),
    /* True for a mouse or trackpad, false for touch. */
    fine: mm("(hover: hover) and (pointer: fine)"),

    esc: function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); },
    icon: function (name) { return (window.ICONS && window.ICONS[name]) || ""; },
    /* "https://www.site.com/a/" to "site.com/a" */
    bare: function (u) { return String(u).replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); },
    /* 2349795 to "2.3M", 7600 to "7.6k" */
    short: function (n) { return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M" : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k" : String(n); },

    /*
     * Copy text when a button is pressed. The label (the element marked data-t, or the button itself)
     * says "Copied" for a moment. If the clipboard is closed, the text in `node` gets selected instead.
     */
    copy: function (btn, text, node) {
      var label = btn.querySelector("[data-t]") || btn;
      if (!btn.hasAttribute("data-was")) btn.setAttribute("data-was", label.textContent);
      function show(msg) {
        label.textContent = msg; btn.classList.add("did");
        clearTimeout(btn._t);
        btn._t = setTimeout(function () { label.textContent = btn.getAttribute("data-was"); btn.classList.remove("did"); }, 1800);
      }
      function select() {
        if (node && window.getSelection && document.createRange) {
          var r = document.createRange(); r.selectNodeContents(node);
          var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
          show("Selected");
        } else show("Copy it by hand");
      }
      try { navigator.clipboard.writeText(text).then(function () { show("Copied"); }, select); } catch (e) { select(); }
    },
    /* Wire every [data-copy] button on the page: data-copy holds the text, data-from the id of the node to select as a fallback. */
    copies: function (root) {
      Array.prototype.forEach.call((root || document).querySelectorAll("[data-copy]"), function (b) {
        b.addEventListener("click", function () { KIT.copy(b, b.getAttribute("data-copy"), b.getAttribute("data-from") ? document.getElementById(b.getAttribute("data-from")) : null); });
      });
    },

    /*
     * Reveal on scroll. Elements matching `sel` get the class "in" when they come into view.
     * Without motion, or without IntersectionObserver, nothing is hidden in the first place:
     * the page only hides things under html.rv-on, which this function sets.
     */
    reveal: function (sel) {
      var els = document.querySelectorAll(sel);
      if (KIT.still || !("IntersectionObserver" in window) || !els.length) return;
      document.documentElement.classList.add("rv-on");
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -6% 0px", threshold: .04 });
      Array.prototype.forEach.call(els, function (el) { io.observe(el); });
      /* Safety net: never leave anything hidden for long. */
      setTimeout(function () { Array.prototype.forEach.call(els, function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add("in"); }); }, 1200);
    },

    /* Decode a short line of text from random glyphs to what it says. Best on monospaced text. */
    decode: function (el, opt) {
      opt = opt || {};
      var final = el.getAttribute("data-text") || el.textContent, chars = opt.chars || "01<>/\\[]{}=+*#%&?", dur = opt.dur || 900, t0 = 0;
      el.setAttribute("data-text", final); el.setAttribute("aria-label", final);
      if (KIT.still) { el.textContent = final; return; }
      function step(now) {
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / dur), n = Math.floor(p * final.length), out = final.slice(0, n);
        for (var i = n; i < final.length; i++) out += final.charAt(i) === " " ? " " : chars.charAt(Math.floor(Math.random() * chars.length));
        el.textContent = out;
        if (p < 1) requestAnimationFrame(step); else el.textContent = final;
      }
      requestAnimationFrame(step);
    }
  };

  /*
   * Plain building blocks for the sections every minimal sample shares. They only return markup
   * with class names; each page styles them in its own way.
   */
  var S = window.SITE || {}, ext = ' target="_blank" rel="noopener"';
  KIT.html = {
    /* Social links. The email entry is a button that copies the address, because mail links do not work everywhere. */
    links: function (o) {
      o = o || {};
      return (S.socials || []).filter(function (s) { return !o.skip || o.skip.indexOf(s.id) < 0; }).map(function (s) {
        var inner = '<span class="soc-i">' + KIT.icon(s.id) + '</span><span class="soc-l">' + KIT.esc(s.label) + '</span><span class="soc-h">' + KIT.esc(s.handle) + '</span><span class="soc-n">' + KIT.esc(s.note) + "</span>";
        if (s.id === "mail") return '<li><button type="button" class="soc-a soc-mail" data-copy="' + KIT.esc(S.me.email) + '" aria-label="Copy the email address ' + KIT.esc(S.me.email) + '">' + inner + '<span class="soc-e" data-t>Copy</span></button></li>';
        return '<li><a class="soc-a soc-' + s.id + '" href="' + s.url + '"' + ext + ">" + inner + '<span class="soc-e">' + KIT.icon("out") + "</span></a></li>";
      }).join("");
    },
    /* What he works on: five short lines. */
    focus: function () {
      return (S.me.focus || []).map(function (f, i) { return '<li><span class="fo-n">' + (i < 9 ? "0" : "") + (i + 1) + '</span><b class="fo-t">' + KIT.esc(f.t) + '</b><span class="fo-d">' + KIT.esc(f.d) + "</span></li>"; }).join("");
    },
    chips: function (list) { return (list || []).map(function (t) { return "<li>" + KIT.esc(t) + "</li>"; }).join(""); },
    /* fl_chart: name, tagline, three or four numbers and its links. */
    fl: function (o) {
      o = o || {};
      var f = S.fl, nums = [[f.starsLabel, "GitHub stars"], [f.downloadsLabel, "downloads a month"], [String(f.releases), "releases since " + f.since]];
      if (o.likes) nums.splice(2, 0, [f.likesLabel, "likes on pub.dev"]);
      return '<div class="fl-h"><img class="fl-logo" src="../shared/img/fl_chart.png" alt="" width="44" height="44"><div><h3 class="fl-n">' + f.name + '</h3><p class="fl-t">' + KIT.esc(f.tagline) + "</p></div></div>" +
        '<dl class="fl-nums">' + nums.map(function (n) { return "<div><dt>" + n[1] + "</dt><dd>" + n[0] + "</dd></div>"; }).join("") + "</dl>" +
        '<ul class="fl-links">' + [["GitHub", f.repo], ["pub.dev", f.pub], ["Docs", f.docs], ["Live demo", f.demo]].map(function (l) { return '<li><a href="' + l[1] + '"' + ext + ">" + l[0] + KIT.icon("out") + "</a></li>"; }).join("") + "</ul>";
    },
    /* The blog and the channel. */
    more: function () {
      return [["blog", "Flutter 4 Fun", "A blog where I solve UI challenges in Flutter.", "flutter4fun.com", S.links.blog], ["youtube", "YouTube", "Videos about Flutter and game development.", "@imaNNeO", S.links.youtube]].map(function (m) {
        return '<li><a class="more-a" href="' + m[4] + '"' + ext + '><span class="more-i">' + KIT.icon(m[0]) + '</span><b class="more-t">' + m[1] + '</b><span class="more-d">' + m[2] + '</span><span class="more-h">' + m[3] + KIT.icon("out") + "</span></a></li>";
      }).join("");
    },
    /* The four main games, with their covers. */
    games: function () {
      return S.games.filter(function (g) { return g.featured; }).map(function (g) {
        return '<li><a class="game" href="' + S.gameUrl(g.id) + '"' + ext + '><img class="g-img" src="' + S.gameImg(g.id) + '" alt="" width="320" height="320" loading="lazy"><span class="g-t">' + KIT.esc(g.title) + '</span><span class="g-tag">' + KIT.esc(g.tag) + '</span><span class="g-b">' + KIT.esc(g.blurb) + "</span></a></li>";
      }).join("");
    },
    /* The small browser games: cover and name. */
    small: function () {
      return S.games.filter(function (g) { return !g.featured; }).map(function (g) {
        return '<li><a class="sg" href="' + S.gameUrl(g.id) + '"' + ext + ' title="' + KIT.esc(g.blurb) + '"><img src="' + S.gameImg(g.id) + '" alt="" width="320" height="320" loading="lazy"><span>' + KIT.esc(g.title) + "</span></a></li>";
      }).join("");
    },
    /* The email address as text, with a copy button next to it. */
    mail: function (id) {
      id = id || "mail-a";
      return '<span class="mail-a" id="' + id + '">' + KIT.esc(S.me.email) + '</span><button type="button" class="mail-b" data-copy="' + KIT.esc(S.me.email) + '" data-from="' + id + '">' + KIT.icon("copy") + "<span data-t>Copy</span></button>";
    }
  };
  /* A wide thumbnail made from a square game cover: the cover sits on a blurred copy of itself. The page styles .th, .th-b and .th-c. */
  KIT.html.thumb = function (id) {
    var u = S.gameImg(id);
    return '<span class="th"><img class="th-b" src="' + u + '" alt="" loading="lazy"><img class="th-c" src="' + u + '" alt="" width="320" height="320" loading="lazy"></span>';
  };
  /*
   * A picture for fl_chart where a template wants a project image: its releases per year as bars, drawn from the data.
   * 320 by 200. The page colours it through CSS: .fa-bg, .fa-t, .fa-s, .fa-ax, .fa-bar, .fa-l.
   */
  KIT.html.art = function () {
    var py = S.fl.perYear, max = 0, i, x0 = 30, x1 = 290, y0 = 158, top = 78, out = "";
    for (i = 0; i < py.length; i++) max = Math.max(max, py[i][1]);
    var step = (x1 - x0) / py.length, bw = 18, r = 4;
    for (i = 0; i < py.length; i++) {
      var h = Math.max(3, (y0 - top) * py[i][1] / max), x = x0 + step * i + (step - bw) / 2, y = y0 - h, rr = Math.min(r, h);
      out += '<path class="fa-bar" fill="#2a7de1" d="M' + x.toFixed(1) + " " + y0 + "V" + (y + rr).toFixed(1) + "q0 -" + rr + " " + rr + " -" + rr + "h" + (bw - 2 * rr) + "q" + rr + " 0 " + rr + " " + rr + "V" + y0 + 'Z"/>' +
        '<text class="fa-s" fill="#6b7785" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y0 + 15) + '" text-anchor="middle" font-size="9.5">\u2019' + String(py[i][0]).slice(2) + "</text>";
      if (i === 0 || i === py.length - 1) out += '<text class="fa-l" fill="#1c2530" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle" font-size="10.5" font-weight="700">' + py[i][1] + "</text>";
    }
    return '<svg class="fl-art" viewBox="0 0 320 200" role="img" aria-label="fl_chart releases per year, from ' + py[0][1] + " in " + py[0][0] + " to " + py[py.length - 1][1] + " in " + py[py.length - 1][0] + '">' +
      '<rect class="fa-bg" width="320" height="200" fill="#f4f6f9"/>' +
      '<image href="../shared/img/fl_chart.png" x="30" y="22" width="30" height="30"/>' +
      '<text class="fa-t" fill="#1c2530" x="70" y="36" font-size="15" font-weight="700">fl_chart</text>' +
      '<text class="fa-s" fill="#6b7785" x="70" y="50" font-size="9.5">Releases per year</text>' +
      '<path class="fa-ax" stroke="#c6ced8" stroke-width="1" d="M' + x0 + " " + (y0 + .5) + "H" + x1 + '"/>' + out + "</svg>";
  };

  /*
   * A light and dark switch, for the samples whose template has one. Without a choice the page follows the system.
   * The button gets data-now ("light" or "dark") so the page can show the right icon; the choice is kept under `key`.
   */
  KIT.theme = function (btn, key, done) {
    var root = document.documentElement, mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    function now() { var a = root.getAttribute("data-theme"); return a === "dark" || a === "light" ? a : (mq && mq.matches ? "dark" : "light"); }
    function paint() {
      var t = now();
      btn.setAttribute("data-now", t);
      btn.setAttribute("aria-label", t === "dark" ? "Switch to the light theme" : "Switch to the dark theme");
      if (done) done(t);
    }
    btn.addEventListener("click", function () {
      var t = now() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", t);
      try { localStorage.setItem(key, t); } catch (e) {}
      paint();
    });
    if (mq) { try { mq.addEventListener("change", paint); } catch (e) { try { mq.addListener(paint); } catch (e2) {} } }
    paint();
    return { now: now };
  };

  /* Fill every element that carries data-fill="name" with KIT.html[name](). */
  KIT.fill = function (root) {
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-fill]"), function (el) {
      var fn = KIT.html[el.getAttribute("data-fill")];
      if (fn) el.innerHTML = fn(el.hasAttribute("data-likes") ? { likes: true } : null);
    });
    Array.prototype.forEach.call((root || document).querySelectorAll("[data-say]"), function (el) {
      var path = el.getAttribute("data-say").split("."), v = S;
      for (var i = 0; i < path.length && v != null; i++) v = v[path[i]];
      if (v != null) el.textContent = v;
    });
    KIT.copies(root);
  };

  window.KIT = KIT;
})();
