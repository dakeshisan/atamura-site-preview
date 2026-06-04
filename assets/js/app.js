/* ATAMURA GROUP — поведение сайта (общий для всех страниц).
   Все обработчики guarded: страница может не содержать элемент — блок просто пропускается.
   Дизайн-система — из утверждённого прототипа (styles.css).
   Данные: window.ATAMURA_ZHK (zhk-data.js), window.ATAMURA_FLATS (flats-data.js). */
(function () {
  "use strict";

  var IN_ZK = /\/zk\//.test(location.pathname);
  function rel(p) { return (IN_ZK ? "../" : "") + p; }
  function imgsrc(p) { return p && !/^(https?:)?\/\//.test(p) && p.charAt(0) !== "/" ? rel(p) : p; }
  function money(n) { return Math.round(n).toLocaleString("ru-RU").replace(/,/g, " "); }
  function byId(id) { return document.getElementById(id); }
  function priceLabel(z) {
    if (z.priceFrom) return "от " + money(z.priceFrom) + " ₸";
    if (z.priceText) return z.priceText;
    return "цена по запросу";
  }
  function plural(n, one, few, many) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
    return many;
  }
  var WA_PHONE = "77007001111";
  /* Аналитика: пушим в dataLayer (GTM-совместимо) и в gtag, если GA4 загружен. Без PII (номер не пишем). */
  function track(name, params) {
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
      if (typeof window.gtag === "function") window.gtag("event", name, params || {});
    } catch (e) {}
  }
  function annuity(principal, annualRate, years) {
    var r = annualRate / 12, n = years * 12;
    if (r === 0) return principal / n;
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  /* 7-20-25: ставка 7%, первый взнос 20%, срок 25 лет. Ориентир — точную ставку подтверждает банк. */
  function payment72025(price) { return annuity(price * 0.8, 0.07, 25); }

  /* Отзывы жильцов по ЖК (verbatim, как на главной). Показываем на странице ЖК, если есть. */
  var ZK_REVIEWS = {
    atmosfera: { stars: "★★★★★", text: "Заехали в Атмосферу в марте. Двор не как в рекламе, а лучше: реально спокойно, дети играют, охрана работает. Поддержка отвечает в WhatsApp за 10 минут.", name: "Аида Н.", sub: "ЖК Атмосфера, 2 комн.", av: "АН" },
    aura: { stars: "★★★★★", text: "Сравнивал 4 застройщика. Atamura единственные, кто сразу показал точную стоимость с отделкой и ипотекой — без «от» и «примерно». Купили в Aura.", name: "Мирас К.", sub: "ЖК Aura, 3 комн.", av: "МК" },
    aqsai: { stars: "★★★★☆", text: "Брали таунхаус в Aqsai. Сдали с задержкой 2 месяца, но честно предупредили. После заселения мелкие косяки исправили без споров.", name: "Дамир Т.", sub: "Aqsai Resort, таунхаус", av: "ДТ" }
  };

  /* ---------- Burger / mobile drawer ---------- */
  (function () {
    var burger = byId("burger"), drawer = byId("drawer");
    if (!burger || !drawer) return;
    function open() { drawer.classList.add("is-on"); burger.classList.add("is-on"); document.body.classList.add("drawer-open"); }
    function close() { drawer.classList.remove("is-on"); burger.classList.remove("is-on"); document.body.classList.remove("drawer-open"); }
    burger.addEventListener("click", function () { drawer.classList.contains("is-on") ? close() : open(); });
    drawer.addEventListener("click", function (e) { if (e.target === drawer) close(); });
    var x = drawer.querySelector(".drawer-close"); if (x) x.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  })();

  /* ---------- Проекты/Квартиры toggle ---------- */
  (function () {
    var t = byId("projToggle"); if (!t) return;
    t.addEventListener("click", function () { this.classList.toggle("is-right"); });
  })();

  /* ---------- Фильтры на главной → ведут в рабочий каталог ---------- */
  document.querySelectorAll(".filter-btn").forEach(function (b) {
    b.addEventListener("click", function () { location.href = rel("flats.html"); });
  });

  /* ---------- Калькулятор ипотеки ---------- */
  (function () {
    var cost = byId("cost"), down = byId("down"), years = byId("years");
    if (!cost || !down || !years) return;
    var costLabel = byId("costLabel"), downLabel = byId("downLabel"), yearsLabel = byId("yearsLabel"), result = byId("monthlyResult");
    function calc() {
      var C = +cost.value, dPct = +down.value, D = C * dPct / 100, loan = C - D;
      var Y = +years.value, n = Y * 12, r = 0.114 / 12;
      var monthly = loan * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      if (costLabel) costLabel.textContent = money(C) + " ₸";
      if (downLabel) downLabel.textContent = money(D) + " ₸ (" + dPct + "%)";
      if (yearsLabel) yearsLabel.textContent = Y + " лет";
      if (result) result.innerHTML = money(monthly) + "<sub>₸/мес</sub>";
      var wa = byId("mortWa");
      if (wa) {
        var msg = "Здравствуйте! Рассчитал на сайте ATAMURA: квартира ~" + money(C) + " ₸, первый взнос " + dPct + "% (" + money(D) + " ₸), срок " + Y + " лет → платёж ~" + money(monthly) + " ₸/мес. Подберите варианты под этот бюджет и помогите с точным расчётом.";
        wa.href = "https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(msg);
      }
    }
    var calcTracked = false;
    [cost, down, years].forEach(function (el) {
      el.addEventListener("input", calc);
      el.addEventListener("input", function () { if (!calcTracked) { calcTracked = true; track("mortgage_calc_used", { page: location.pathname }); } });
    });
    calc();
  })();

  /* ---------- Sticky bar ---------- */
  (function () {
    var sticky = byId("stickyBar"); if (!sticky) return;
    var closed = false;
    window.addEventListener("scroll", function () { if (!closed && scrollY > 600) sticky.classList.add("is-on"); }, { passive: true });
    var x = sticky.querySelector(".sticky-close"); if (x) x.addEventListener("click", function () { closed = true; sticky.classList.remove("is-on"); });
  })();

  /* ---------- Popups (scroll 50% + exit-intent) ---------- */
  function closePop(id) { var p = byId(id); if (p) p.classList.remove("is-on"); }
  window.closePop = closePop;
  (function () {
    var scrollPop = byId("scrollPopup");
    if (scrollPop) {
      var shown = sessionStorage.getItem("atamura_scrollPop") === "1";
      window.addEventListener("scroll", function () {
        if (shown) return;
        var pct = scrollY / (document.documentElement.scrollHeight - innerHeight);
        if (pct > 0.5) { scrollPop.classList.add("is-on"); shown = true; sessionStorage.setItem("atamura_scrollPop", "1"); track("popup_shown", { popup: "scroll" }); }
      }, { passive: true });
    }
    var exitPop = byId("exitPopup");
    if (exitPop) {
      var eshown = sessionStorage.getItem("atamura_exitPop") === "1";
      document.addEventListener("mouseleave", function (e) {
        if (eshown) return;
        if (e.clientY < 10 && performance.now() > 15000) { exitPop.classList.add("is-on"); eshown = true; sessionStorage.setItem("atamura_exitPop", "1"); track("popup_shown", { popup: "exit" }); }
      });
    }
    document.querySelectorAll(".popup-overlay").forEach(function (ov) {
      ov.addEventListener("click", function (e) { if (e.target === ov) ov.classList.remove("is-on"); });
    });
  })();

  /* ---------- Телефон: маска + валидация ---------- */
  function formatPhone(v) {
    var d = v.replace(/\D/g, "");
    if (d[0] === "8") d = "7" + d.slice(1);
    if (d[0] !== "7") d = "7" + d;
    d = d.slice(0, 11);
    var r = "+7";
    if (d.length > 1) r += " (" + d.slice(1, 4);
    if (d.length >= 4) r += ")";
    if (d.length >= 5) r += " " + d.slice(4, 7);
    if (d.length >= 8) r += "-" + d.slice(7, 9);
    if (d.length >= 10) r += "-" + d.slice(9, 11);
    return r;
  }
  function phoneValid(v) { return v.replace(/\D/g, "").length >= 11; }
  function bindPhones(scope) {
    (scope || document).querySelectorAll('input[type="tel"]').forEach(function (i) {
      if (i.dataset.tel) return; i.dataset.tel = "1";
      i.addEventListener("input", function () { i.value = formatPhone(i.value); });
    });
  }
  function showFieldError(input, msg) {
    input.setAttribute("aria-invalid", "true");
    var err = input.parentNode.querySelector(".field-err");
    if (!err) { err = document.createElement("p"); err.className = "field-err"; err.setAttribute("role", "alert"); input.insertAdjacentElement("afterend", err); }
    err.textContent = msg;
    var clr = function () { input.removeAttribute("aria-invalid"); if (err && err.parentNode) err.parentNode.removeChild(err); input.removeEventListener("input", clr); };
    input.addEventListener("input", clr);
  }

  /* ---------- Лид-формы (валидация → заглушка → localStorage → /спасибо) ---------- */
  function bindForms(scope) {
    bindPhones(scope);
    (scope || document).querySelectorAll("form.lead-form").forEach(function (f) {
      if (f.dataset.bound) return; f.dataset.bound = "1";
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var tel = f.querySelector('input[type="tel"]');
        if (tel && !phoneValid(tel.value)) { showFieldError(tel, "Введите номер: +7 7XX XXX-XX-XX"); tel.focus(); return; }
        var data = {}; new FormData(f).forEach(function (v, k) { data[k] = v; });
        data.source = f.getAttribute("data-form") || "form"; data.page = location.pathname;
        data.ref = document.referrer || "прямой заход"; data.utm = location.search || ""; data.ts = new Date().toISOString();
        try { var q = JSON.parse(localStorage.getItem("atamura_leads") || "[]"); q.push(data); localStorage.setItem("atamura_leads", JSON.stringify(q)); } catch (e2) {}
        track("form_submitted", { form_type: data.source, page: data.page, messenger: data.messenger || "" });
        location.href = rel("spasibo.html");
      });
    });
  }

  /* ---------- Карточка ЖК (.pcard) ---------- */
  function pcard(z) {
    var photo = imgsrc(z.hero_image || (z.gallery && z.gallery[0]) || "");
    var badge2 = z.draft ? '<span class="badge is-status is-light">Скоро</span>' : '<span class="badge is-soft">Идут продажи</span>';
    var price = z.priceFrom ? 'от <strong>' + (z.priceFrom / 1000000).toFixed(z.priceFrom % 1000000 ? 1 : 0) + "</strong> млн ₸"
      : (z.priceText ? "<strong>" + z.priceText + "</strong>" : "<strong>цена по запросу</strong>");
    return '<a class="pcard" href="' + rel("zk/" + z.slug + ".html") + '">' +
      '<div class="pcard-photo">' + (photo ? '<img src="' + photo + '" alt="ЖК ' + z.name + '" loading="lazy" />' : "") +
        '<div class="pcard-badges"><span class="badge">' + z.segment + "</span>" + badge2 + "</div></div>" +
      '<div class="pcard-body"><div class="pcard-info"><h3 class="pcard-name">' + z.name + "</h3>" +
        '<span class="pcard-loc"><span class="dot">' + z.district + "</span></span></div>" +
        '<span class="pcard-price">' + price + "</span></div></a>";
  }

  /* ---------- Страница ЖК (детальная, рендер из window.ATAMURA_ZHK) ---------- */
  function renderZhkDetail() {
    var host = byId("zhk-detail"); if (!host || !window.ATAMURA_ZHK) return;
    var slug = host.getAttribute("data-slug");
    var z = window.ATAMURA_ZHK.filter(function (x) { return x.slug === slug; })[0];
    if (!z) { host.innerHTML = '<div class="wrap" style="padding:80px 0">Комплекс не найден. <a href="' + rel("index.html") + '#projects">Все ЖК</a></div>'; return; }
    document.title = "ЖК " + z.name + " — ATAMURA GROUP";

    var gal = []; if (z.hero_image) gal.push(z.hero_image); (z.gallery || []).forEach(function (g) { if (gal.indexOf(g) < 0) gal.push(g); });
    var heroImg = imgsrc(gal[0] || "");
    var galTiles = gal.slice(1, 6); while (galTiles.length < 4) galTiles.push(null);

    var feat = (z.highlights || []).map(function (h) {
      return '<div class="feat"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 9l3.2 3.2L14 5.5"/></svg><span>' + h + "</span></div>";
    }).join("");
    /* H2 — инфраструктура и дорога (закрывает возражение «далеко»); только реальные факты из данных ЖК */
    var near = (z.nearby || []).map(function (h) {
      return '<div class="feat"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 1.6c2.9 0 5.3 2.4 5.3 5.3 0 4-5.3 9.5-5.3 9.5S3.7 10.9 3.7 6.9C3.7 4 6.1 1.6 9 1.6z"/><circle cx="9" cy="6.9" r="2"/></svg><span>' + h + "</span></div>";
    }).join("");
    /* H3 — отзыв жильца по этому ЖК, если есть */
    var rev = ZK_REVIEWS[slug];
    var revHTML = rev ? '<h2 class="zk-h2" style="margin-top:var(--s-7)">Отзыв жильца</h2>' +
      '<article class="review"><span class="review-stars">' + rev.stars + '</span><p>«' + rev.text + '»</p>' +
      '<div class="review-author"><div class="review-avatar">' + rev.av + '</div>' +
      '<div><div class="review-name">' + rev.name + '</div><div class="review-zk">' + rev.sub + '</div></div></div></article>' : "";
    /* H1 — оценка платежа по 7-20-25 от стартовой цены ЖК */
    var payHTML = z.priceFrom ? '<div style="background:var(--bg);border:1px solid var(--line);border-radius:var(--r-md);padding:12px 14px;margin-bottom:var(--s-3);font-size:14px">Ипотека по <strong>7-20-25</strong> — от <strong>' + money(payment72025(z.priceFrom)) + ' ₸/мес</strong><br><span style="font-size:12px;color:var(--ink-soft)">первый взнос 20%, срок 25 лет · ориентир, точную ставку подтверждает банк</span></div>' : "";
    var trustLine = '<div style="margin-top:12px;font-size:12px;color:var(--ink-soft);text-align:center">10 лет на рынке · 2000+ семей · гарант сделки КЖК</div>';
    var roomChips = (z.rooms || []).map(function (r) { return '<span class="chip" style="display:inline-flex;align-items:center;height:34px;padding:0 14px;border-radius:999px;background:var(--bg);border:1px solid var(--line);font-weight:600;font-size:13px;margin-right:6px">' + r + (/^\d+$/.test(r) ? "-комн." : "") + "</span>"; }).join("");
    var stats = [
      { v: priceLabel(z), l: "Стартовая цена" },
      { v: (z.rooms || []).join(" · "), l: "Планировки" },
      { v: z.status || "—", l: "Статус" },
      { v: z.segment || "—", l: "Класс" }
    ].map(function (s) { return '<div class="zk-stat"><strong>' + s.v + "</strong><span>" + s.l + "</span></div>"; }).join("");
    var others = window.ATAMURA_ZHK.filter(function (x) { return x.slug !== slug; }).slice(0, 3).map(pcard).join("");

    host.innerHTML =
      '<section class="pagehero" style="' + (heroImg ? "background-image:linear-gradient(180deg, oklch(0% 0 0 /.18) 0%, oklch(0% 0 0 /.62) 100%), url(" + heroImg + ")" : "background-color:var(--dark-cta)") + '">' +
        '<div class="wrap pagehero-inner">' +
          '<nav class="crumbs"><a href="' + rel("index.html") + '">Главная</a><span>›</span><a href="' + rel("index.html") + '#projects">Жилые комплексы</a><span>›</span>ЖК ' + z.name + "</nav>" +
          '<div class="pagehero-badges">' + (z.segment ? '<span class="badge is-light">' + z.segment + "</span>" : "") + (z.status ? '<span class="badge is-accent">' + z.status + "</span>" : "") + "</div>" +
          '<h1 class="pagehero-title">ЖК ' + z.name + "</h1>" +
          '<p class="pagehero-sub">' + (z.tagline || "") + " · " + z.district + "</p>" +
          '<div class="pagehero-cta"><a class="btn btn-accent" href="#zk-form">Узнать цены и планировки</a>' +
            (z.draft ? "" : '<a class="btn btn-light" href="' + z.site + '" target="_blank" rel="noopener">Текущий сайт ЖК</a>') + "</div>" +
        "</div></section>" +
      '<section class="zk-section"><div class="wrap">' +
        '<div class="zk-stats">' + stats + "</div>" +
        '<div class="zk-layout">' +
          '<div class="zk-main">' +
            '<div class="zk-gallery">' + galTiles.map(function (u) { return u ? '<div class="zk-gtile"><img src="' + imgsrc(u) + '" alt="ЖК ' + z.name + '" loading="lazy"></div>' : '<div class="zk-gtile is-ph"></div>'; }).join("") + "</div>" +
            '<h2 class="zk-h2">О комплексе</h2><p class="zk-lead">' + (z.description || "") + "</p>" +
            '<div style="margin-top:var(--s-4)">' + roomChips + "</div>" +
            (z.draft ? '<div class="note">Сайт этого комплекса сейчас не опубликован — показано предварительное описание. Заменим реальными данными и фото, как только сайт станет доступен.</div>' : "") +
            (feat ? '<h2 class="zk-h2" style="margin-top:var(--s-7)">Преимущества</h2><div class="feat-grid">' + feat + "</div>" : "") +
            (near ? '<h2 class="zk-h2" style="margin-top:var(--s-7)">Инфраструктура и дорога</h2><div class="feat-grid">' + near + "</div>" : "") +
            revHTML +
          "</div>" +
          '<aside class="zk-aside" id="zk-form"><div class="zk-card">' +
            '<div class="zk-card-price">' + priceLabel(z) + "</div>" +
            payHTML +
            '<div class="zk-card-note">Менеджер пришлёт подборку планировок и точный расчёт под ваш бюджет за 15 минут.</div>' +
            '<form class="lead-form" data-form="zk-' + z.slug + '">' +
              '<input class="input-pill" name="name" aria-label="Ваше имя" placeholder="Ваше имя" />' +
              '<input class="input-pill" name="phone" type="tel" required aria-label="Номер телефона" placeholder="+7 (___) ___-__-__" />' +
              '<button class="btn btn-brand" type="submit">Получить подборку →</button>' +
              '<p class="popup-fineprint">Нажимая кнопку, вы соглашаетесь с обработкой данных.</p>' +
            "</form>" + trustLine + "</div></aside>" +
        "</div>" +
        '<div class="zk-similar"><div class="reviews-head"><h2 class="zk-h2">Другие комплексы</h2>' +
          '<a class="btn btn-outline" href="' + rel("index.html") + '#projects">Все ЖК →</a></div><div class="grid-3">' + others + "</div></div>" +
      "</div></section>";
    bindForms(host);
  }

  /* ---------- Живой каталог квартир (/flats) ---------- */
  var FAV_KEY = "atamura_fav";
  function getFav() { try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch (e) { return []; } }
  function setFav(a) { try { localStorage.setItem(FAV_KEY, JSON.stringify(a)); } catch (e) {} }
  function toggleFav(id) { var f = getFav(), i = f.indexOf(id); if (i < 0) f.push(id); else f.splice(i, 1); setFav(f); return i < 0; }
  function flatId(f) { return f.zk + "_" + f.rooms; }            // тип-уровень: ЖК × комнатность
  function isFav(f) { return getFav().indexOf(flatId(f)) >= 0; }
  function favCount() { return getFav().length; }
  /* Бейдж-счётчик в шапочной иконке «избранное» (на всех страницах) + счётчик в каталоге */
  function paintFavCount() {
    var n = favCount();
    document.querySelectorAll(".fav-count").forEach(function (b) { b.textContent = n ? String(n) : ""; });
    var cn = byId("cat-fav-n"); if (cn) cn.textContent = n ? " (" + n + ")" : "";
  }
  function bindFavCount() {
    document.querySelectorAll('a.icon-btn[href*="fav=1"]').forEach(function (a) {
      if (!a.querySelector(".fav-count")) { var s = document.createElement("span"); s.className = "fav-count"; a.appendChild(s); }
    });
    paintFavCount();
  }

  function roomLabel(r) {
    if (r === "Студия") return "Студии";
    if (r === "Таунхаус") return "Таунхаусы";
    if (r === "Дуплекс") return "Дуплексы";
    if (r === "Коттедж") return "Коттеджи";
    if (/^\d+$/.test(r)) return r + "-комнатные";
    return r;
  }
  var ROOM_ORDER = ["Студия", "1", "2", "3", "4", "Дуплекс", "Таунхаус", "Коттедж"];

  function flatCard(f) {
    var rl = roomLabel(f.rooms);
    var area = f.areaMin === f.areaMax ? f.areaMin + " м²" : f.areaMin + "–" + f.areaMax + " м²";
    var img = f.image ? '<img src="' + f.image + '" alt="' + rl + ' в ЖК ' + f.zkName + '" loading="lazy">' : "";
    var srok = f.srok ? '<span class="flat-status">' + f.srok + "</span>" : "";
    var waText = "Здравствуйте! Интересует ЖК " + f.zkName + ", " + rl.toLowerCase() + " (от " + money(f.priceFrom) + " ₸). Пришлите варианты и расчёт платежа.";
    var fid = flatId(f), isf = isFav(f);
    var heart = '<button class="flat-fav' + (isf ? ' is-on' : '') + '" type="button" data-fav="' + fid + '" aria-pressed="' + (isf ? 'true' : 'false') + '" aria-label="' + (isf ? 'Убрать из избранного' : 'В избранное') + '"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-4.35-9.2-8.05C1 10.6 1.4 7.4 3.9 6.1c1.9-1 4.1-.4 5.3 1.2L12 10l2.8-2.7c1.2-1.6 3.4-2.2 5.3-1.2 2.5 1.3 2.9 4.5 1.1 6.85C18.5 16.65 12 21 12 21z"/></svg></button>';
    return '<article class="flat" data-zk="' + f.zk + '">' + heart +
      '<a class="flat-photo" href="' + rel("zk/" + f.zk + ".html") + '">' + img + srok + "</a>" +
      '<div class="flat-body">' +
        '<div class="flat-head"><span class="flat-rooms">' + rl + '</span><span class="flat-area">' + area + "</span></div>" +
        '<div class="flat-price"><strong>от ' + money(f.priceFrom) + ' ₸</strong><span>взнос 20% → от ' + money(f.payFrom) + " ₸/мес · 7-20-25</span></div>" +
        '<div class="flat-meta"><span>ЖК ' + f.zkName + '</span><span>·</span><span>' + f.segment + "</span></div>" +
        '<div class="flat-actions">' +
          '<a class="btn btn-brand btn-sm" href="' + rel("zk/" + f.zk + ".html") + '#zk-form">Записаться на показ</a>' +
          '<a class="btn btn-outline btn-sm" href="https://wa.me/' + WA_PHONE + "?text=" + encodeURIComponent(waText) + '" target="_blank" rel="noopener" data-wa="catalog">Расчёт в WhatsApp</a>' +
        "</div>" +
      "</div></article>";
  }

  function renderCatalog() {
    var root = byId("catalog"); if (!root || !window.ATAMURA_FLATS) return;
    var ALL = window.ATAMURA_FLATS.slice();
    /* Типы из строящихся ЖК без цены (Amaia/Dion → «Дуплекс»): показываем как опцию, но без выдуманных квартир.
       UPCOMING[room] = [{slug,name}] — нужные ЖК для честного экрана «скоро». */
    var UPCOMING = {};
    (window.ATAMURA_ZHK || []).forEach(function (z) {
      if (z.status === "Скоро" && !ALL.some(function (f) { return f.zk === z.slug; })) (z.rooms || []).forEach(function (r) {
        if (!ALL.some(function (f) { return f.rooms === r; })) { (UPCOMING[r] = UPCOMING[r] || []).push({ slug: z.slug, name: z.name }); }
      });
    });
    var prices = ALL.map(function (f) { return f.priceFrom; });
    var PMIN = Math.min.apply(null, prices), PMAX = Math.max.apply(null, prices);
    var state = { rooms: [], zk: "", pmax: PMAX, deal: "", srok: "", sort: "price-asc", fav: false };

    var q = new URLSearchParams(location.search);
    if (q.get("rooms")) state.rooms = q.get("rooms").split(",").filter(Boolean);
    if (q.get("zk")) state.zk = q.get("zk");
    if (q.get("pmax")) state.pmax = +q.get("pmax") || PMAX;
    if (q.get("deal")) state.deal = q.get("deal");
    if (q.get("srok")) state.srok = q.get("srok");
    if (q.get("sort")) state.sort = q.get("sort");
    if (q.get("fav")) state.fav = true;

    var ROOM_OPTS = ROOM_ORDER.filter(function (r) { return ALL.some(function (f) { return f.rooms === r; }) || UPCOMING[r]; });
    var ZK_OPTS = []; ALL.forEach(function (f) { if (!ZK_OPTS.some(function (z) { return z.slug === f.zk; })) ZK_OPTS.push({ slug: f.zk, name: f.zkName }); });
    var SROK_OPTS = []; ALL.forEach(function (f) { if (f.srok && SROK_OPTS.indexOf(f.srok) < 0) SROK_OPTS.push(f.srok); });

    root.innerHTML =
      '<div class="cat-bar">' +
        '<div class="cat-field cat-field-rooms"><label>Комнатность</label><div class="cat-chips" id="cat-rooms">' +
          ROOM_OPTS.map(function (r) { return '<button class="cat-chip" type="button" data-room="' + r + '">' + r + "</button>"; }).join("") +
        "</div></div>" +
        '<div class="cat-field"><label>Жилой комплекс</label><select id="cat-zk"><option value="">Все ЖК</option>' +
          ZK_OPTS.map(function (z) { return '<option value="' + z.slug + '">ЖК ' + z.name + "</option>"; }).join("") + "</select></div>" +
        '<div class="cat-field"><label>Способ покупки</label><select id="cat-deal"><option value="">Любой</option><option value="Ипотека">Ипотека</option><option value="Рассрочка">Рассрочка</option><option value="7-20-25">7-20-25</option></select></div>' +
        '<div class="cat-field"><label>Срок сдачи</label><select id="cat-srok"><option value="">Любой</option>' +
          SROK_OPTS.map(function (s) { return '<option value="' + s + '">' + s + "</option>"; }).join("") + "</select></div>" +
        '<div class="cat-field cat-field-wide"><label>Бюджет до <output id="cat-pmax-v"></output></label><input type="range" id="cat-pmax" min="' + PMIN + '" max="' + PMAX + '" step="500000" value="' + state.pmax + '"></div>' +
        '<div class="cat-field"><label>Сортировка</label><select id="cat-sort"><option value="price-asc">Сначала дешевле</option><option value="price-desc">Сначала дороже</option><option value="area-desc">Больше площадь</option></select></div>' +
        '<button class="cat-reset" type="button" id="cat-reset">Сбросить</button>' +
      "</div>" +
      '<div class="cat-head"><div class="cat-head-l"><h2 class="cat-count" id="cat-count" aria-live="polite"></h2>' +
        '<p class="cat-note">Цена — «от». Точную стоимость и подходящие квартиры подберёт менеджер.</p></div>' +
        '<button class="cat-fav-toggle" type="button" id="cat-fav" aria-pressed="false"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-4.35-9.2-8.05C1 10.6 1.4 7.4 3.9 6.1c1.9-1 4.1-.4 5.3 1.2L12 10l2.8-2.7c1.2-1.6 3.4-2.2 5.3-1.2 2.5 1.3 2.9 4.5 1.1 6.85C18.5 16.65 12 21 12 21z"/></svg>Избранное<span class="cat-fav-n" id="cat-fav-n"></span></button></div>' +
      '<div class="cat-grid" id="cat-grid"></div>' +
      '<div class="cat-empty" id="cat-empty" hidden><span id="cat-empty-msg">Под эти параметры вариантов нет.</span> <a class="btn btn-brand btn-sm" id="cat-empty-link" hidden></a> <button class="btn btn-outline btn-sm" type="button" id="cat-empty-reset">Сбросить фильтр</button></div>';

    var grid = byId("cat-grid"), count = byId("cat-count"), empty = byId("cat-empty");
    var pmaxR = byId("cat-pmax"), pmaxV = byId("cat-pmax-v"), zkS = byId("cat-zk"), dealS = byId("cat-deal"), srokS = byId("cat-srok"), sortS = byId("cat-sort");

    function syncControls() {
      zkS.value = state.zk; dealS.value = state.deal; srokS.value = state.srok; sortS.value = state.sort; pmaxR.value = state.pmax;
      pmaxV.textContent = money(state.pmax) + " ₸";
      byId("cat-rooms").querySelectorAll(".cat-chip").forEach(function (b) { b.classList.toggle("is-on", state.rooms.indexOf(b.getAttribute("data-room")) >= 0); });
      var ft = byId("cat-fav"); if (ft) { ft.classList.toggle("is-on", state.fav); ft.setAttribute("aria-pressed", state.fav ? "true" : "false"); }
    }
    function writeURL() {
      var p = new URLSearchParams();
      if (state.rooms.length) p.set("rooms", state.rooms.join(","));
      if (state.zk) p.set("zk", state.zk);
      if (state.deal) p.set("deal", state.deal);
      if (state.srok) p.set("srok", state.srok);
      if (state.pmax < PMAX) p.set("pmax", state.pmax);
      if (state.sort !== "price-asc") p.set("sort", state.sort);
      if (state.fav) p.set("fav", "1");
      history.replaceState(null, "", location.pathname + (p.toString() ? "?" + p.toString() : ""));
    }
    function apply() {
      var favs = getFav();
      var list = ALL.filter(function (f) {
        if (state.fav && favs.indexOf(flatId(f)) < 0) return false;
        if (state.rooms.length && state.rooms.indexOf(f.rooms) < 0) return false;
        if (state.zk && f.zk !== state.zk) return false;
        if (state.deal && (f.deal || []).indexOf(state.deal) < 0) return false;
        if (state.srok && f.srok !== state.srok) return false;
        if (f.priceFrom > state.pmax) return false;
        return true;
      });
      list.sort(function (a, b) {
        if (state.sort === "price-desc") return b.priceFrom - a.priceFrom;
        if (state.sort === "area-desc") return b.areaMax - a.areaMax;
        return a.priceFrom - b.priceFrom;
      });
      count.textContent = list.length + " " + plural(list.length, "вариант", "варианта", "вариантов");
      grid.innerHTML = list.map(flatCard).join("");
      empty.hidden = list.length > 0;
      grid.hidden = list.length === 0;
      var em = byId("cat-empty-msg"), elink = byId("cat-empty-link");
      var upRoom = state.rooms.filter(function (r) { return UPCOMING[r]; })[0];
      if (state.fav && favs.length === 0) {
        if (em) em.textContent = "В избранном пока пусто — нажимайте ♥ на карточках квартир, чтобы сохранить.";
        if (elink) elink.hidden = true;
      } else if (list.length === 0 && upRoom) {
        var zs = UPCOMING[upRoom];
        if (em) em.textContent = roomLabel(upRoom) + " — в новых ЖК " + zs.map(function (z) { return z.name; }).join(" и ") + ". Старт продаж скоро — оставьте заявку, сообщим первыми.";
        if (elink) { elink.hidden = false; elink.textContent = "Смотреть ЖК " + zs[0].name; elink.setAttribute("href", rel("zk/" + zs[0].slug + ".html")); }
      } else {
        if (em) em.textContent = "Под эти параметры вариантов нет.";
        if (elink) elink.hidden = true;
      }
      writeURL();
      paintFavCount();
    }

    byId("cat-rooms").addEventListener("click", function (e) {
      var b = e.target.closest(".cat-chip"); if (!b) return;
      var r = b.getAttribute("data-room"), i = state.rooms.indexOf(r);
      if (i < 0) state.rooms.push(r); else state.rooms.splice(i, 1);
      b.classList.toggle("is-on"); apply();
    });
    pmaxR.addEventListener("input", function () { state.pmax = +pmaxR.value; pmaxV.textContent = money(state.pmax) + " ₸"; apply(); });
    zkS.addEventListener("change", function () { state.zk = zkS.value; apply(); });
    dealS.addEventListener("change", function () { state.deal = dealS.value; apply(); });
    srokS.addEventListener("change", function () { state.srok = srokS.value; apply(); });
    sortS.addEventListener("change", function () { state.sort = sortS.value; apply(); });
    byId("cat-reset").addEventListener("click", function () { state = { rooms: [], zk: "", pmax: PMAX, deal: "", srok: "", sort: "price-asc", fav: false }; syncControls(); apply(); });
    byId("cat-empty-reset").addEventListener("click", function () { byId("cat-reset").click(); });
    grid.addEventListener("click", function (e) {
      var favBtn = e.target.closest(".flat-fav");
      if (favBtn) {
        var on = toggleFav(favBtn.getAttribute("data-fav"));
        favBtn.classList.toggle("is-on", on);
        favBtn.setAttribute("aria-pressed", on ? "true" : "false");
        favBtn.setAttribute("aria-label", on ? "Убрать из избранного" : "В избранное");
        track("fav_toggle", { on: on ? 1 : 0 });
        paintFavCount();
        if (state.fav && !on) apply();   // в режиме «избранное» убрать снятую карточку из списка
        return;
      }
      if (e.target.closest("[data-wa]")) track("whatsapp_click", { source: "catalog" });
    });
    byId("cat-fav").addEventListener("click", function () {
      state.fav = !state.fav;
      this.classList.toggle("is-on", state.fav);
      this.setAttribute("aria-pressed", state.fav ? "true" : "false");
      apply();
    });

    syncControls(); apply();
  }

  /* ---------- ИИ-помощник → WhatsApp (заглушка: текст уходит менеджеру в WhatsApp) ---------- */
  function bindAiHelper() {
    var box = document.querySelector(".ai-helper");
    var floatAi = document.querySelector(".float-btn.is-ai");
    if (floatAi && !floatAi.dataset.bound) {
      floatAi.dataset.bound = "1";
      floatAi.addEventListener("click", function () {
        if (box) { box.scrollIntoView({ behavior: "smooth", block: "center" }); var i = box.querySelector(".ai-input"); if (i) setTimeout(function () { i.focus(); }, 450); }
        else { track("whatsapp_click", { source: "float_ai" }); window.open("https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent("Здравствуйте! Помогите подобрать квартиру под бюджет."), "_blank", "noopener"); }
      });
    }
    if (!box) return;
    var input = box.querySelector(".ai-input"), send = box.querySelector(".ai-send");
    function go() {
      var v = (input && input.value || "").trim();
      var text = v ? "Здравствуйте! Ищу квартиру: " + v : "Здравствуйте! Помогите подобрать квартиру под бюджет.";
      track("whatsapp_click", { source: "ai_helper", has_query: v ? 1 : 0 });
      window.open("https://wa.me/" + WA_PHONE + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    }
    if (send) send.addEventListener("click", go);
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go(); } });
    box.querySelectorAll(".ai-prompt").forEach(function (b) {
      b.addEventListener("click", function () { if (input) { input.value = b.textContent.trim(); input.focus(); } });
    });
  }

  /* ---------- Скролл-анимации (GSAP, прогрессивно; пропускаем при reduced-motion) ---------- */
  function bindScrollAnim() {
    if (!window.gsap || !window.ScrollTrigger) return;                 // нет GSAP → контент остаётся статичным и видимым
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    // Появление повторяющихся блоков. Только opacity/transform → без CLS. Hero-текст не трогаем → без вреда LCP.
    var reveal = ".trust-cell, .pcard, .buy-card, .review, .news-card, .premium-card, .feat, .zk-stat, .flat";
    if (document.querySelector(reveal)) {
      gsap.set(reveal, { opacity: 0, y: 22 });
      ST.batch(reveal, {
        start: "top 90%", once: true,
        onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, ease: "power2.out", overwrite: true }); }
      });
    }
    // Лёгкий параллакс фоновых картинок героя (LCP-текст остаётся на месте)
    gsap.utils.toArray(".hero .teaser-bg").forEach(function (bg) {
      gsap.to(bg, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    });
    window.addEventListener("load", function () { ST.refresh(); });
  }

  /* ---------- Липкая шапка: прозрачная над фото → плотная при скролле ---------- */
  function bindStickyHeader() {
    var head = document.querySelector(".head.over"); if (!head) return;
    var hero = document.querySelector(".home-hero");
    function thr() { return hero ? Math.max(120, hero.offsetHeight - 90) : 200; }
    var t = thr(), stuck = false;
    function onScroll() { var s = window.scrollY > t; if (s !== stuck) { stuck = s; head.classList.toggle("is-stuck", s); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () { t = thr(); onScroll(); });
    onScroll();
  }

  /* ---------- Слайдер фонов героя (фото ЖК, кроссфейд) ---------- */
  function bindHeroSlider() {
    var box = byId("heroSlider"); if (!box) return;
    var slides = [].slice.call(box.querySelectorAll(".hh-slide"));
    if (slides.length < 2) return;
    var nameEl = document.querySelector(".hh-name");
    var dots = [].slice.call(document.querySelectorAll(".hh-dots button"));
    var i = 0, timer = null;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function show(n) {
      slides[i].classList.remove("is-on"); if (dots[i]) dots[i].classList.remove("on");
      i = (n + slides.length) % slides.length;
      slides[i].classList.add("is-on"); if (dots[i]) dots[i].classList.add("on");
      if (nameEl) nameEl.textContent = slides[i].getAttribute("data-name") || "";
    }
    function start() { if (reduce) return; stop(); timer = setInterval(function () { show(i + 1); }, 5000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    dots.forEach(function (d) { d.addEventListener("click", function () { show(+d.getAttribute("data-i")); start(); }); });
    box.addEventListener("mouseenter", stop); box.addEventListener("mouseleave", start);
    start();
  }

  /* ---------- Активный пункт меню («вы здесь») ---------- */
  function bindActiveNav() {
    var f = (location.pathname.split("/").pop() || "index.html");
    var map = { "flats.html": "flats.html", "o-kompanii.html": "o-kompanii.html", "contacts.html": "contacts.html" };
    var key = map[f] || "index.html#projects";
    document.querySelectorAll(".nav-main a").forEach(function (a) {
      if ((a.getAttribute("href") || "").indexOf(key) >= 0) { a.setAttribute("aria-current", "page"); a.classList.add("is-active"); }
    });
  }

  /* ---------- Инлайн-поиск в герое ---------- */
  function bindHeroSearch() {
    var hs = document.querySelector(".herosearch"); if (!hs) return;
    var picked = [], go = byId("hs-go"), zk = hs.querySelector('select[name="zk"]'), pmax = hs.querySelector('select[name="pmax"]');
    function build() {
      var p = new URLSearchParams();
      if (picked.length) p.set("rooms", picked.join(","));
      if (zk && zk.value) p.set("zk", zk.value);
      if (pmax && pmax.value) p.set("pmax", pmax.value);
      go.setAttribute("href", "flats.html" + (p.toString() ? "?" + p.toString() : ""));
    }
    hs.querySelectorAll(".hs-chip").forEach(function (b) {
      b.addEventListener("click", function () {
        var r = b.getAttribute("data-r"), i = picked.indexOf(r);
        if (i < 0) picked.push(r); else picked.splice(i, 1);
        b.classList.toggle("is-on"); build();
      });
    });
    if (zk) zk.addEventListener("change", build);
    if (pmax) pmax.addEventListener("change", build);
    build();
  }

  /* ---------- Тост (короткое ненавязчивое уведомление) ---------- */
  var _toastTimer = null;
  function toast(msg) {
    var t = byId("app-toast");
    if (!t) { t = document.createElement("div"); t.id = "app-toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg;
    requestAnimationFrame(function () { t.classList.add("is-on"); });
    if (_toastTimer) clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 3200);
  }

  /* ---------- Переключатель языка Рус / Qaz ----------
     Казахской версии пока нет — честно сообщаем «скоро», не подменяя контент. */
  function bindLang() {
    var sw = document.querySelector(".lang-switch");
    if (!sw) return;
    sw.addEventListener("click", function (e) {
      var b = e.target.closest(".lang-opt");
      if (!b) return;
      if (b.getAttribute("data-lang") === "kk") {
        toast("Қазақ нұсқасы — жақында. Версия на казахском скоро.");
        track("lang_kk_click", {});
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderZhkDetail();
    renderCatalog();
    bindHeroSearch();
    bindAiHelper();
    bindForms(document);
    bindScrollAnim();
    bindHeroSlider();
    bindStickyHeader();
    bindActiveNav();
    bindFavCount();
    bindLang();
    /* Делегированный трекинг исходящих контактов (без PII) */
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('a[href*="wa.me"]')) { track("whatsapp_click", { source: "link" }); return; }
      if (t.closest('a[href^="tel:"]')) { track("phone_click", {}); return; }
      if (t.closest('a[href*="t.me/"]')) { track("telegram_click", {}); }
    }, true);
  });
})();
