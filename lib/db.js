var fs = require('fs');
var path = require('path');

var Promise = require('es6-promise').Promise;
var request = require('request');

var settings = require('../settings');


var frontend_dir = path.join(__dirname, '..', settings.frontend_dir);
var db_dir = path.join(__dirname, '..', settings.db_dir);

module.exports.fetch = function fetch() {
  return new Promise(function (resolve, reject) {
    var now = Date.now();

    var fnOriginal = path.join(db_dir, 'original.json');
    var fnTransformed = path.join(db_dir, 'data.json');
    var fnArchivedOriginal = path.join(db_dir, 'archives', now + '-original.json');
    var fnArchivedTransformed = path.join(db_dir, 'archives', now + '-data.json');

    request(settings.db_url, function (err, res, body) {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }

      fs.writeFile(fnOriginal, body);
      fs.writeFile(fnArchivedOriginal, body);

      var bodyJSON = JSON.parse(body);

      settings.db_transformer(bodyJSON).then(function success(data) {
        var bodyTransformed = JSON.stringify(data);

        console.log('Successfully wrote database to disk', fnTransformed);
        fs.writeFile(fnTransformed, bodyTransformed);
        fs.writeFile(fnArchivedTransformed, bodyTransformed);

        // In the future, any new data the client doesn't have will
        // come in the future of incremental GETs instead of having
        // to bust the appcache and refetch everything any time the
        // database changes. (See issue #4.)
        console.log('Cachebusted appcache manifest');
        fs.appendFile(path.join(frontend_dir, 'site.appcache'), 'x');

        resolve(bodyTransformed);
      }, function error(err) {
        console.error('settings.db_transformer rejected:', err);
        reject(err);
      }).catch(function (err) {
        console.error('settings.db_transformer errored:', err);
        reject(err);
      });
    });

  });
};
