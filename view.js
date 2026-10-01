(function () {
  var LOADER_URL = 'https://ryvora.github.io/Assets/Loader.luau';
  var DISCORD_URL = 'https://discord.gg/HRRBRpdKrj';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function loadstring(id) {
    return 'loadstring(game:HttpGet("' + LOADER_URL + '", true))()("' + id + '")';
  }

  function icon(name, className) {
    return window.RyvoraIcons.icon(name, className);
  }

  function featureList(items) {
    if (!items || !items.length) return '';
    return (
      '<ul class="feats">' +
      items
        .map(function (f) {
          return '<li class="feat">' + esc(f) + '</li>';
        })
        .join('') +
      '</ul>'
    );
  }

  function gameCard(props) {
    var rawName = props.name || 'Ryvora Script';
    var name = esc(rawName);
    var description = esc(props.description);
    var id = esc(props.id || '').trim();
    var texticon = esc(props.texticon || rawName.charAt(0).toUpperCase());
    var working = props.working !== false;
    var status = working
      ? '<span class="game-status"><span class="status-dot"></span>Working</span>'
      : '<span class="game-status scheduled"><span class="status-dot"></span>Scheduled</span>';

    var body;
    if (working && id) {
      var lsId = 'ls-' + id;
      body =
        '<div class="game-loader">' +
        '<span class="game-loader-label">Loader tag</span>' +
        '<div class="game-loader-row">' +
        '<span class="prompt" aria-hidden="true">$</span>' +
        '<code data-loadstring id="' + lsId + '">' + esc(loadstring(id)) + '</code>' +
        '<button class="btn-copy" type="button" data-copy="' + lsId + '" aria-label="Copy ' + name + ' loadstring">' +
        icon('copy') +
        '<span>Copy</span>' +
        '</button>' +
        '</div>' +
        '</div>';
    } else {
      body =
        '<div class="game-empty">' +
        '<p>No loader tag yet. This script is scheduled and its release is announced on Discord.</p>' +
        '<a class="link" href="' + DISCORD_URL + '" target="_blank" rel="noopener">Watch for the release ' + icon('external') + '</a>' +
        '</div>';
    }

    return (
      '<article class="game-panel">' +
      '<div class="game-head">' +
      '<div class="game-tag" aria-hidden="true">' + texticon + '</div>' +
      '<div class="game-title">' +
      '<h3>' + name + '</h3>' +
      status +
      '</div>' +
      '</div>' +
      '<p class="game-desc">' + description + '</p>' +
      featureList(props.features) +
      body +
      '</article>'
    );
  }

  function wikiSidebar(pages, current) {
    var currentName = String(current || 'Home');
    return pages
      .map(function (page) {
        var active = page.toLowerCase() === currentName.toLowerCase();
        return (
          '<li><a href="?page=' + encodeURIComponent(page) + '" data-page="' + encodeURIComponent(page) +
          '"' + (active ? ' class="active" aria-current="page"' : '') + '>' +
          esc(page === 'Home' ? 'Home' : page) +
          '</a></li>'
        );
      })
      .join('');
  }

  function wikiSkeleton() {
    return (
      '<div class="skeleton" role="status" aria-label="Loading wiki page">' +
      '<span class="sk sk-title w-55"></span>' +
      '<span class="sk sk-line w-90"></span>' +
      '<span class="sk sk-line w-70"></span>' +
      '<span class="sk sk-line w-85"></span>' +
      '<span class="sk sk-line w-60"></span>' +
      '<span class="sk sk-line w-75"></span>' +
      '</div>'
    );
  }

  function wikiError(page, message, webUrl) {
    return (
      '<div class="foss-state is-error">' +
      '<p class="foss-state-title">Could not load the wiki page <code>' + esc(page) + '</code>.</p>' +
      '<p class="foss-state-detail">' + esc(message) + '</p>' +
      '<div class="foss-state-actions">' +
      '<button class="btn btn-primary" type="button" data-retry="' + esc(page) + '">' + icon('refresh') + 'Retry</button>' +
      '<a class="btn btn-ghost" href="' + webUrl + '" target="_blank" rel="noopener">' + icon('external') + 'Open on GitHub</a>' +
      '</div>' +
      '</div>'
    );
  }

  function wikiEmpty(page, webUrl) {
    return (
      '<div class="foss-state is-empty">' +
      '<p class="foss-state-title">The wiki page <code>' + esc(page) + '</code> does not exist yet.</p>' +
      '<p class="foss-state-detail">Only the pages listed in the sidebar are published. If this page should exist, ask about it on Discord.</p>' +
      '<div class="foss-state-actions">' +
      '<a class="btn btn-ghost" href="' + webUrl + '" target="_blank" rel="noopener">' + icon('external') + 'Open on GitHub</a>' +
      '</div>' +
      '</div>'
    );
  }

  window.RyvoraView = {
    esc: esc,
    loadstring: loadstring,
    icon: icon,
    featureList: featureList,
    gameCard: gameCard,
    wikiSidebar: wikiSidebar,
    wikiSkeleton: wikiSkeleton,
    wikiError: wikiError,
    wikiEmpty: wikiEmpty
  };
})();