define('pages',
       ['settings', 'templating', 'utils'],
       function(settings, templating, utils) {
  var titles = {
    '/search': templating._l('Search', 'search')
  };

  function getPath(url) {
    return utils.parseLink(url).pathname;
  }

  function getTitle(pathname) {
    return (pathname in titles ? titles[pathname] + ' | ' : '') + settings.titleSuffix;
  }

  return {
    getTitle: getTitle,
    getPath: getPath,
    routes: window.routes,
    titles: titles
  };
});
