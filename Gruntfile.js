var crypto = require('crypto');
var path = require('path');

var db = require('./lib/db');
var settings = require('./settings');
var utils = require('./lib/utils');


function computeHash(grunt, contents) {
  var hasher = crypto.createHash('sha256');
  hasher.update(contents, 'binary');
  return hasher.digest('hex');
}

function baseurl(url) {
  return url.split('?')[0];
}

function urlparams(url, qs) {
  if (url.indexOf('?') === -1) {
    return url + '?' + qs;
  }
  return url + '&' + qs;
}

// These are the files containing un-cachbusted URLs that need to get
// replaced with cachedbusted URLs.
var stringReplaceFiles = {};
stringReplaceFiles[settings.db_dir + '/data.json'] = settings.db_dir + '/data.json';
stringReplaceFiles[settings.frontend_dir + '/media/css/'] = settings.frontend_dir + '/media/css/*.min.css';
stringReplaceFiles[settings.frontend_dir + '/media/js/'] = settings.frontend_dir + '/media/js/*.min.js';
stringReplaceFiles[settings.frontend_dir + '/media/js/lib/'] = settings.frontend_dir + '/media/js/lib/*.min.js';
stringReplaceFiles[settings.frontend_dir + '/prod.html'] = settings.frontend_dir + '/prod.html';

var appcachedFiles = [
  'db/preloaded.json',
  'l10n/locales.ini',
  'media/css/style.min.css',
  'media/img/logo.png',
  'media/img/search.png',
  'media/img/toggle-view.png',
  'media/img/category/games.svg',
  'media/img/category/games-active.svg',
  'media/img/category/home.svg',
  'media/img/category/home-active.svg',
  'media/img/category/lifestyle.svg',
  'media/img/category/lifestyle-active.svg',
  'media/img/category/tools.svg',
  'media/img/category/tools-active.svg',
  'media/js/lib/lunr.min.js',
  'media/js/lib/lunr.unicodeNormalizer.min.js',
  'media/js/lib/worker.min.js',
  'media/js/main.min.js'
];

var frontend_dir = path.join(__dirname, settings.frontend_dir);

module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      nunjucks: {
        files: 'src/templates/*',
        tasks: ['nunjucks']
      },
      cssmin: {
        files: 'src/media/css/style.css',
        tasks: ['cssmin']
      }
    },
    jshint: {
      options: {
        jshintrc: __dirname + '/.jshintrc'
      },
      files: [
        '*.js',
        'lib/**/*.js',
        'src/**/*.js',
        '!src/**/*.min.js',
        '!src/media/js/lib/*.js',
        '!src/media/js/templates.js'
      ]
    },
    nunjucks: {
      options: {
        name: function(filename) {
          return filename.replace(/^src\/templates\//, '');
        }
      },
      precompile: {
        src: 'src/templates/*',
        dest: 'src/media/js/templates.js',
      }
    },
    concat: {
      dist: {
        options: {
          process: function(src) {
            // TODO: Remove this when https://github.com/jlongster/nunjucks/issues/186 gets fixed.
            return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          }
        },
        src: [
          'src/media/js/lib/l10n.js',
          'src/media/js/templates.js',
          'src/media/js/lib/nunjucks-slim.js',
          'src/media/js/lib/routes.js',
          'src/media/js/lib/promise-0.1.1.js',
          'src/media/js/amd.js',
          'src/media/js/utils.js',
          'src/media/js/settings_prod.js',
          'src/media/js/settings.js',
          'src/media/js/capabilities.js',
          'src/media/js/storage.js',
          'src/media/js/log.js',
          'src/media/js/dom.js',
          'src/media/js/cache.js',
          'src/media/js/routes_api.js',
          'src/media/js/url.js',
          'src/media/js/user.js',
          'src/media/js/templating.js',
          'src/media/js/notification.js',
          'src/media/js/worker.js',
          'src/media/js/pages.js',
          'src/media/js/apps.js',
          'src/media/js/indexing.js',
          'src/media/js/install.js',
          'src/media/js/featured.js',
          'src/media/js/categories.js',
          'src/media/js/content-ratings.js',
          'src/media/js/views/category.js',
          'src/media/js/views/detail.js',
          'src/media/js/views/featured.js',
          'src/media/js/views/search.js',
          'src/media/js/views/feedback.js',
          'src/media/js/main.js'
        ],
        dest: 'src/media/js/main.min.js'
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'src/media/css/',
        src: ['style.css'],
        dest: 'src/media/css/',
        ext: '.min.css'
      }
    },
    uglify: {
      dist: {
        files: {
          'src/media/js/lib/lunr.min.js': 'src/media/js/lib/lunr.js',
          'src/media/js/lib/lunr.unicodeNormalizer.min.js': 'src/media/js/lib/lunr.unicodeNormalizer.js',
          'src/media/js/lib/worker.min.js': 'src/media/js/lib/worker.js',
          'src/media/js/main.min.js': ['<%= concat.dist.dest %>'],
        }
      }
    },
    processhtml: {
      prod: {
        files: {
          'src/prod.html': ['src/dev.html']
        }
      }
    },
    appcache: {
      options: {
        manifest_dest: settings.frontend_dir + '/site.appcache',
        data_dest: settings.db_dir + '/preloaded.json'
      }
    },
    fetchdb: {
      options: {
        data_dest: settings.db_dir + '/latest.json'
      }
    },
    'string-replace': {
      dist: {
        files: stringReplaceFiles,
        options: {
          replacements: []
        }
      }
    }
  });

  // Always show stack traces when Grunt prints out an uncaught exception.
  grunt.option('stack', true);

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-nunjucks');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-string-replace');

  grunt.registerTask('appcache', 'Fetches JSON from API, downloads ' +
                                 'icons/screenshots, and transforms data to ' +
                                 'static JSON file to disk; ' +
                                 'creates appcache manifest', function () {
    var done = this.async();
    var options = this.options();
    var cachebustedUrls = [];
    var replacements = [];

    db.fetchPreloaded(options.data_dest).then(function () {
      grunt.log.writeln(
        'File ' + utils.color('cyan', options.data_dest) + ' created.');
      createAppcache();
    }, function (err) {
      grunt.log.writeln(utils.color('red',
        'File ' + options.file_dest + ' failed to be created: ' + err));
      done();
    }).catch(function (err) {
      grunt.log.writeln(utils.color('red', 'lib/db failed: ' + err));
      done();
    });

    function createAppcache() {
      var files = appcachedFiles;

      try {
        files = files.concat(require('./' + settings.appcache_media)).map(function (url) {
          return url.replace(/hash_.+\./,'');
        });
      } catch (e) {
      }

      files.forEach(function (url) {
        var fn = path.join(frontend_dir, url);
        grunt.verbose.writeln('Hashing ' + url);
        var hash = computeHash(grunt, grunt.file.read(fn)).substr(0, 7);
        var newUrl = utils.cachebust(url, hash);

        cachebustedUrls.push(newUrl);
        replacements.push({
          pattern: new RegExp(url, 'ig'),
          replacement: newUrl
        });
      });

      // Add cachebusting-querystring parameters to resources we want to list in
      // appcache manifest (see bug 993919).

      var manifest = 'CACHE MANIFEST\n\n' +
                     'CACHE:\n' +
                     cachebustedUrls.join('\n') + '\n\n' +
                     'NETWORK:\n*\n';

      // Create manifest with cachebusted URLs.
      grunt.file.write(options.manifest_dest, manifest);

      // Replace across all source files all occurrences of original URLs with
      // cachebusted URLs.
      grunt.config('string-replace.dist.options.replacements', replacements);

      done();
    }
  });

  grunt.registerTask('fetchdb', 'Fetches JSON from API, downloads ' +
                               'icons/screenshots, and transforms data to ' +
                               'static JSON file to disk', function () {
    var done = this.async();
    var options = this.options();
    db.fetchLatest(options.data_dest).then(function () {
      grunt.log.writeln(
        'File ' + utils.color('cyan', options.data_dest) + ' created.');
      done();
    }, function (err) {
      grunt.log.writeln(utils.color('red',
        'File ' + options.file_dest + ' failed to be created: ' + err));
      done();
    }).catch(function (err) {
      grunt.log.writeln(utils.color('red', 'lib/db failed: ' + err));
      done();
    });

  });

  grunt.registerTask('default', ['nunjucks', 'watch']);

  // Order is very important!
  grunt.registerTask('minify',
    ['processhtml', 'nunjucks', 'concat', 'cssmin', 'uglify', 'appcache',
     'string-replace', 'fetchdb']);
};
