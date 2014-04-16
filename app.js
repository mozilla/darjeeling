var path = require('path');

var express = require('express');

var db = require('./lib/db');
var settings = require('./settings');


var app = express();

var frontend_dir = path.join(__dirname, settings.frontend_dir);
var db_dir = path.join(__dirname, settings.db_dir);

var urlpatterns = [
  '/lite/',
  '/lite/search/',
  '/lite/app/([^/<>"\']+)/',
  '/lite/category/([^/<>"\']+)/',
  '/lite/feedback/'
];

var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', 'https://marketplace.firefox.com');
  res.header('Access-Control-Allow-Origin', 'https://marketplace-dev.allizom.org');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

// For local development (because the production base path is `/lite/`).
app.get('/', function(req, res) {
  // Map `/(.*)` to `/lite$1`.
  if (req.url.indexOf('/lite') !== 0) {
    res.redirect('/lite' + req.url);
  }
});

// Workaround for a Firefox a bug that hits the wrong appcache URI (bug 983871).
app.use(function(req, res, next) {
  // Convert `//` to `/`.
  if (req.url.indexOf('//') !== -1) {
    req.url = req.url.substr(req.url.indexOf('//') + 1);
    console.log(req.url)
  }
  next();
});

// Do not ever *ever* cache with far-future max-age! Always use ETags!
// app.use(function(req, res, next) {
//   res.removeHeader('Cache-Control');
//   res.removeHeader('Expires');
//   res.removeHeader('ETag');
//   next();
// });

// Route cachebusted URLs (for appcache). This needs to be in nginx!
app.use(function(req, res, next) {
  if (/.*\.hash_\.*/.test(req.url)) {
    req.url = req.url.replace(/hash_.+\./, '');
  }
  next();
});

if (settings.debug) {
  app.configure('development', function() {
    app.use(express.errorHandler());
  });
  // For our sanity, we make sure that the appcache manifest 404s when
  // running the dev server so assets aren't appcached up the wazoo during
  // development.
  app.get('/lite/manifest.appcache', function(req, res) {
    res.send(404);
  });
}

// Note: the middlewares above must come before we initialise `express.static`.
app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('view options', {layout: false});
  app.use(express.logger());
  app.use(express.compress());
  app.use(express.static(settings.frontend_dir));
  app.use(allowCrossDomain);
});

urlpatterns.forEach(function(pattern) {
  app.get(pattern, function(req, res) {
    res.sendfile(settings.debug ? 'lite/dev.html' : 'lite/index.html', {root: frontend_dir});
  });
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
