var path = require('path');

var express = require('express');

var db = require('./lib/db');
var settings = require('./settings');


var app = express();

var frontend_dir = path.join(__dirname, settings.frontend_dir);

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('view options', {layout: false});
  app.use(express.logger());
  app.use(express.compress());
  app.use(express.static(frontend_dir));
});

app.get('/', function (req, res) {
  res.sendfile(settings.debug ? 'dev.html' : 'prod.html', {root: frontend_dir});
});

if (settings.debug) {
  app.configure('development', function () {
    app.use(express.errorHandler());
  });
} else {
  // For our sanity, we make sure that the appcache manifest 404s when running
  // the dev server so assets aren't appcached up the wazoo during development.
  app.get('/manifest.appcache', function (req, res) {
    res.sendfile(path.join(frontend_dir, 'site.appcache'));
  });
}

app.get('/fetch', function (req, res) {
  db.fetch().then(function () {
    res.json({success: true});
  }, function () {
    res.json({error: true});
  }).catch(function (err) {
    console.error('lib/db errored:', err);
  });
});

app.listen(app.get('port'), function () {
  var address = this.address();
  console.log('Starting server at http://' +
              address.address + ':' + address.port);
});
