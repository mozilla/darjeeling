var crypto = require('crypto');
var path = require('path');

var _ = require('lodash');

var parseManifest = require('parse-appcache-manifest');

var appcacheMedia = [];
try {
  appcacheMedia = require('./src/appcache_media');
} catch (e) {
}
var db = require('./lib/db');
var settings = require('./settings');


var colors = {
  cyan: '\x1B[36m',
  red: '\x1B[31m'
};

function color(whichColor, text) {
  return colors[whichColor] + text + '\x1B[39m';
}

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

module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      nunjucks: {
        files: 'src/templates/*',
        tasks: ['nunjucks']
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
          'src/media/js/featured.js',
          'src/media/js/views/search.js',
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
    manifest: {
      generate: {
        options: {
          basePath: 'src/',
          hash: true,
          timestamp: false,
          verbose: false
        },
        src: [
          'db/data.json',
          'l10n/locales.ini',
          'media/css/style.min.css',
          'media/img/logo.png',
          'media/img/search.png',
          'media/js/lib/lunr.min.js',
          'media/js/lib/lunr.unicodeNormalizer.min.js',
          'media/js/lib/worker.min.js',
          'media/js/main.min.js'
        ].concat(appcacheMedia),
        dest: 'src/site.appcache'
      }
    },
    syncdb: {
      options: {
        dest: settings.db_dir + '/data.json'
      }
    },
    appcachehash: {
      options: {
        src: settings.frontend_dir + '/site.appcache',
        dest: settings.frontend_dir + '/site.appcache'
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
  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-nunjucks');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-string-replace');

  grunt.registerTask('syncdb', 'Fetches JSON from API, downloads ' +
                               'icons/screenshots, and transforms data to ' +
                               'static JSON file to disk', function () {
    var done = this.async();
    var options = this.options();
    db.fetch().then(function () {
      grunt.log.writeln('File ' + color('cyan', options.dest) + ' created.');
      done();
    }, function () {
      grunt.log.writeln(color('red',
        'File ' + options.dest + ' failed to be created.'));
      done();
    }).catch(function (err) {
      grunt.log.writeln(color('red', 'lib/db failed: ' + err));
      done();
    });
  });

  // (See bug 99319.)
  grunt.registerTask('appcachehash', 'Adds cachebusting-querystring parameters ' +
                                     'to resources listed in appcache and ' +
                                     'writes to disk a JS file whose AMD ' +
                                     'module returns an object mapping each ' +
                                     'resource URL to its ' +
                                     'cachebusting-querystring ' +
                                     'parameter', function () {
    var options = this.options();

    var manifest = grunt.file.read(options.src);
    var cached = parseManifest(manifest).cache;
    var cachebustedUrls = {};
    var replacements = [];

    cached.forEach(function (url) {
      var fn = path.join(settings.frontend_dir, url);
      grunt.verbose.writeln('Hashing ' + url);
      var hash = computeHash(grunt, grunt.file.read(fn)).substr(0, 7);
      var newUrl = urlparams(url, 'h=' + hash);
      cachebustedUrls[url] = newUrl;
      replacements.push({
        pattern: new RegExp(url, 'ig'),
        replacement: newUrl
      });
    });

    // Replace the `CACHE:` block with the newly cachebusted URLs.
    var newManifest = manifest.replace(/CACHE:[\s\S]*\n\n/,
      'CACHE:\n' + _.values(cachebustedUrls).join('\n') + '\n\n');

    // Replace manifest with the new manifest containing cachebusted URLs.
    grunt.file.write(options.dest, newManifest);

    // Replace across all source files all occurrences of original URLs with
    // cachebusted URLs.
    grunt.config('string-replace.dist.options.replacements', replacements);
  });

  grunt.registerTask('default', ['nunjucks', 'watch']);
  grunt.registerTask('appcache', ['manifest', 'appcachehash']);
  grunt.registerTask('minify',
    ['processhtml', 'syncdb', 'manifest', 'nunjucks',
     'concat', 'cssmin', 'uglify', 'appcachehash', 'string-replace']);
};
