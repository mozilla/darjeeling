var _ = require('lodash');

var dbTransformer = require('./db-transformer');


var settings = {
  debug: true,
  db_dir: 'src/db',
  db_url: 'https://marketplace-dev.allizom.org/api/v1/rocketfuel/collections/curated/',
  frontend_dir: 'src',
  use_data_uris: true
};

settings.db_transformer = function (data, callback) {
  dbTransformer(settings, data, callback);
};

if ('DEBUG' in process.env) {
  settings.debug = !!+process.env.DEBUG;
}

// Load local- or prod-specific settings to override the ones above.

// Hopefully this is the only command-line argument we need ;)
var settings_name = process.argv.slice(2).join('')
  .replace('--settings', '').replace('=','').trim().replace(/^\.\//, '').replace(/\.js$/, '');

var settings_local = {};

try {
  settings_local = require('./' + (settings_name || 'settings_local'));
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

module.exports = settings = _.assign(settings, settings_local || {});
