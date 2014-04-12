define('views/search',
       ['apps', 'content-ratings', 'dom', 'indexing', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils', 'worker'],
       function(apps, iarc, $, indexing, log, notification, pages, settings, storage, templating, url, utils, worker) {
  var cache = indexing.cache;
  var console = log('search');
  var docs = {};
  var GET;
  var gettext = templating._l;
  var indexed = indexing.index();
  var q;
  var previousQuery = null;
  var previousResults = null;
  var timeStart;
  var queuedInstalls = JSON.parse(storage.getItem('queuedInstalls') || '[]');

  worker.addEventListener('message', function (e) {
    switch (e.data.type) {
    case 'results':
      // FIXME: need to cancel that on navigation, if the result has been returned
      // in time.
      return renderResults(e.data.data);
    }
  });

  function search() {
    timeStart = window.performance.now();

    var query = q.value || '';

    if (previousQuery === query) {
      // Bail if the query hasn't changed.
      console.log('Skipping rendering search results since search query has not changed');
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

    if (!q) {
      q = $('input[name=q]');
    }

    // Update location bar based on search term.
    GET = utils.parseQueryString();
    GET.q = q.value || '';
    var serialized = utils.serialize(GET);
    var dest = serialized ? ('/?' + serialized) : '/';  // FIXME: compatibility with Marketplace, which uses /search?q=, would be nice.
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

  $.delegate('click', '.toggle-view', function(e) {
    e.preventDefault();
    $('main').classList.toggle('expanded');
    e.target.classList.toggle('expanded');
  });

  $.delegate('click', '.install', function (e) {
    e.preventDefault();
    e.stopImmediatePropagation(); // don't let the even go to the main click handler.
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

  function init() {
    console.log('Initializing search page...');
    if (document.body.dataset.page === 'results') {
      // Bail if we've already rendered this page.
      return search();
    }
    templating.render('browse', function(res) {
      $('main').innerHTML = res;
      console.log('Done rendering browse template, now waiting for indexed promise...');
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
          GET = utils.parseQueryString();
          reset();
          if (GET.q) {
            q.value = GET.q;
          }
          search();
        });
      });
    });
  }

  return {
    docs: docs,
    init: init,
    renderResults: renderResults,
    reset: reset
  };
});
