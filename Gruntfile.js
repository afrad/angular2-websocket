module.exports = function (grunt) {
    grunt.initConfig({
        pkg: 'package.json',
        typescript: {
            base: {
                src: ['reconnecting-websocket.ts'],
                dest: 'reconnecting-websocket.js',
                options: {
                    noImplicitAny: true,
                    nolib: false,
                    module: 'commonjs',
                    target: 'es3',
                    sourcemap: true,
                    fullSourceMapPath: false,
                    declaration: false
                }
            }
        },
        uglify: {
            target: {
                options: {
                    sourceMap: 'reconnecting-websocket.js.map',
                    sourceMapIn: 'reconnecting-websocket.js.map'
                },
                files: {
                    'reconnecting-websocket.min.js': ['reconnecting-websocket.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-typescript');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('dist', ['typescript', 'uglify']);
    grunt.registerTask('default', ['dist']);
};
