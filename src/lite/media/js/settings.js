define('settings', ['settings_local', 'utils'], function(settings_local, utils) {
  var settingsBase = JSON.parse(document.body.getAttribute('data-settings') || '{}');
  settingsBase = utils.defaults(settingsBase, settings_local);

  var settings = utils.defaults(settingsBase, {
    appName: 'marketplace',
    apiURL: window.location.protocol + '//' + window.location.host,  // No trailing slash, please./

    // The string to suffix page titles with. Used by `pages.js`.
    titleSuffix: 'Firefox Marketplace',

    // How often (in milliseconds) to check if we have queued apps to install
    // when we return online.
    offlineInterval: 2000,

    // Number of apps featured on the homepage.
    numberFeatured: 6
  });

  // The version number for `localStorage` data. Bump when the schema for
  // storing data in `localStorage` changes.
  settings.storageVersion = '0::' + settings.appName;

  return settings;
});
