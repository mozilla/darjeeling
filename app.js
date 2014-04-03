var fs = require('fs');
var path = require('path');

var express = require('express');
var request = require('request');

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
    res.contentType('text/cache-manifest');
    res.sendfile(path.join(frontend_dir, 'site.appcache'));
  });
}

app.get('/fetch', function (req, res) {
  var fnOriginal = path.join(settings.db_dir, 'original.json');
  var fnTransformed = path.join(settings.db_dir, 'data.json');

  request(settings.db_url, function (err, res, body) {
    if (err) {
      console.error(err);
      return res.json({error: true});
    }

    fs.writeFile(fnOriginal, body);

    var bodyJSON = JSON.parse(body);

    settings.db_transformer(bodyJSON, function (transformedErr, transformedData) {
      if (transformedErr) {
        console.error(transformedErr);
        return res.json({error: true});
      }

      console.log('Successfully wrote database to disk', fnTransformed);
      fs.writeFile(fnTransformed, JSON.stringify(transformedData));

      // In the future, any new data the client doesn't have will
      // come in the future of incremental GETs instead of having
      // to bust the appcache and refetch everything any time the
      // database changes. (See issue #4.)
      console.log('Cachebusted appcache manifest');
      fs.appendFile(path.join(frontend_dir, 'site.appcache'), 'x');
    });
  });

  res.json({success: true});
});

app.listen(app.get('port'), function () {
  var address = this.address();
  console.log('Starting server at http://' +
              address.address + ':' + address.port);
});
