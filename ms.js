/* Молдавская прослушка — ядро: Supabase-клиент, сессия, Premium, избранное, меню. Требует supabase-js (UMD) до подключения. */
(function () {
  "use strict";
  const SB_URL = "https://zfjkwdmfhbyohdmqogvp.supabase.co";
  const SB_KEY = "sb_publishable_tMdL5NeAF9g2ikjt_LFNSg_wzvDm37e"; // публичный ключ, для браузера
  const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  const BASE = new URL("./", location.href).href;
  const st = { user: null, session: null, premiumUntil: null, favs: new Set() };

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = d => d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" }) : "";
  const isPremium = () => !!st.premiumUntil && new Date(st.premiumUntil) > new Date();
  const ICON_BM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';

  async function refresh() {
    const { data: { session } } = await sb.auth.getSession();
    st.session = session; st.user = session ? session.user : null; st.premiumUntil = null; st.favs = new Set();
    if (st.user) {
      const [s, f] = await Promise.all([
        sb.from("subscriptions").select("premium_until").eq("user_id", st.user.id).maybeSingle(),
        sb.from("favorites").select("article_id").eq("user_id", st.user.id),
      ]);
      st.premiumUntil = s.data ? s.data.premium_until : null;
      st.favs = new Set((f.data || []).map(r => r.article_id));
    }
    return st;
  }

  let catPromise = null;
  const categories = () => catPromise || (catPromise = sb.from("categories").select("id,slug,name,description").order("sort_order").order("name").then(r => r.data || []));

  function toast(msg) {
    let t = document.querySelector(".ms-toast");
    if (!t) { t = document.createElement("div"); t.className = "ms-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function safeNext() {
    const n = new URLSearchParams(location.search).get("next") || "";
    return /^[a-z0-9_\-]+\.html(\?[a-z0-9_\-=&%.]*)?(#[a-z0-9_\-]*)?$/i.test(n) ? n : "";
  }
  const loginUrl = () => "login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() + location.search);

  function bookmarkBtn(id) {
    const on = st.favs.has(id);
    return `<button type="button" class="ms-bm${on ? " on" : ""}" data-fav="${esc(id)}" aria-pressed="${on}" aria-label="${on ? "Убрать из избранного" : "Добавить в избранное"}">${ICON_BM}</button>`;
  }

  function cardHTML(a) {
    const cat = a.categories || {};
    const cover = a.cover_url ? `<img class="ms-cover" loading="lazy" src="${esc(a.cover_url)}" alt="${esc(a.cover_alt || "")}">` : '<div class="ms-cover" role="img" aria-label=""></div>';
    return `<article class="ms-card">${bookmarkBtn(a.id)}${cover}<div class="ms-card-b">
      <div><span class="ms-tag">${esc(cat.name || "")}</span></div>
      <h3><a href="article.html?a=${encodeURIComponent(a.slug)}">${esc(a.title)}</a></h3>
      ${a.subtitle ? `<p>${esc(a.subtitle)}</p>` : ""}
      <div class="ms-meta"><span>${esc(fmtDate(a.published_at))}</span>
      <span class="ms-tag${a.access === "premium" ? " prem" : ""}">${a.access === "premium" ? "★ Premium" : "Бесплатно"}</span></div></div></article>`;
  }

  async function toggleFav(btn) {
    if (!st.user) { location.href = loginUrl(); return; }
    const id = btn.dataset.fav, was = st.favs.has(id);
    btn.disabled = true;
    const q = was ? sb.from("favorites").delete().eq("article_id", id).eq("user_id", st.user.id)
                  : sb.from("favorites").insert({ article_id: id, user_id: st.user.id });
    const { error } = await q;
    btn.disabled = false;
    if (error) { toast("Не удалось сохранить. Попробуйте ещё раз."); return; }
    if (was) st.favs.delete(id); else st.favs.add(id);
    document.querySelectorAll(`[data-fav="${CSS.escape(id)}"]`).forEach(b => {
      b.classList.toggle("on", !was); b.setAttribute("aria-pressed", String(!was));
      b.setAttribute("aria-label", was ? "Добавить в избранное" : "Убрать из избранного");
    });
    toast(was ? "Убрано из избранного" : "Добавлено в избранное");
    document.dispatchEvent(new CustomEvent("ms:fav", { detail: { id, on: !was } }));
  }
  document.addEventListener("click", e => { const b = e.target.closest("[data-fav]"); if (b) { e.preventDefault(); toggleFav(b); } });

  /* ---- Меню-гамбургер ---- */
  let drawerBuilt = false;
  async function buildDrawer() {
    if (drawerBuilt) return; drawerBuilt = true;
    const cats = await categories();
    const wrap = document.createElement("div");
    wrap.innerHTML = `<div class="ms-drawer-bg" data-ms-close></div>
      <nav class="ms-drawer" aria-label="Разделы" aria-hidden="true">
        <div class="ms-row" style="justify-content:space-between"><b style="font-size:18px">Разделы</b><button class="ms-ibtn" data-ms-close aria-label="Закрыть">✕</button></div>
        <h4>Темы</h4>${cats.map(c => `<a href="${BASE}category.html?c=${encodeURIComponent(c.slug)}">${esc(c.name)}</a>`).join("") || '<span style="color:var(--ms-muted)">Скоро здесь появятся разделы</span>'}
        <h4>Навигация</h4>
        <a href="${BASE}index.html">Главная</a><a href="${BASE}category.html">Все публикации</a><a href="${BASE}favorites.html">Избранное</a><a href="${BASE}premium.html">Premium</a><a href="${BASE}account.html">Личный кабинет</a>
      </nav>`;
    document.body.append(...wrap.children);
    document.querySelectorAll("[data-ms-close]").forEach(n => n.addEventListener("click", closeDrawer));
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });
  }
  async function openDrawer() { await buildDrawer(); document.body.classList.add("ms-open"); const d = document.querySelector(".ms-drawer"); d.setAttribute("aria-hidden", "false"); }
  function closeDrawer() { document.body.classList.remove("ms-open"); const d = document.querySelector(".ms-drawer"); if (d) d.setAttribute("aria-hidden", "true"); const m = document.getElementById("ms-menu"); if (m) m.setAttribute("aria-expanded", "false"); }

  function applyTheme(dark) { document.body.classList.toggle("dark", dark); const t = document.getElementById("ms-theme"); if (t) t.textContent = dark ? "☀️" : "🌙"; }
  function initTheme() {
    let dark; try { dark = localStorage.getItem("ms-theme"); } catch (e) {}
    applyTheme(dark ? dark === "dark" : matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function accountLabel() { return st.user ? (isPremium() ? "★ Кабинет" : "Кабинет") : "Войти"; }
  function header() {
    document.body.classList.add("ms-page");
    initTheme();
    const el = document.getElementById("ms-header"); if (!el) return;
    el.className = "ms-top";
    el.innerHTML = `<div class="ms-top-in"><button class="ms-ibtn" id="ms-menu" aria-label="Открыть меню" aria-expanded="false">☰</button>
      <a class="ms-brand" href="index.html">Молдавская <span>прослушка</span></a>
      <form class="ms-search" action="category.html" role="search"><input name="q" type="search" placeholder="Поиск" aria-label="Поиск"></form>
      <button class="ms-ibtn" id="ms-theme" aria-label="Переключить тему">🌙</button>
      <a class="ms-btn" id="ms-acc" href="${st.user ? "account.html" : "login.html"}">${accountLabel()}</a></div>`;
    document.getElementById("ms-menu").addEventListener("click", e => { e.currentTarget.setAttribute("aria-expanded", "true"); openDrawer(); });
    document.getElementById("ms-theme").addEventListener("click", () => {
      const d = !document.body.classList.contains("dark"); applyTheme(d); try { localStorage.setItem("ms-theme", d ? "dark" : "light"); } catch (e) {}
    });
    applyTheme(document.body.classList.contains("dark"));
  }

  async function fetchArticle(slug) {
    const token = st.session ? st.session.access_token : SB_KEY;
    const r = await fetch(`${SB_URL}/functions/v1/get-article?slug=${encodeURIComponent(slug)}`, { headers: { apikey: SB_KEY, Authorization: "Bearer " + token } });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) { const e = new Error(data.error || "Ошибка " + r.status); e.status = r.status; throw e; }
    return data;
  }
  async function activatePromo(code) {
    const r = await fetch(`${SB_URL}/functions/v1/activate-promo`, { method: "POST", headers: { apikey: SB_KEY, Authorization: "Bearer " + st.session.access_token, "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) throw new Error(data.error || "Ошибка " + r.status);
    return data;
  }

  sb.auth.onAuthStateChange((ev) => { if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "TOKEN_REFRESHED") setTimeout(async () => { await refresh(); const a = document.getElementById("ms-acc"); if (a) { a.textContent = accountLabel(); a.href = st.user ? "account.html" : "login.html"; } }, 0); });

  window.MS = { sb, st, BASE, esc, fmtDate, isPremium, refresh, categories, toast, safeNext, loginUrl, cardHTML, bookmarkBtn, header, openDrawer, closeDrawer, fetchArticle, activatePromo, ICON_BM,
    ready: refresh() };
})();
