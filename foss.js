(function () {
  var View = window.RyvoraView;

  var WIKI_REPO = 'Ryvora/FOSS';
  var WIKI_RAW_BASE = 'https://raw.githubusercontent.com/wiki/' + WIKI_REPO;
  var WIKI_WEB_BASE = 'https://github.com/' + WIKI_REPO + '/wiki';

  var KNOWN_PAGES = ['Home', 'LocalPlayer'];

  var cache = Object.create(null);
  var currentPage = 'Home';

  var listEl = document.getElementById('wikiList');
  var stateEl = document.getElementById('wikiState');
  var bodyEl = document.getElementById('wikiBody');

  function fallbackSidebar(pages, current) {
    return pages
      .map(function (page) {
        var active = page.toLowerCase() === current.toLowerCase();
        return (
          '<li><a href="?page=' + encodeURIComponent(page) + '"' +
          (active ? ' class="active" aria-current="page"' : '') + '>' +
          (page === 'Home' ? 'Home' : page) +
          '</a></li>'
        );
      })
      .join('');
  }

  function setActiveLink(page) {
    listEl.querySelectorAll('a[data-page]').forEach(function (a) {
      var active = decodeURIComponent(a.dataset.page).toLowerCase() === page.toLowerCase();
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  function buildSidebar() {
    if (listEl) {
      listEl.innerHTML = (View && View.wikiSidebar)
        ? View.wikiSidebar(KNOWN_PAGES, currentPage)
        : fallbackSidebar(KNOWN_PAGES, currentPage);
    }
  }

  function showLoading() {
    stateEl.innerHTML = (View && View.wikiSkeleton)
      ? View.wikiSkeleton()
      : '<div class="skeleton" role="status" aria-label="Loading wiki page"><span class="sk sk-line w-70"></span><span class="sk sk-line w-90"></span><span class="sk sk-line w-60"></span></div>';
    stateEl.hidden = false;
    bodyEl.hidden = true;
  }

  function showState(html) {
    stateEl.innerHTML = html;
    stateEl.hidden = false;
    bodyEl.hidden = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderMarkdown(markdown) {
    if (!window.marked || !window.DOMPurify) {
      showState(
        '<div class="foss-state is-error">' +
        '<p class="foss-state-title">The markdown renderer failed to load.</p>' +
        '<p class="foss-state-detail">The page works best online. Check the console for network errors and reload.</p>' +
        '</div>'
      );
      return;
    }

    var withLinks = markdown.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, function (match, page, label) {
      var safe = encodeURIComponent(page.trim());
      var text = (label || page).trim();
      return '[' + text + '](?page=' + safe + ')';
    });

    var rawHtml = window.marked.parse(withLinks);
    var safeHtml = window.DOMPurify.sanitize(rawHtml);

    bodyEl.innerHTML = safeHtml;
    bodyEl.querySelectorAll('pre code').forEach(function (block) {
      if (window.hljs) window.hljs.highlightElement(block);
    });

    stateEl.hidden = true;
    bodyEl.hidden = false;

    var title = currentPage === 'Home' ? 'FOSS Docs · Ryvora Scripts' : currentPage + ' · FOSS Docs · Ryvora Scripts';
    document.title = title;
  }

  function pageName(page) {
    return page === 'Home' ? 'Home' : page;
  }

  function loadPage(page) {
    currentPage = page;
    setActiveLink(page);
    var name = pageName(page);

    if (cache[name]) {
      renderMarkdown(cache[name]);
      return;
    }

    showLoading();

    fetch(WIKI_RAW_BASE + '/' + encodeURIComponent(name) + '.md')
      .then(function (res) {
        if (res.status === 404) {
          showState((View && View.wikiEmpty)
            ? View.wikiEmpty(name, WIKI_WEB_BASE + '/' + encodeURIComponent(name))
            : '<div class="foss-state">' +
              '<p class="foss-state-title">The wiki page <code>' + name.replace(/</g, '&lt;') + '</code> does not exist yet.</p>' +
              '<div class="foss-state-actions">' +
              '<a class="btn btn-ghost" href="' + WIKI_WEB_BASE + '/' + encodeURIComponent(name) + '" target="_blank" rel="noopener">Open on GitHub</a>' +
              '</div></div>');
          throw null;
        }
        if (!res.ok) throw new Error('GitHub returned HTTP ' + res.status);
        return res.text();
      })
      .then(function (markdown) {
        if (!markdown || !markdown.trim()) {
          showState((View && View.wikiEmpty)
            ? View.wikiEmpty(name, WIKI_WEB_BASE + '/' + encodeURIComponent(name))
            : '<div class="foss-state is-empty"><p class="foss-state-title">This wiki page has no content yet.</p></div>');
          return;
        }
        cache[name] = markdown;
        renderMarkdown(markdown);
      })
      .catch(function (err) {
        if (err) {
          showState((View && View.wikiError)
            ? View.wikiError(name, err.message, WIKI_WEB_BASE + '/' + encodeURIComponent(name))
            : '<div class="foss-state is-error">' +
              '<p class="foss-state-title">Could not load the wiki page <code>' + name.replace(/</g, '&lt;') + '</code>.</p>' +
              '<p class="foss-state-detail">' + err.message.replace(/</g, '&lt;') + '</p>' +
              '<div class="foss-state-actions">' +
              '<button class="btn btn-primary" type="button" data-retry="' + name + '">Retry</button>' +
              '<a class="btn btn-ghost" href="' + WIKI_WEB_BASE + '/' + encodeURIComponent(name) + '" target="_blank" rel="noopener">Open on GitHub</a>' +
              '</div></div>');
        }
      });
  }

  function navigate(page) {
    var params = new URLSearchParams(location.search);
    params.set('page', pageName(page));
    history.pushState({ page: page }, '', location.pathname + '?' + params.toString());
    loadPage(page);
  }

  listEl.addEventListener('click', function (event) {
    var link = event.target.closest('a[data-page]');
    if (!link) return;
    event.preventDefault();
    navigate(link.dataset.page);
  });

  bodyEl.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="?page="]');
    if (!link) return;
    event.preventDefault();
    var page = new URL(link.getAttribute('href'), location.href).searchParams.get('page') || 'Home';
    navigate(page);
  });

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-retry]');
    if (!btn) return;
    loadPage(btn.dataset.retry);
  });

  window.addEventListener('popstate', function (event) {
    if (event.state && event.state.page) {
      loadPage(event.state.page);
    }
  });

  var requested = new URLSearchParams(location.search).get('page');
  buildSidebar();
  loadPage(requested || 'Home');
})();