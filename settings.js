var dbTransformer = require('./db-transformer');


var settings = {
  db_dir: 'src/db',
  db_url: 'https://marketplace-dev.allizom.org/api/v1/rocketfuel/collections/curated/',
  frontend_dir: 'src',
  use_data_uris: true
};

settings.db_transformer = function (data, callback) {
  dbTransformer(settings, data, callback);
};

module.exports = settings;
