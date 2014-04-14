define('install',
       ['apps', 'dom', 'indexing', 'log', 'notification', 'pages', 'settings', 'storage', 'templating', 'url', 'utils'],
       function(apps, $, indexing, log, notification, pages, settings, storage, templating, url, utils) {
  var docs = {};  // Holds the apps.
  var indexed = indexing.index();
  var gettext = templating._l;
  var queuedInstalls = JSON.parse(storage.getItem('queuedInstalls') || '[]');

  function getDocs() {
      return docs;
  }

  var installApp = function(app) {
    return new Promise(function(resolve, reject) {
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
      indexed.then(function(data) {
        // Populate list of docs.
        docs = data;

        // Get the list of installed apps so we can toggle the buttons where appropriate.
        apps.getInstalled().then(function(installedApps) {
          Object.keys(docs).forEach(function(key) {
            if (installedApps) {
              // Attach the `navigator.mozApps` object so we can launch the app later.
              // (The installed apps are keyed off the manifest URL without the querystring.)
              docs[key].mozApp = installedApps[utils.baseurl(docs[key].manifest_url)] || null;
              docs[key].installed = !!docs[key].mozApp;
            }

            // App names should already be localised before we get here (issue #14).
            docs[key].name = utils.translate(docs[key].name);
          });
        });

        resolve();
      });
    });
  };

  return {
    getDocs: getDocs,
    init: init,
    installApp: installApp,
    installQueuedInstalls: installQueuedInstalls,
  };
});