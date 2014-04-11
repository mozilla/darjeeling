define('views/detail',
       ['apps', 'cache', 'dom', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils', 'worker'],
       function(apps, Cache, $, log, notification, pages, settings, storage, templating, url, utils, worker) {

  var console = log('detail');

  function init() {
    console.log('Initializing detail page...');
    templating.render('detail', function(res) {
      console.log('Done rendering detail template...');
      $('main').innerHTML = res;
      document.body.className = 'detail';
      document.body.dataset.page = 'detail'; // FIXME: probably will need a different 'page' for each app. Use slug ?
    });
  }

  return {
    init: init,
  };
});
