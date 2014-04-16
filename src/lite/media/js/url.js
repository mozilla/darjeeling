define('url',
       ['routes_api', 'settings', 'utils'],
       function(routes_api, settings, utils) {
  return function(name, kwargs) {
    var url = settings.apiURL + routes_api[name];
    if (kwargs) {
      url = utils.urlparams(url, kwargs);
    }
    return url;
  };
});
