var appcacheMedia = require('./src/appcache_media');


module.exports = function (grunt) {
  grunt.initConfig({
    watch: {
      nunjucks: {
        files: 'src/templates/*',
        tasks: ['nunjucks']
      }
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
          process: function(src, filepath) {
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
          'media/js/main.min.js',
          // TODO: Remove these fonts (issue #5).
          'media/fonts/FiraSans/firasansot-light-webfont.woff',
          'media/fonts/FiraSans/firasansot-regular-webfont.woff',
          'media/fonts/FiraSans/firasansot-medium-webfont.woff',
          'media/fonts/FiraSans/firasansot-bold-webfont.woff'
        ].concat(appcacheMedia),
        dest: 'src/site.appcache'
      }
    }
  });

  // Always show stack traces when Grunt prints out an uncaught exception.
  grunt.option('stack', true);

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-manifest');
  grunt.loadNpmTasks('grunt-nunjucks');

  grunt.registerTask('default', ['nunjucks', 'watch']);
  grunt.registerTask('minify',
    ['nunjucks', 'concat', 'cssmin', 'uglify', 'manifest']);
};
