define('user',
       ['capabilities', 'log', 'storage', 'utils'],
       function(capabilities, log, storage, utils) {
  var console = log('user');

  var settings = {};
  var permissions = {};

  var persist = !capabilities.phantom;

  if (persist) {
    settings = JSON.parse(storage.getItem('settings') || '{}');
    saveSettings();
  }

  function clearSettings() {
    settings = {};
  }

  function getSetting(setting, default_) {
    setting = settings[setting];
    if (typeof setting === 'undefined') {
      return default_;
    }
    return setting;
  }

  function getSettings() {
    return settings;
  }

  function saveSettings() {
    if (persist) {
      console.log('Saving settings to localStorage');
      storage.setItem('settings', JSON.stringify(settings));
    } else {
      console.log('Settings not saved to localStorage');
    }
  }

  function updateSettings(data) {
    if (!data) {
      return;
    }
    console.log('Updating user settings', data);
    settings = utils.defaults(settings, data);
    saveSettings();
  }

  return {
    clearSettings: clearSettings,
    getSetting: getSetting,
    getSettings: getSettings,
    updateSettings: updateSettings
  };
});
