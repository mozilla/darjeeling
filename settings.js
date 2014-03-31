var _ = require('lodash');

var dbTransformer = require('./db-transformer');


var settings = {
  debug: false,
  db_dir: 'src/db',
  db_url: 'https://marketplace-dev.allizom.org/api/v1/rocketfuel/collections/curated/',
  frontend_dir: 'src',
  use_data_uris: true
};

settings.db_transformer = function (data, callback) {
  dbTransformer(settings, data, callback);
};

var settings_local = {};

try {
  settings_local = require('./settings_local');
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

settings = _.assign(settings, settings_local || {});

if ('DEBUG' in process.env) {
  settings.debug = !!+process.env.DEBUG;
}

module.exports = settings;
