var _ = require('lodash');
var request = require('request');
var Promise = require('es6-promise').Promise;


module.exports = function (settings, data, callback) {
  var images = {};

  data = data.apps.map(function (app) {
    app._id = app.id;

    delete app.icons['16'];
    delete app.icons['48'];
    delete app.icons['128'];

    // Collect a list of image URLs (to later convert to data URIs).
    images[app.icons['64']] = null;
    // app.previews.forEach(function (preview) {
    //   images[preview.image_url] = null;
    //   images[preview.thumbnail_url] = null;
    // });

    return _.pick(app, [
      '_id',
      'author',
      'content_ratings',
      'description',
      'icons',
      'is_packaged',
      'manifest_url',
      'name',
      // 'previews',
      'privacy_policy',
      'ratings',
      'slug',
      'status'
    ]);
  });

  console.log('Transformed data');

  if (!settings.use_data_uris) {
    console.log('Skipping data URIs');
    return callback(null, data);
  }

  console.log('Fetching images to convert to data URIs');

  var promises = [];

  _.uniq(Object.keys(images)).forEach(function (url) {
    promises.push(new Promise(function (resolve, reject) {
      var req = request(url);
      req.end();
      req.on('response', function (res) {
        var body = '';
        var prefix = 'data:' + res.headers['content-type'] + ';base64,';

        res.setEncoding('binary');
        res.on('data', function (chunk) {
          if (res.statusCode == 200) {
            body += chunk;
          }
        }).on('end', function () {
          var base64 = new Buffer(body, 'binary').toString('base64');
          var data = prefix + base64;
          if (data) {
            images[url] = data;
            resolve();
          } else {
            reject();
          }
        }).on('error', function () {
          rejectDataUri();
        });
      });
    }));
  });

  Promise.all(promises).then(function () {
    data = data.map(function (app) {
      app.icons['64'] = images[app.icons['64']];
      // app.previews = app.previews.map(function (preview) {
      //   preview.image_url = images[preview.image_url];
      //   preview.thumbnail_url = images[preview.thumbnail_url];
      //   return preview;
      // });
      return app;
    });

    console.log('Successfully converted all images to data URIs');
    callback(null, data);
  }, function () {
    console.log('Failed to convert images to data URIs');
    callback(null);
  });
};
