/* ALDERPEAK — shared interactions. Vanilla JS, no dependencies.
   Content is fully visible without this file; it only adds enhancement. */
(function(){
  "use strict";
  var root = document.querySelector(".ap");
  if(!root) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("ap-js");
  var $ = function(s,c){return (c||root).querySelector(s)};
  var $$ = function(s,c){return Array.prototype.slice.call((c||root).querySelectorAll(s))};

  /* Broken image fallback: keep the branded frame instead of a broken icon */
  $$(".ap-frame img,.ap-hero-media img").forEach(function(img){
    var fail=function(){img.closest(".ap-frame,.ap-hero-media").classList.add("is-broken")};
    if(img.complete && img.naturalWidth===0 && img.src) fail(); else img.addEventListener("error",fail);
  });

  /* Header: transparent over hero, solid after scrolling */
  var header = $(".ap-header");
  if(header){
    var solidAlways = header.hasAttribute("data-solid");
    var onScroll = function(){ header.classList.toggle("is-solid", solidAlways || window.scrollY > 40) };
    onScroll(); window.addEventListener("scroll", onScroll, {passive:true});
  }

  /* Mobile drawer */
  var burger = $(".ap-burger"), drawer = $(".ap-drawer");
  if(burger && drawer){
    var setOpen = function(open){
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      drawer.classList.toggle("is-open", open);
      drawer.setAttribute("aria-hidden", String(!open));
      root.classList.toggle("ap-noscroll", open);
      document.documentElement.style.overflow = open ? "hidden" : "";
      if(open){ var f = drawer.querySelector("a"); f && f.focus(); }
    };
    burger.addEventListener("click", function(){ setOpen(burger.getAttribute("aria-expanded") !== "true") });
    document.addEventListener("keydown", function(e){ if(e.key==="Escape" && drawer.classList.contains("is-open")){ setOpen(false); burger.focus(); } });
    drawer.addEventListener("click", function(e){ if(e.target.closest("a")) setOpen(false) });
    window.addEventListener("resize", function(){ if(window.innerWidth > 1060 && drawer.classList.contains("is-open")) setOpen(false) });
  }

  /* Hero intro: measure roofline paths, then play once */
  var hero = $(".ap-hero[data-intro]");
  if(hero){
    $$(".ap-roofline path", hero).forEach(function(p){ try{ p.style.setProperty("--len", Math.ceil(p.getTotalLength())+1) }catch(e){} });
    var start = function(){ requestAnimationFrame(function(){ requestAnimationFrame(function(){ hero.classList.add("is-in") }) }) };
    if(reduce) hero.classList.add("is-in");
    else {
      var img = $(".ap-hero-media img", hero);
      if(img && !img.complete){ img.addEventListener("load", start); img.addEventListener("error", start); setTimeout(start, 900); }
      else start();
    }
  }

  /* Scroll reveals */
  var revealEls = $$("[data-reveal],.ap-seam[data-draw]");
  if("IntersectionObserver" in window && !reduce){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, {rootMargin:"0px 0px -8% 0px", threshold:.12});
    revealEls.forEach(function(el){ io.observe(el) });
  } else revealEls.forEach(function(el){ el.classList.add("is-in") });

  /* Accessible tabs (materials + process) with the Peak Guide indicator */
  $$("[data-tabs]").forEach(function(group){
    var tabs = $$("[role=tab]", group);
    var guide = $(".ap-guide", group), track = $(".ap-guide-track", group);
    var truss = $(".ap-truss-art", group);
    var horizontal = group.getAttribute("data-tabs") === "process";
    var place = function(tab){
      if(!guide) return;
      var gr = group.querySelector("[role=tablist]").getBoundingClientRect(), r = tab.getBoundingClientRect();
      if(horizontal){
        var y = parseFloat(getComputedStyle(tab).getPropertyValue("--y")) || 100;
        guide.style.setProperty("--gx", (r.left - gr.left + r.width/2 - 11.5) + "px");
        guide.style.setProperty("--gy", (y - 40) + "px");
      } else if(window.innerWidth <= 980){
        guide.style.setProperty("--gx", (r.left - gr.left + group.querySelector("[role=tablist]").scrollLeft + r.width/2 - 11.5) + "px");
        guide.style.transform = "";
      } else {
        guide.style.transform = "translateY(" + (r.top - gr.top + r.height/2 - 14) + "px)";
        if(track){ track.style.height = r.height + "px"; track.style.transform = "translateY(" + (r.top - gr.top) + "px)"; }
      }
    };
    var select = function(tab, focus){
      tabs.forEach(function(t){
        var on = t === tab, pane = document.getElementById(t.getAttribute("aria-controls"));
        t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
        if(pane){
          if(on && pane.hidden){ pane.hidden = false; if(!reduce){ pane.classList.remove("is-entering"); void pane.offsetWidth; pane.classList.add("is-entering"); } }
          else if(!on) pane.hidden = true;
        }
      });
      if(truss){ var i = tabs.indexOf(tab); truss.style.setProperty("--p", ((i + 1) / tabs.length).toFixed(3)); }
      place(tab);
      if(focus){ tab.focus(); if(tab.scrollIntoView && window.innerWidth <= 980) tab.scrollIntoView({block:"nearest",inline:"center",behavior:reduce?"auto":"smooth"}); }
    };
    tabs.forEach(function(t, i){
      t.addEventListener("click", function(){ select(t) });
      t.addEventListener("keydown", function(e){
        var k = e.key, n = null;
        if(k==="ArrowDown"||k==="ArrowRight") n = tabs[(i+1)%tabs.length];
        else if(k==="ArrowUp"||k==="ArrowLeft") n = tabs[(i-1+tabs.length)%tabs.length];
        else if(k==="Home") n = tabs[0]; else if(k==="End") n = tabs[tabs.length-1];
        if(n){ e.preventDefault(); select(n, true); }
      });
    });
    var current = tabs.filter(function(t){return t.getAttribute("aria-selected")==="true"})[0] || tabs[0];
    select(current);
    var rt; window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(function(){ place(tabs.filter(function(t){return t.getAttribute("aria-selected")==="true"})[0]) }, 120) });
    var tl = group.querySelector("[role=tablist]"); tl && tl.addEventListener("scroll", function(){ place(tabs.filter(function(t){return t.getAttribute("aria-selected")==="true"})[0]) }, {passive:true});
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ place(current) });
  });

  /* Service-area list highlights the schematic map */
  $$("[data-city]").forEach(function(btn){
    var g = root.querySelector('.m-city[data-c="' + btn.getAttribute("data-city") + '"]');
    if(!g) return;
    var on = function(){ g.classList.add("is-hot") }, off = function(){ g.classList.remove("is-hot") };
    btn.addEventListener("mouseenter", on); btn.addEventListener("mouseleave", off);
    btn.addEventListener("focus", on); btn.addEventListener("blur", off);
  });

  /* Gallery: filter + lightbox */
  $$("[data-gallery]").forEach(function(wrap){
    var chips = $$(".ap-chip", wrap), items = $$(".ap-gitem", wrap), live = $(".ap-gal-live", wrap);
    chips.forEach(function(chip){
      chip.addEventListener("click", function(){
        var f = chip.getAttribute("data-filter");
        chips.forEach(function(c){ c.setAttribute("aria-pressed", String(c === chip)) });
        var shown = 0;
        items.forEach(function(it){
          var match = f === "all" || (" " + it.getAttribute("data-cat") + " ").indexOf(" " + f + " ") > -1;
          if(match){ shown++; it.classList.remove("is-hidden"); if(!reduce){ it.classList.add("is-fading"); requestAnimationFrame(function(){ requestAnimationFrame(function(){ it.classList.remove("is-fading") }) }); } }
          else it.classList.add("is-hidden");
        });
        if(live) live.textContent = shown + " images shown";
      });
    });
    var dlg = $(".ap-lightbox", wrap);
    if(!dlg || typeof dlg.showModal !== "function") return;
    var big = $("img", dlg), cap = $(".ap-lb-cap", dlg), idx = 0;
    var visible = function(){ return items.filter(function(i){ return !i.classList.contains("is-hidden") }) };
    var show = function(i){
      var v = visible(); if(!v.length) return; idx = (i + v.length) % v.length;
      var it = v[idx], im = it.querySelector("img");
      big.src = it.getAttribute("data-full") || im.currentSrc || im.src; big.alt = im.alt;
      cap.textContent = it.getAttribute("data-caption") || im.alt;
    };
    items.forEach(function(it){ it.addEventListener("click", function(){ show(visible().indexOf(it)); dlg.showModal(); }) });
    $(".ap-lb-prev", dlg).addEventListener("click", function(){ show(idx - 1) });
    $(".ap-lb-next", dlg).addEventListener("click", function(){ show(idx + 1) });
    $(".ap-lb-close", dlg).addEventListener("click", function(){ dlg.close() });
    dlg.addEventListener("click", function(e){ if(e.target === dlg) dlg.close() });
    dlg.addEventListener("keydown", function(e){ if(e.key==="ArrowRight") show(idx+1); if(e.key==="ArrowLeft") show(idx-1); });
  });

  /* Forms: accessible validation + GHL-ready delivery.
     Set data-endpoint="https://..." (a GHL inbound webhook URL) on the <form> to send JSON.
     With no endpoint, nothing is sent and the visitor is told so plainly. */
  $$("form[data-ap-form]").forEach(function(form){
    var shell = form.closest(".ap-form"), status = $(".ap-form-status", shell), submit = $("[type=submit]", form);
    var msg = function(f){
      var v = f.validity, lbl = (form.querySelector('label[for="' + f.id + '"]') || {}).textContent || "This field";
      lbl = lbl.replace(/\(optional\)/i, "").replace(/\*/g,"").trim();
      if(v.valueMissing) return f.type === "checkbox" ? "Please confirm to continue." : lbl + " is required.";
      if(v.typeMismatch && f.type === "email") return "Enter an email address like name@example.com.";
      if(v.patternMismatch) return f.getAttribute("data-pattern-msg") || "Check the format of this field.";
      if(v.rangeUnderflow) return "Choose a date from today onward.";
      return "";
    };
    var check = function(f){
      var wrap = f.closest(".ap-field"); if(!wrap) return true;
      var m = msg(f), err = $(".ap-err", wrap);
      wrap.classList.toggle("is-invalid", !!m);
      f.setAttribute("aria-invalid", m ? "true" : "false");
      if(err) err.textContent = m;
      return !m;
    };
    var fields = $$("input,select,textarea", form).filter(function(f){ return f.type !== "hidden" && f.name !== "company_website" });
    fields.forEach(function(f){
      f.addEventListener("blur", function(){ if(f.value || f.closest(".ap-field").classList.contains("is-invalid")) check(f) });
      f.addEventListener("input", function(){ if(f.closest(".ap-field").classList.contains("is-invalid")) check(f) });
      f.addEventListener("change", function(){ check(f) });
    });
    var dateF = $('input[type=date]', form); if(dateF){ var d = new Date(); dateF.min = new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10); }
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var bad = fields.filter(function(f){ return !check(f) });
      status.className = "ap-form-status";
      if(bad.length){ bad[0].focus(); status.textContent = "Please fix " + bad.length + (bad.length > 1 ? " fields" : " field") + " above."; status.classList.add("is-on","is-error"); return; }
      if(form.company_website && form.company_website.value) return; /* honeypot */
      var data = {}; new FormData(form).forEach(function(v,k){ if(k !== "company_website") data[k] = v });
      data.form_name = form.getAttribute("data-ap-form"); data.page_url = location.href; data.submitted_at = new Date().toISOString();
      var endpoint = (form.getAttribute("data-endpoint") || "").trim();
      if(!endpoint){
        /* No backend by choice: show the thank-you state; nothing is sent or stored. */
        shell.classList.add("is-done"); var dn = $(".ap-form-done", shell); dn && dn.setAttribute("tabindex","-1"); dn && dn.focus();
        return;
      }
      submit.disabled = true; var label = submit.querySelector("span"); var old = label ? label.textContent : ""; if(label) label.textContent = "Sending…";
      fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)})
        .then(function(r){ if(!r.ok) throw new Error(r.status); shell.classList.add("is-done"); var d = $(".ap-form-done", shell); d && d.setAttribute("tabindex","-1"); d && d.focus(); })
        .catch(function(){ status.textContent = "Something went wrong sending your request. Please try again in a moment."; status.classList.add("is-on","is-error"); })
        .then(function(){ submit.disabled = false; if(label) label.textContent = old; });
    });
  });

  /* Footer year */
  $$("[data-year]").forEach(function(el){ el.textContent = new Date().getFullYear() });
})();
