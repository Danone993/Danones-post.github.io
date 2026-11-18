/* Подключается на index.html одной строкой. Добавляет в существующую шапку кнопки «Меню» и «Войти/Кабинет». Остальное на странице не трогает. */
(function () {
  try { var tw = window.Telegram && Telegram.WebApp, sp = tw && tw.initDataUnsafe && tw.initDataUnsafe.start_param, pm = sp && /^prem_(10|31)$/.exec(sp); if (pm && location.pathname.indexOf("premium.html") < 0) { location.replace("premium.html?buy=" + pm[1]); return; } } catch (e) {}
  var CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
  function load(src, cb) { var s = document.createElement("script"); s.src = src; s.onload = cb; s.onerror = function () { console.warn("ms-nav: не загрузился " + src); }; document.head.appendChild(s); }
  var link = document.createElement("link"); link.rel = "stylesheet"; link.href = "ms.css"; document.head.appendChild(link);
  function start() {
    var box = document.querySelector(".header-actions"); if (!box) return;
    var menu = document.createElement("button");
    menu.type = "button"; menu.className = "theme-button"; menu.id = "ms-menu"; menu.setAttribute("aria-label", "Открыть меню разделов"); menu.setAttribute("aria-expanded", "false"); menu.textContent = "☰";
    var acc = document.createElement("a");
    var mq = window.matchMedia("(max-width:700px)");
    function paintAcc() {
      var small = mq.matches;
      acc.textContent = small ? (acc.dataset.i || "👤") : (acc.dataset.t || "Войти");
      acc.style.cssText = "text-decoration:none;display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;" +
        (small ? "width:42px;height:42px;min-height:42px;padding:0;flex:0 0 42px;font-size:19px;line-height:1;" : "");
    }
    function setAcc(t, i) { acc.dataset.t = t; acc.dataset.i = i; acc.setAttribute("aria-label", t); paintAcc(); }
    if (mq.addEventListener) mq.addEventListener("change", paintAcc);
    acc.className = "theme-button"; acc.id = "ms-acc"; acc.href = "login.html"; setAcc("Войти", "👤"); 
    box.insertBefore(acc, box.firstChild); box.insertBefore(menu, box.firstChild);
    menu.addEventListener("click", function () { menu.setAttribute("aria-expanded", "true"); MS.openDrawer(); });
    MS.ready.then(function (st) { if (st.user) { acc.href = "account.html"; setAcc(MS.isPremium() ? "★ Кабинет" : "Кабинет", MS.isPremium() ? "★" : "👤"); } });
  }
  function boot() { load(CDN, function () { load("ms.js", start); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
