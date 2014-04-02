define('views/search',
       ['apps', 'cache', 'dom', 'log', 'notification', 'pages', 'templating', 'url', 'utils', 'worker'],
       function(apps, cache, $, log, notification, pages, templating, url, utils, worker) {
  cache = new cache();
  var console = log('search');
  var docs = {};
  var GET;
  var gettext = templating._l;
  var indexed = index();
  var q;
  var previousQuery = null;
  var previousResults = null;
  var timeStart;

  function index() {
    var promise = new Promise(function(resolve, reject) {
      worker.addEventListener('message', function(e) {
        switch (e.data.type) {
          case 'indexed':
            return resolve(e.data.data);
          case 'results':
            return renderResults(e.data.data);
        }
      });
      worker.postMessage({
        type: 'index',
        data: {
          min: !!document.body.dataset.prod,
          url: url('search.docs'),
          fields: {
            name_search: {boost: 25},
            app_url: {boost: 25},
            author: {boost: 20},
            slug: {boost: 20},
            description_search: {boost: 15},
            keywords: {boost: 14},
            category: {boost: 10}
          },
          ref: '_id'
        }
      });
    });
    return promise;
  }

  function search() {
    timeStart = performance.now();

    var query = q.value || '';

    if (previousQuery === query) {
      // Bail if the query hasn't changed.
      return;
    }
    previousQuery = query;

    console.log('Queueing search for "' + query + '"');

    if (cache.exists(query)) {
      console.log('Searching cache for "' + query + '"');
      var results = cache.get(query);
      results.timeStart = timeStart;
      renderResults(results);
    } else {
      worker.postMessage({
        type: 'search',
        data: {
          query: query,
          timeStart: timeStart
        }
      });
    }
  }

  function reset() {
    if (!q) {
      q = $('input[name=q]');
    }
    q.value = previousQuery = previousResults = null;
  }

  function renderResults(data) {
    console.log('Rendering results');

    data.timing = performance.now() - data.timeStart;

    q = $('input[name=q]');

    // Update location bar based on search term.
    GET = utils.parseQueryString();
    GET.q = q.value || '';
    var serialized = utils.serialize(GET);
    var dest = serialized ? ('/?' + serialized) : '/';
    if (window.location.href !== dest) {
      window.history.replaceState({}, pages.getTitle('/'), dest);
    }

    templating.render('results-header', {data: data}, function(res) {
      $('main header').innerHTML = res;
    });

    var current = data.results.map(function(x) {
      return x.doc._id;
    });

    var previous = previousResults ? previousResults.results.map(function(x) {
      return x.doc._id;
    }) : [];

    if (!utils.eq(current, previous)) {
      // Only re-render results if results have changed.
      templating.render('results', {data: data, docs: docs}, function(res) {
        $('main ol').innerHTML = res;
      });
    }

    if (!cache.exists(data.query)) {
      console.log('Caching "' + data.query + '"');
      cache.set(data.query, data);
    }

    previousResults = data;
  }

  $.delegate('input', 'input[name=q]', function() {
    search();
  }, false);

  $.delegate('click', 'input[name=q] ~ .search-clear', function () {
    // Clear search box and re-render search results.
    reset();
    search();
  });

  $.delegate('submit', 'form', function(e) {
    e.preventDefault();
    search();
  });

  $.delegate('click', '.screenshot', function(e) {
    e.preventDefault();
    e.target.classList.toggle('active');
  });

  $.delegate('click', '.app', function (e) {
    // TODO: Fix event delegation bubbling.
    if (!e.target.classList.contains('app')) {
      return;
    }

    var app = docs[e.target.dataset.id];

    if (app.installed) {
      console.log('Launching ' + app.name + ':' + app.manifest_url);
      app.mozApp.launch();
      return;
    }

    console.log('Installing ' + app.name + ':' + app.manifest_url);
    apps.install(app, {src: 'metropolis'}).then(function (mozApp) {
      // App names should already be localised before we get here (issue #14).
      app.name = utils.translate(app.name);

      // Show success notification message.
      notification.notification({
        classes: 'success',
        message: gettext('*{app}* installed', 'installSuccess', {app: app.name})
      });

      // Mark as installed.
      docs[app._id].installed = app.installed = true;

      // Attach app object from `navigator.mozApps.install` call.
      docs[app._id].mozApp = app.mozApp = mozApp;

      // Change "Install" button to "Open" button.
      var button = $('.app[data-id="' + app._id + '"] .install');
      button.classList.add('open');
      button.textContent = gettext('Open', 'open');
    }, function () {
      app.name = utils.translate(app.name);
      notification.notification({
        classes: 'error',
        message: gettext('*{app}* failed to install', 'installError', {app: app.name})
      });
    });
  }, false);

  GET = utils.parseQueryString();
  reset();
  if (GET.q) {
    q.value = GET.q;
  }

  function init() {
    if (document.body.dataset.page === 'results') {
      // Bail if we've already rendered this page.
      return search();
    }
    templating.render('browse', function(res) {
      $('main').innerHTML = res;
      indexed.then(function(data) {
        // Populate list of docs.
        docs = data;

        // Get the list of installed apps so we can toggle the buttons where appropriate.
        apps.getInstalled().then(function (installedApps) {
          if (installedApps) {
            Object.keys(docs).forEach(function (key) {
              // Attach the `navigator.mozApps` object so we can launch the app later.
              // (The installed apps are keyed off the manifest URL without the querystring.)
              docs[key].mozApp = installedApps[utils.baseurl(docs[key].manifest_url)] || null;
              docs[key].installed = !!docs[key].mozApp;
            });
          }

          // Initialize and then render search template.
          document.body.setAttribute('class', 'results');
          document.body.dataset.page = 'results';
          search();
        });
      });
    });
  }

  return {
    docs: docs,
    index: index,
    init: init,
    renderResults: renderResults,
    reset: reset
  };
});
