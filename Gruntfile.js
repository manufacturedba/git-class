module.exports = function(grunt) {
    grunt.initConfig({
        watch: {
            files: ['views/**/*.jade'],
            options: {
                livereload: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
}