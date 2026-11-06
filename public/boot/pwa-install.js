(function () {
  window.__uaeTrailDeferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (event) {
    window.__uaeTrailDeferredInstall = event;
    window.dispatchEvent(new Event('uaetrail-install-available'));
  });
  window.addEventListener('appinstalled', function () {
    window.__uaeTrailDeferredInstall = null;
    window.dispatchEvent(new Event('uaetrail-app-installed'));
  });
})();
