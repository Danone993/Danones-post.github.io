/* Подключается на index.html одной строкой. Добавляет в существующую шапку кнопки «Меню» и «Войти/Кабинет». Остальное на странице не трогает. */
(function () {
  var CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
  function load(src, cb) { var s = document.createElement("script"); s.src = src; s.onload = cb; s.onerror = function () { console.warn("ms-nav: не загрузился " + src); }; document.head.appendChild(s); }
  var link = document.createElement("link"); link.rel = "stylesheet"; link.href = "ms.css"; document.head.appendChild(link);
  function start() {
    var box = document.querySelector(".header-actions"); if (!box) return;
    var menu = document.createElement("button");
    menu.type = "button"; menu.className = "theme-button"; menu.id = "ms-menu"; menu.setAttribute("aria-label", "Открыть меню разделов"); menu.setAttribute("aria-expanded", "false"); menu.textContent = "☰";
    var acc = document.createElement("a");
    acc.className = "theme-button"; acc.id = "ms-acc"; acc.href = "login.html"; acc.textContent = "Войти"; acc.style.textDecoration = "none"; acc.style.display = "inline-flex"; acc.style.alignItems = "center";
    box.insertBefore(acc, box.firstChild); box.insertBefore(menu, box.firstChild);
    menu.addEventListener("click", function () { menu.setAttribute("aria-expanded", "true"); MS.openDrawer(); });
    MS.ready.then(function (st) { if (st.user) { acc.href = "account.html"; acc.textContent = MS.isPremium() ? "★ Кабинет" : "Кабинет"; } });
  }
  function boot() { load(CDN, function () { load("ms.js", start); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
