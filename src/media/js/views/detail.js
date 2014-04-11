define('views/detail',
       ['apps', 'cache', 'dom', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils', 'worker'],
       function(apps, Cache, $, log, notification, pages, settings, storage, templating, url, utils, worker) {

  var console = log('detail');
  var indexed = index();
  var doc;

  /* FIXME: this is just a hack to get the detail page working, we need to refactor this with search view. */
  function index() {
    var promise = new Promise(function (resolve) {
      worker.addEventListener('message', function (e) {
        if (e.data.type === 'indexed') {
          return resolve(e.data.data);
        }
      });
    });
    return promise;
  }

  /* FIXME: more hacking. maintaining a list of slugs->ids would probably be a good idea */
  function find(data, slug) {
    var key = Array.prototype.find.call(Object.keys(data), function(id_) {
      return data[id_].slug === slug;
    });
    return data[key];
  }

  function details() {
    templating.render('detail', {doc: doc}, function(res) {
      $('main').innerHTML = res;
      console.log('Done rendering detail template...');
    });
  }

  function init(params) {
    console.log('Initializing detail page...');
    if (document.body.dataset.page === 'detail') {
      // Bail if we've already rendered this page.
      return details();
    }
    indexed.then(function(data) {
      doc = find(data, params.slug);
      // FIXME: error if not found
      document.body.className = 'detail';
      document.body.dataset.page = 'detail'; // FIXME: probably will need a different 'page' for each app. Use slug ?
      details();
    });
  }

  return {
    init: init,
  };
});
