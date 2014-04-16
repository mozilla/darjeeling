var path = require('path');

var express = require('express');

var db = require('./lib/db');
var settings = require('./settings');


var app = express();

var frontend_dir = path.join(__dirname, settings.frontend_dir);
var db_dir = path.join(__dirname, settings.db_dir);

var urlpatterns = [
  '/',
  '/search/',
  '/app/([^/<>"\']+)/',
  '/category/([^/<>"\']+)/',
  '/feedback/'
];

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'https://marketplace.firefox.com');
  res.header('Access-Control-Allow-Origin', 'https://marketplace-dev.allizom.org');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('view options', {layout: false});
  app.use(express.logger());
  app.use(express.compress());
  app.use(express.static(frontend_dir));
  app.use(allowCrossDomain);
});

urlpatterns.forEach(function(pattern) {
  app.get(pattern, function(req, res) {
    res.sendfile(settings.debug ? 'dev.html' : 'index.html', {root: frontend_dir});
  });
});

if (settings.debug) {
  app.configure('development', function() {
    app.use(express.errorHandler());
  });
} else {
  // For our sanity, we make sure that the appcache manifest 404s when running
  // the dev server so assets aren't appcached up the wazoo during development.
  app.get('/manifest.appcache', function(req, res) {
    res.sendfile(path.join(frontend_dir, 'site.appcache'));
  });
  app.get('//manifest.appcache', function(req, res) {
    res.sendfile(path.join(frontend_dir, 'site.appcache'));
  });
}

// For local development (because on in production the base path is `/lite/`).
app.get(new RegExp(settings.frontend_api_dir.replace(/\//g, '\/')), function(req, res) {
  res.sendfile(path.join(frontend_dir,
    req.url.replace(settings.frontend_api_dir, '').replace(/hash_.+\./, '')));
});

// NOTE: Do not ever *ever* cache with far-future max-age! Always use ETags!

// Route cachebusted URLs (for appcache). This needs to be in nginx!
app.get(/.*\.hash_\.*/, function(req, res) {
  res.sendfile(path.join(frontend_dir, req.url.replace(/hash_.+\./, '')));
});

// Note: This the same as `grunt fetchdb` (which should run as a cron job).
// That means if we have `grunt fetchdb` running as a cron job, we don't need
// this in nginx.
app.get('/fetchdb', function(req, res) {
  db.fetch(path.join(db_dir, 'latest.json')).then(function() {
    res.json({success: true});
  }, function() {
    res.json({error: true});
  }).catch(function(err) {
    console.error('lib/db.fetch errored:', err);
  });
});

app.listen(app.get('port'), function() {
  var address = this.address();
  console.log('Starting server at http://' +
              address.address + ':' + address.port);
});
