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
