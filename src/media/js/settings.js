define('settings', ['settings_local', 'utils'], function(settings_local, utils) {
  var settingsBase = JSON.parse(document.body.getAttribute('data-settings') || '{}');
  settingsBase = utils.defaults(settingsBase, settings_local);

  var settings = utils.defaults(settingsBase, {
    appName: 'marketplace',
    apiURL: 'http://' + window.location.host,  // No trailing slash, please./

    // The string to suffix page titles with. Used by `pages.js`.
    titleSuffix: 'Firefox Marketplace'
  });

  // The version number for `localStorage` data. Bump when the schema for
  // storing data in `localStorage` changes.
  settings.storageVersion = '0::' + settings.appName;

  return settings;
});
