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

var frontend_dir = path.join(__dirname, settings.frontend_dir);

// These are the files containing un-cachbusted URLs that need to get
// replaced with cachedbusted URLs.
var stringReplaceFiles = {};
stringReplaceFiles[settings.db_dir + '/preloaded.json'] = settings.db_dir + '/preloaded.json';
stringReplaceFiles[settings.frontend_dir + '/lite/media/css/'] = settings.frontend_dir + '/lite/media/css/*.min.css';
stringReplaceFiles[settings.frontend_dir + '/lite/media/js/'] = settings.frontend_dir + '/lite/media/js/*.min.js';
stringReplaceFiles[settings.frontend_dir + '/lite/media/js/lib/'] = settings.frontend_dir + '/lite/media/js/lib/*.min.js';
stringReplaceFiles[settings.frontend_dir + '/lite/index.html'] = settings.frontend_dir + '/lite/index.html';

// Relative to `src/lite/`.
var appcachedFiles = [
  'lite/db/preloaded.json',
  'lite/l10n/locales.ini',
  'lite/media/css/style.min.css',
  'lite/media/img/logo.png',
  'lite/media/img/search.png',
  'lite/media/img/toggle-view.png',
  'lite/media/img/category/games.svg',
  'lite/media/img/category/games-active.svg',
  'lite/media/img/category/home.svg',
  'lite/media/img/category/home-active.svg',
  'lite/media/img/category/lifestyle.svg',
  'lite/media/img/category/lifestyle-active.svg',
  'lite/media/img/category/tools.svg',
  'lite/media/img/category/tools-active.svg',
  'lite/media/js/lib/lunr.min.js',
  'lite/media/js/lib/lunr.unicodeNormalizer.min.js',
  'lite/media/js/lib/worker.min.js',
  'lite/media/js/main.min.js'
];

module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      nunjucks: {
        files: 'src/lite/templates/*',
        tasks: ['nunjucks']
      },
      cssmin: {
        files: 'src/lite/media/css/style.css',
        tasks: ['cssmin']
      }
    },
    jshint: {
      options: {
        jshintrc: __dirname + '/.jshintrc'
      },
      files: [
        '*.js',
        'src/lite/**/*.js',
        'src/lite/lib/**/*.js',
        '!src/**/*.min.js',
        '!src/lite/media/js/lib/*.js',
        '!src/lite/media/js/templates.js'
      ]
    },
    nunjucks: {
      options: {
        name: function(filename) {
          return filename.replace(/^src\/lite\/templates\//, '');
        }
      },
      precompile: {
        src: 'src/lite/templates/*',
        dest: 'src/lite/media/js/templates.js',
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
          'src/lite/media/js/lib/l10n.js',
          'src/lite/media/js/templates.js',
          'src/lite/media/js/lib/nunjucks-slim.js',
          'src/lite/media/js/lib/routes.js',
          'src/lite/media/js/lib/promise-0.1.1.js',
          'src/lite/media/js/amd.js',
          'src/lite/media/js/utils.js',
          'src/lite/media/js/settings_prod.js',
          'src/lite/media/js/settings.js',
          'src/lite/media/js/capabilities.js',
          'src/lite/media/js/storage.js',
          'src/lite/media/js/log.js',
          'src/lite/media/js/dom.js',
          'src/lite/media/js/cache.js',
          'src/lite/media/js/routes_api.js',
          'src/lite/media/js/url.js',
          'src/lite/media/js/user.js',
          'src/lite/media/js/templating.js',
          'src/lite/media/js/notification.js',
          'src/lite/media/js/worker.js',
          'src/lite/media/js/pages.js',
          'src/lite/media/js/apps.js',
          'src/lite/media/js/indexing.js',
          'src/lite/media/js/install.js',
          'src/lite/media/js/featured.js',
          'src/lite/media/js/categories.js',
          'src/lite/media/js/content-ratings.js',
          'src/lite/media/js/views/category.js',
          'src/lite/media/js/views/detail.js',
          'src/lite/media/js/views/featured.js',
          'src/lite/media/js/views/search.js',
          'src/lite/media/js/views/feedback.js',
          'src/lite/media/js/main.js'
        ],
        dest: 'src/lite/media/js/main.min.js'
      }
    },
    cssmin: {
      minify: {
        expand: true,
        cwd: 'src/lite/media/css/',
        src: ['style.css'],
        dest: 'src/lite/media/css/',
        ext: '.min.css'
      }
    },
    uglify: {
      dist: {
        files: {
          'src/lite/media/js/lib/lunr.min.js': 'src/lite/media/js/lib/lunr.js',
          'src/lite/media/js/lib/lunr.unicodeNormalizer.min.js': 'src/lite/media/js/lib/lunr.unicodeNormalizer.js',
          'src/lite/media/js/lib/worker.min.js': 'src/lite/media/js/lib/worker.js',
          'src/lite/media/js/main.min.js': ['<%= concat.dist.dest %>'],
        }
      }
    },
    processhtml: {
      prod: {
        files: {
          'src/lite/index.html': ['src/lite/dev.html']
        }
      }
    },
    appcache: {
      options: {
        manifest_dest: settings.frontend_dir + '/manifest.appcache',
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
          replacements: [
            // {
            //   pattern: /(html.+manifest=)(["'])\//g,
            //   replacement: '$1$2/' + settings.frontend_api_url
            // }
          ]
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
    var replacements = grunt.config('string-replace.dist.options.replacements');

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

        url = '/' + url;

        var cachebustedUrl = utils.cachebust(url, hash);

        cachebustedUrls.push(cachebustedUrl);

        replacements.push({
          pattern: url,
          replacement: cachebustedUrl
        });
      });

      console.log(replacements)

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
      // replacements.push({
      //   pattern: /(=['"])\/(?!lite\/)/ig,
      //   replacement: '$1/lite/'
      // });

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
     'string-replace']);
};
