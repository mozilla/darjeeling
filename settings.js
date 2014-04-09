var _ = require('lodash');

var dbTransformer = require('./lib/db-transformer');
var pkg = require('./package.json');


var settings = {
  debug: true,
  db_dir: 'src/db',
  db_url: 'https://marketplace-dev.allizom.org/api/v1/rocketfuel/collections/curated/',
  downloads_dir: 'src/downloads',
  frontend_dir: 'src',
  use_data_uris: true
};

settings.appcache_media = settings.frontend_dir + '/appcache_media.json';

settings.db_transformer = function (data) {
  return dbTransformer(settings, data);
};

if ('DEBUG' in process.env) {
  settings.debug = !!+process.env.DEBUG;
}

// Load local- or prod-specific settings to override the ones above.

// Hopefully this is the only command-line argument we need ;)
var settings_name = process.argv.slice(2).join('')
  .replace('--settings', '').replace('=','').trim()
  .replace(/^\.\//, '').replace(/\.js$/, '') || 'settings_local';

if (process.argv.join(' ').indexOf('app.js') === -1) {
  // Force `settings_local` if we're not running `app.js`.
  settings_name = 'settings_local';
}

var settings_local = {};

try {
  console.log(pkg.name + ' v' + pkg.version +
              ", using settings '" + settings_name + "'");
  settings_local = require('./' + settings_name);
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

module.exports = settings = _.assign(settings, settings_local || {});
