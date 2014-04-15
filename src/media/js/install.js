define('install',
       ['apps', 'capabilities', 'dom', 'indexing', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils'],
       function(apps, caps, $, indexing, log, notification, pages, settings, storage, templating, url, utils) {
  var docs = {};  // Holds the apps.
  var indexed = false;
  var gettext = templating._l;
  var queuedInstalls = JSON.parse(storage.getItem('queuedInstalls') || '[]');

  function findById(data, id) {
    // lambda x: x.id == id
    for (var i = 0; i < data.length; i++) {
      if (data[i]._id === id) {
        return data[i];
      }
    }
    return null;
  }

  var getDocs = function() {
      return docs;
  };

  var hideSplash = function() {
    // FIXME: move elsewhere.
    // We're ready to rumble. Remove splash screen!
    console.log('Preparing to remove slash screen...');
    document.body.removeChild(document.getElementById('splash-overlay'));
    console.log('Hiding splash screen (' + ((window.performance.now() - window.start_time) / 1000).toFixed(6) + 's)');
  };

  var installApp = function(app) {
    return new Promise(function(resolve, reject) {
      console.log('Installing ' + app.name + ': ' + app.manifest_url);
      apps.install(app, {src: 'darjeeling'}).then(function (mozApp) {

        if (!caps.firefoxOS) {
          // Show success notification message (if not on FxOS cuz OS notifies obscures this).
          notification.notification({
            classes: 'success',
            message: gettext('*{app}* installed', 'installSuccess', {app: app.name})
          });
        }

        // Mark as installed.
        docs[app._id].installed = app.installed = true;

        // Attach app object from `navigator.mozApps.install` call.
        docs[app._id].mozApp = app.mozApp = mozApp;

        // Change "Install" button to "Open" button.
        var button = $('.app[data-id="' + app._id + '"] .install');
        button.classList.add('open');
        button.textContent = gettext('Launch', 'launch');

        // We're done.
        resolve(app);
      }, function () {
        app.name = utils.translate(app.name);
        if (!caps.firefoxOS) {
          notification.notification({
            classes: 'error',
            message: gettext('*{app}* failed to install', 'installError', {app: app.name})
          });
        }

        // We're done.
        reject(app);
      });
    });
  };

  $.delegate('click', '.install', function(e) {
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

        e.target.classList.add('queued');
        e.target.textContent = gettext('Queued', 'queued');
      }
      notification.notification({
        message: gettext('*{app}* will be installed when online', 'installOffline', {app: app.name})
      });
    });
  }, false);

  var installing = false;
  var installQueuedInstalls = function() {
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
  };

  setInterval(function() {
    // If there are apps to install, check periodically to see
    // if we're offline, and if so, then clear out the queue.
    if (queuedInstalls.length) {
      installQueuedInstalls();
    }
  }, settings.offlineInterval);

  var init = function() {
    return new Promise(function(resolve, reject) {
      console.log('Waiting for indexed Promise...');
      if (indexed === true) {
        console.log('Already indexed, resolving install Promise directly');
        resolve(docs);
        return;
      }
      indexing.index().then(function(data) {
        console.log('indexed Promise done...');
        // Populate list of docs.
        docs = data;

        // Get the list of installed apps so we can toggle the buttons where appropriate.
        apps.getInstalled().then(function(installedApps) {
          Object.keys(docs).forEach(function(key) {
            if (installedApps || queuedInstalls) {
              // Attach the `navigator.mozApps` object so we can launch the app later.
              // (The installed apps are keyed off the manifest URL without the querystring.)
              docs[key].mozApp = installedApps[utils.baseurl(docs[key].manifest_url)] || null;
              docs[key].installed = !!docs[key].mozApp;
              docs[key].queued = findById(queuedInstalls, docs[key]._id);
            }

            // App names should already be localised before we get here (issue #14).
            docs[key].name = utils.translate(docs[key].name);
          });

          console.log('Resolving install Promise...');
          resolve(docs);
        });

        // Mark as indexed so that we don't wait for the index Promise next time.
        indexed = true;
      });
    });
  };

  return {
    getDocs: getDocs,
    init: init,
    installApp: installApp,
    installQueuedInstalls: installQueuedInstalls,
    hideSplash: hideSplash
  };
});
