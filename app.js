(function () {
  var View = window.RyvoraView;
  if (!View) return;

  class GameScriptElement extends HTMLElement {
    static get observedAttributes() {
      return ['name', 'description', 'features', 'working', 'id', 'texticon'];
    }

    connectedCallback() {
      if (this._rendered) return;
      this._rendered = true;
      this.render();
    }

    attributeChangedCallback() {
      if (!this._rendered) return;
      this._rendered = false;
      this.connectedCallback();
    }

    render() {
      var working = !this.hasAttribute('working') || this.getAttribute('working') !== 'false';
      var features = (this.getAttribute('features') || '')
        .split(';')
        .map(function (f) { return f.trim(); })
        .filter(Boolean);
      this.innerHTML = View.gameCard({
        name: this.getAttribute('name'),
        description: this.getAttribute('description'),
        features: features,
        working: working,
        id: this.getAttribute('id'),
        texticon: this.getAttribute('texticon')
      });
    }
  }

  var navToggle = document.getElementById('navToggle');
  var navMenu = document.getElementById('navMenu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function () {
      var open = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var toast = document.getElementById('toast');
  var toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 2400);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        textarea.remove();
      }
    });
  }

  document.addEventListener('click', async function (event) {
    var btn = event.target.closest('[data-copy]');
    if (!btn) return;

    var source = document.getElementById(btn.dataset.copy);
    var text = source ? source.textContent.trim() : '';
    if (!text) return;

    try {
      await copyText(text);
    } catch (err) {
      return;
    }

    var label = btn.querySelector('span');
    var original = label ? label.textContent : '';
    btn.classList.add('copied');
    if (label) label.textContent = 'Copied!';
    showToast('Loadstring copied to clipboard.');

    setTimeout(function () {
      btn.classList.remove('copied');
      if (label) label.textContent = original;
    }, 1800);
  });

  if ('customElements' in window) {
    customElements.define('game-script', GameScriptElement);
  }
})();