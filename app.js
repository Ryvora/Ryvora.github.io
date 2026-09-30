/* ============================================================
   Ryvora Scripts — shared site JS
   ============================================================ */

const LOADER_URL = 'https://ryvora.github.io/Assets/Loader.luau';

function buildLoadstring(id) {
  return `loadstring(game:HttpGet("${LOADER_URL}", true))()("${id}")`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- <game-script> custom element ----------
   Usage:
     <game-script
       name="Murder Mystery 2"
       description="..."
       features="Silent Aim;ESP;In-game UI;Unique Features"
       working="true"
       id="mm2"
       texticon="MM2"></game-script>
   The loadstring is generated from the `id` attribute.
------------------------------------------------------ */

class GameScriptElement extends HTMLElement {
  connectedCallback() {
    if (this._rendered) return;
    this._rendered = true;
    this.render();
  }

  static get observedAttributes() {
    return ['name', 'description', 'features', 'working', 'id', 'texticon'];
  }

  attributeChangedCallback() {
    if (this._rendered) {
      this._rendered = false;
      this.connectedCallback();
    }
  }

  render() {
    const name = escapeHtml(this.getAttribute('name') || 'Ryvora Script');
    const description = escapeHtml(this.getAttribute('description') || '');
    const id = escapeHtml(this.getAttribute('id') || '').trim();
    const texticon = escapeHtml(this.getAttribute('texticon') || name.charAt(0));
    const working = !this.hasAttribute('working') || this.getAttribute('working') !== 'false';
    const features = (this.getAttribute('features') || '')
      .split(';')
      .map((f) => f.trim())
      .filter(Boolean);

    const copySvg =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

    const featsHtml = features.length
      ? `<ul class="feats">${features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul>`
      : '<ul class="feats"><li>Unique Features</li></ul>';

    const badge = working ? '<span class="game-badge">Featured</span>' : '<span class="game-badge soon">Coming Soon</span>';

    let footerHtml;
    if (working) {
      footerHtml = `
        <div class="load-row">
          <code id="ls-${id}" data-loadstring>${escapeHtml(buildLoadstring(id))}</code>
          <button class="btn-copy" type="button" data-copy="ls-${id}" aria-label="Copy ${escapeHtml(name)} loadstring">
            ${copySvg}
            <span>Copy</span>
          </button>
        </div>`;
    } else {
      footerHtml =
        '<p class="game-soon">This script isn\'t available yet — follow our Discord for release updates.</p>';
    }

    this.innerHTML = `
      <div class="game-card${working ? '' : ' game-card-soon'}">
        <div class="game-head">
          <div class="game-logo" aria-hidden="true">${texticon}</div>
          <div>
            <h3>${name} ${badge}</h3>
            <p>${description}</p>
          </div>
        </div>
        ${featsHtml}
        ${footerHtml}
      </div>`;
  }
}

if ('customElements' in window) {
  customElements.define('game-script', GameScriptElement);
}

/* ---------- Mobile nav ---------- */

const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Copy loadstrings (delegated, so dynamic cards work too) ---------- */

const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

document.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-copy]');
  if (!btn) return;

  const source = document.getElementById(btn.dataset.copy);
  const text = source?.textContent.trim() ?? '';
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }

  const label = btn.querySelector('span');
  const original = label.textContent;
  btn.classList.add('copied');
  label.textContent = 'Copied!';
  showToast('Loadstring copied to clipboard.');

  setTimeout(() => {
    btn.classList.remove('copied');
    label.textContent = original;
  }, 1800);
});