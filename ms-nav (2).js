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
    function setAcc(t, i) { acc.innerHTML = '<span class="ms-acc-t">' + t + '</span><span class="ms-acc-i">' + i + "</span>"; acc.setAttribute("aria-label", t); }
    acc.className = "theme-button"; acc.id = "ms-acc"; acc.href = "login.html"; setAcc("Войти", "👤"); acc.style.textDecoration = "none"; acc.style.display = "inline-flex"; acc.style.alignItems = "center";
    box.insertBefore(acc, box.firstChild); box.insertBefore(menu, box.firstChild);
    menu.addEventListener("click", function () { menu.setAttribute("aria-expanded", "true"); MS.openDrawer(); });
    // Счётчик: бесплатные (посты главной + бесплатные из базы) и Premium
    var posts = document.getElementById("posts");
    if (posts) {
      var box2 = document.createElement("div"); box2.className = "container";
      box2.innerHTML = '<a class="ms-counter" href="premium.html"><span id="msFree">…</span><span id="msPrem">…</span></a>';
      posts.parentNode.insertBefore(box2, posts);
      var staticCount = document.querySelectorAll("#posts article.post").length;
      var q = function (access, onlyNative) { var r = MS.sb.from("articles").select("id", { count: "exact", head: true }).eq("status", "published").eq("access", access); if (onlyNative) r = r.is("source_url", null); return r; };
      Promise.all([q("free", true), q("premium", false)]).then(function (res) {
        var free = staticCount + (res[0].count || 0), prem = res[1].count || 0;
        document.getElementById("msFree").textContent = "Бесплатных постов: " + free;
        document.getElementById("msPrem").textContent = "★ Premium-постов: " + prem;
      }).catch(function () { box2.remove(); });
    }
    MS.ready.then(function (st) { if (st.user) { acc.href = "account.html"; setAcc(MS.isPremium() ? "★ Кабинет" : "Кабинет", MS.isPremium() ? "★" : "👤"); } });
  }
  function boot() { load(CDN, function () { load("ms.js", start); }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
