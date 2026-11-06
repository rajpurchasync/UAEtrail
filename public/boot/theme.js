(function () {
  var theme = 'light';
  try {
    var hasUser = !!localStorage.getItem('uaetrail_user');
    var pref = hasUser
      ? (JSON.parse(localStorage.getItem('uaetrail:display') || '{}').theme || 'system')
      : (localStorage.getItem('uaetrail:guest-theme') || 'system');
    if (pref === 'dark') theme = 'dark';
    else if (pref === 'light') theme = 'light';
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch (e) {
    theme = 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
