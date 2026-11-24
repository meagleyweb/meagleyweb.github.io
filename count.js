/* Private visitor counter: no cookies. Only runs on meagley.tech, and skips devices that ask not to be tracked or that opened the stats page. */
(function () {
  function off() {
    try { if (localStorage.getItem('mwd-nocount')) return true; } catch (e) { }
    return location.hostname !== 'meagley.tech' || navigator.globalPrivacyControl || navigator.doNotTrack === '1' || navigator.webdriver;
  }
  function send(d) {
    if (off()) return;
    try { navigator.sendBeacon('/api/hit', new Blob([JSON.stringify(d)], { type: 'text/plain' })); } catch (e) { }
  }
  window.mwdCount = function (name) { send({ e: name }); };
  var r = '';
  try { r = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { }
  if (/[?&](gclid|gbraid|wbraid)=/.test(location.search)) r = 'Google Ads';
  else if (/[?&]fbclid=/.test(location.search) && !r) r = 'facebook.com';
  if (r === location.hostname) r = '';
  send({ p: location.pathname, r: r });
})();
