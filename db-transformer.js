var _ = require('lodash');
var request = require('request');
var Promise = require('es6-promise').Promise;


module.exports = function (settings, data, callback) {
  var images = {};

  data = data.apps.map(function (app) {
    app._id = app.id;
    app.icon = app.icons['64'];
    app.previews = [
      {
        image: app.previews[0].image_url,
        // thumb: app.previews[0].thumbnail_url
      }
    ];

    // Collect a list of image URLs (to later convert to data URIs).
    images[app.icon] = null;
    app.previews.forEach(function (preview) {
      images[preview.image] = null;
      // images[preview.thumb] = null;
    });

    // Flatten object of localised name to one key for easy searching.
    app.name_search = [];
    Object.keys(app.name).forEach(function (locale) {
      app.name_search.push(app.name[locale]);
    });
    app.name_search = app.name_search.join(' ').replace(/\(|\)/g, '');

    // Flatten object of localised name to one key for easy searching.
    app.description_search = [];
    Object.keys(app.description).forEach(function (locale) {
      app.description_search.push(app.description[locale]);
    });
    app.description_search = app.description_search.join(' ').replace(/\(|\)/g, '');

    return _.pick(app, [
      '_id',
      'author',
      'content_ratings',
      'description',
      'description_search',
      'icon',
      'is_packaged',
      'manifest_url',
      'name',
      'name_search',
      'previews',
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
      app.icon = images[app.icon];
      app.previews = app.previews.map(function (preview) {
        preview.image = images[preview.image];
        // preview.thumb = images[preview.thumb];
        return preview;
      });
      return app;
    });

    console.log('Successfully converted all images to data URIs');
    callback(null, data);
  }, function () {
    console.log('Failed to convert images to data URIs');
    callback(null);
  });
};
