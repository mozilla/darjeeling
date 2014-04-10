define('views/search',
       ['apps', 'cache', 'dom', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils', 'worker'],
       function(apps, Cache, $, log, notification, pages, settings, storage, templating, url, utils, worker) {
  var cache = new Cache();
  var console = log('search');
  var docs = {};
  var GET;
  var gettext = templating._l;
  var indexed = index();
  var q;
  var previousQuery = null;
  var previousResults = null;
  var timeStart;
  var queuedInstalls = JSON.parse(storage.getItem('queuedInstalls') || '[]');

  function index() {
    var promise = new Promise(function (resolve) {
      worker.addEventListener('message', function (e) {
        switch (e.data.type) {
          case 'indexed':
            return resolve(e.data.data);
          case 'results':
            return renderResults(e.data.data);
          case 'reindexed_latest':
            return reindex_latest(e.data.data);
          case 'reindexed_cached':
            return reindex_cached(e.data.data);
        }
      });

      // Index the apps from the preloaded DB we have in appcache.
      worker.postMessage({
        type: 'index',
        data: {
          min: !!JSON.parse(document.body.dataset.prod || 'false'),
          url: url('search.docs.preloaded'),
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

      // Index the apps from the latest DB that contains apps added since the
      // user fetched the previous appcached, preloaded DB.
      worker.postMessage({
        type: 'reindex_latest',
        data: {
          url: url('search.docs.latest').replace('{hash}', document.body.dataset.preloaded_hash)
        }
      });

      // Index the apps from the preloaded DB we have in appcache.
      worker.postMessage({
        type: 'reindex_cached',
        data: {
          data: storage.getItem('docs:' + document.body.dataset.preloaded_hash) || '[]'
        }
      });
    });
    return promise;
  }

  function reindex_latest(newDocs) {
    console.log('Reindex from latest online DB successful');

    // TODO: Re-render current search view, if visible.

    cache.clear();

    var toCache = [];

    Object.keys(newDocs).forEach(function (key) {
      toCache.push(newDocs[key]);

      // Add icons and screenshots to Firefox's appcache.
      // See https://developer.mozilla.org/en-US/docs/nsIDOMOfflineResourceList
      if (window.applicationCache.mozAdd) {
        window.applicationCache.mozAdd(newDocs[key].icon);
        newDocs[key].previews.forEach(function (previewKey, idx) {
          window.applicationCache.mozAdd(newDocs[key].previews[idx].image);
        });
      }
    });

    // Store the new search docs in localStorage so these get indexed when we
    // are offline.
    storage.setItem('docs:' + document.body.dataset.preloaded_hash,
      JSON.stringify(toCache));
  }

  function reindex_cached(reindexedDocs) {
    console.log('Reindex from locally cached DB successful');

    // TODO: Re-render current search view, if visible.

    cache.clear();
  }

  function search() {
    timeStart = window.performance.now();

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

    data.timing = window.performance.now() - data.timeStart;

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
        // Override body classname, I don't use classList because I'm lazy and
        // don't want to figure out what to remove.
        document.body.className = 'results ' + (dest === '/' ? 'homepage' : 'search');
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

    utils.checkOnline().then(function () {
      console.log('Online ⤳ installing app now (ʘ‿ʘ)');
      installApp(app);
    }, function () {
      console.log('Offline ⤳ queuing app to install later ⊙﹏⊙');
      if (!app.queued) {
        // Simplify the object we're passing around, because we don't need
        // all those deets to install an app.
        var queuedApp = {
          _id: app._id,
          name: app.name,
          categories: app.categories,
          is_packaged: app.is_packaged,
          manifest_url: app.manifest_url
        };
        queuedInstalls.push(queuedApp);
        storage.setItem('queuedInstalls', JSON.stringify(queuedInstalls));
        app.queued = true;
      }
      notification.notification({
        message: gettext('*{app}* will be installed when online', 'installOffline', {app: app.name})
      });
    });
  }, false);

  function installApp(app) {
    return new Promise(function (resolve, reject) {
      console.log('Installing ' + app.name + ': ' + app.manifest_url);
      apps.install(app, {src: 'darjeeling'}).then(function (mozApp) {

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

        // We're done.
        resolve(app);
      }, function () {
        app.name = utils.translate(app.name);
        notification.notification({
          classes: 'error',
          message: gettext('*{app}* failed to install', 'installError', {app: app.name})
        });

        // We're done.
        reject(app);
      });
    });
  }

  var installing = false;

  function installQueuedInstalls() {
    var howMany = queuedInstalls.length === 1 ? '1 app' :
                  queuedInstalls.length + ' apps';

    utils.checkOnline().then(function () {
      console.log('Online ⤳ ' + howMany + ' in queue');

      if (installing) {
        return console.log('Already installing a queued app, checking back later', installing);
      }

      // Pop off the app that's been in the queue the longest.
      var app = queuedInstalls.shift();
      storage.setItem('queuedInstalls', JSON.stringify(queuedInstalls));

      // Mark as dequeued so we could theoretically add this app to the queue again.
      docs[app._id].queued = false;

      // Mark as installing so we don't try to concurrently install another app.
      installing = true;

      // Install each app (which calls `navigator.mozApps.install`, etc.).
      installApp(app).then(function (app) {
        installing = false;
        console.log('Installed queued app: ' + app.name);
      }, function (app) {
        installing = false;
        console.log('Could not install queued app: ' + app.name);
      });

    }, function () {
      //console.log('Offline ⤳ ' + howMany + ' in queue');
    });
  }

  setInterval(function () {
    // If there are apps to install, check periodically to see
    // if we're offline, and if so, then clear out the queue.
    if (queuedInstalls.length) {
      installQueuedInstalls();
    }
  }, settings.offlineInterval);

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
          Object.keys(docs).forEach(function (key) {
            if (installedApps) {
              // Attach the `navigator.mozApps` object so we can launch the app later.
              // (The installed apps are keyed off the manifest URL without the querystring.)
              docs[key].mozApp = installedApps[utils.baseurl(docs[key].manifest_url)] || null;
              docs[key].installed = !!docs[key].mozApp;
            }

            // App names should already be localised before we get here (issue #14).
            docs[key].name = utils.translate(docs[key].name);
          });

          // We're ready to rumble. Remove splash screen!
          document.body.removeChild(document.getElementById('splash-overlay'));
          console.log('Hiding splash screen (' + ((window.performance.now() - window.start_time) / 1000).toFixed(6) + 's)');

          // Initialize and then render search template.
          document.body.className = 'results';
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
