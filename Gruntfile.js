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
    }
  });

  // Always show stack traces when Grunt prints out an uncaught exception.
  grunt.option('stack', true);

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-nunjucks');

  grunt.registerTask('default', ['nunjucks', 'watch']);
};
