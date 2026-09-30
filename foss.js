/* ============================================================
   Ryvora FOSS — live wiki documentation
   Fetches markdown from the GitHub wiki and renders it with
   marked + DOMPurify + highlight.js. Works fully client-side.
   ============================================================ */

const WIKI_REPO = 'Ryvora/FOSS';
const WIKI_RAW_BASE = `https://raw.githubusercontent.com/wiki/${WIKI_REPO}`;
const WIKI_WEB_BASE = `https://github.com/${WIKI_REPO}/wiki`;

const KNOWN_PAGES = ['Home', 'LocalPlayer'];

const cache = Object.create(null);
let currentPage = 'Home';

const listEl = document.getElementById('wikiList');
const loadingEl = document.getElementById('wikiLoading');
const errorEl = document.getElementById('wikiError');
const bodyEl = document.getElementById('wikiBody');

function setActiveLink(page) {
  listEl.querySelectorAll('a').forEach((a) => {
    const active = a.dataset.page.toLowerCase() === page.toLowerCase();
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function buildSidebar() {
  listEl.innerHTML = KNOWN_PAGES.map(
    (name) =>
      `<li><a href="?page=${encodeURIComponent(name)}" data-page="${encodeURIComponent(name)}">${name === 'Home' ? 'Home' : name}</a></li>`
  ).join('');
  setActiveLink(currentPage);
}

function showLoading() {
  loadingEl.hidden = false;
  errorEl.hidden = true;
  bodyEl.hidden = true;
}

function renderMarkdown(markdown) {
  const withLinks = markdown.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (match, page, label) => {
      const safe = encodeURIComponent(page.trim());
      const text = (label || page).trim();
      return `[${text}](?page=${safe})`;
    }
  );

  const rawHtml = marked.parse(withLinks);
  const safeHtml = DOMPurify.sanitize(rawHtml);

  bodyEl.innerHTML = safeHtml;
  bodyEl.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));

  loadingEl.hidden = true;
  errorEl.hidden = true;
  bodyEl.hidden = false;
}

async function loadPage(page) {
  currentPage = page;
  setActiveLink(page);
  const name = page === 'Home' ? 'Home' : page;

  if (cache[name]) {
    renderMarkdown(cache[name]);
    return;
  }

  showLoading();

  try {
    const res = await fetch(`${WIKI_RAW_BASE}/${encodeURIComponent(name)}.md`);
    if (!res.ok) throw new Error(`GitHub returned HTTP ${res.status}`);
    const markdown = await res.text();
    cache[name] = markdown;
    renderMarkdown(markdown);
  } catch (err) {
    const link = `${WIKI_WEB_BASE}/${encodeURIComponent(name)}`;
    loadingEl.hidden = true;
    bodyEl.hidden = true;
    errorEl.hidden = false;
    errorEl.innerHTML =
      `<p>Couldn't load the wiki page <code>${name}</code>.</p>` +
      `<p class="foss-error-detail">${err.message}</p>` +
      `<a class="btn btn-primary" href="${link}" target="_blank" rel="noopener">Open it on GitHub</a>`;
  }
}

function navigate(page) {
  const params = new URLSearchParams(location.search);
  params.set('page', page === 'Home' ? 'Home' : page);
  history.pushState({ page }, '', `${location.pathname}?${params.toString()}`);
  loadPage(page);
}

listEl.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-page]');
  if (!link) return;
  event.preventDefault();
  navigate(link.dataset.page);
});

bodyEl.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="?page="]');
  if (!link) return;
  event.preventDefault();
  const page = new URL(link.getAttribute('href'), location.href).searchParams.get('page') || 'Home';
  navigate(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.page) {
    loadPage(event.state.page);
  }
});

/* Boot: honour ?page=... from the URL, otherwise default to Home. */
const requested = new URLSearchParams(location.search).get('page');
buildSidebar();
loadPage(requested || 'Home');