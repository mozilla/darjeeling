define('pages',
       ['settings', 'templating', 'utils'],
       function(settings, templating, utils) {
  var titles = {
    '/': templating._l('Mobile sites', 'titleDefault'),
    '/search': templating._l('Search', 'titleSearch'),
    '/submit': templating._l('Submit', 'titleSubmit')
  };

  function getPath(url) {
    return utils.parseLink(url).pathname;
  }

  function getTitle(pathname) {
    return (titles[pathname] || titles['/']) + ' | ' + settings.titleSuffix;
  }

  return {
    getTitle: getTitle,
    getPath: getPath,
    routes: routes,
    titles: titles
  };
});
