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

app.get('/', function(req, res) {
  res.sendfile(settings.debug ? 'dev.html' : 'prod.html', {root: frontend_dir});
});

if (settings.debug) {
  app.configure('development', function () {
    app.use(express.errorHandler());
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
    });
  });

  res.json({success: true});
});

app.listen(app.get('port'));
