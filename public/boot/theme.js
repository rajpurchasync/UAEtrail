(function () {
  var theme = 'light';
  try {
    var hasUser = !!localStorage.getItem('uaetrail_user');
    var pref = 'system';
    if (hasUser) {
      pref = JSON.parse(localStorage.getItem('uaetrail:display') || '{}').theme || 'system';
    } else {
      var guestRaw = sessionStorage.getItem('uaetrail:guest-display') || localStorage.getItem('uaetrail:guest-theme');
      if (guestRaw) {
        try {
          var parsed = JSON.parse(guestRaw);
          pref = parsed && parsed.theme ? parsed.theme : guestRaw;
        } catch (e2) {
          pref = guestRaw;
        }
      }
    }
    if (pref === 'dark') theme = 'dark';
    else if (pref === 'light') theme = 'light';
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
  } catch (e) {
    theme = 'light';
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
})();
