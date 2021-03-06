'use strict';

var gulp = require('gulp');
//var babel = require('gulp-babel');
//var sourcemaps = require('gulp-sourcemaps');
var less = require('gulp-less');
var jetpack = require('fs-jetpack');

var utils = require('./utils');

var projectDir = jetpack;
var srcDir = projectDir.cwd('./app');
var destDir = projectDir.cwd('./build');

var paths = {
    jsCodeToTranspile: [
        'app/**/*.js',
        '!app/node_modules/**',
        '!app/vendor/**'
    ],
    copyFromAppDir: [
        './*.js',
        './scripts/*.js',
        './node_modules/**',
        './vendor/**',
        './**/*.html'
    ],
}

// -------------------------------------
// Tasks
// -------------------------------------

gulp.task('clean', function(callback) {
    return destDir.dirAsync('.', { empty: true });
});


var copyTask = function () {
    projectDir.copy('resources/icon.png', destDir.path('icon.png'), { overwrite: true });
    projectDir.copy('app/node_modules/bootstrap/fonts/glyphicons-halflings-regular.woff2', destDir.path('fonts/glyphicons-halflings-regular.woff2'), { overwrite: true });
    projectDir.copy('app/node_modules/bootstrap/fonts/glyphicons-halflings-regular.woff', destDir.path('fonts/glyphicons-halflings-regular.woff'), { overwrite: true });
    projectDir.copy('app/node_modules/bootstrap/fonts/glyphicons-halflings-regular.ttf', destDir.path('fonts/glyphicons-halflings-regular.ttf'), { overwrite: true });
    projectDir.copy('app/fonts/Bangers.ttf', destDir.path('fonts/Bangers.ttf'), { overwrite: true });
    projectDir.copy('app/fonts/Bangers.ttf.eot', destDir.path('fonts/Bangers.ttf.eot'), { overwrite: true });
    projectDir.copy('app/fonts/Bangers.ttf.svg', destDir.path('fonts/Bangers.ttf.svg'), { overwrite: true });
    projectDir.copy('app/fonts/Bangers.ttf.woff', destDir.path('fonts/Bangers.ttf.woff'), { overwrite: true });
    return projectDir.copyAsync('app', destDir.path(), {
        overwrite: true,
        matching: paths.copyFromAppDir
    });
};
gulp.task('copy', ['clean'], copyTask);
gulp.task('copy-watch', copyTask);


//var transpileTask = function () {
//    return gulp.src(paths.jsCodeToTranspile)
//    .pipe(sourcemaps.init())
//    .pipe(babel({ modules: 'amd' }))
//    .pipe(sourcemaps.write('.'))
//    .pipe(gulp.dest(destDir.path()));
//};
//gulp.task('transpile', ['clean'], transpileTask);
//gulp.task('transpile-watch', transpileTask);


var lessTask = function () {
    return gulp.src('app/styles/*.less')
    .pipe(less())
    .pipe(gulp.dest(destDir.path('styles')));
};
gulp.task('less', ['clean'], lessTask);
gulp.task('less-watch', lessTask);


// Add and customize OS-specyfic and target-specyfic stuff.
gulp.task('finalize', ['clean'], function () {
    var manifest = srcDir.read('package.json', 'json');
    switch (utils.getEnvName()) {
        case 'production':
            // Hide dev toolbar if doing a release.
            manifest.window.toolbar = false;
            break;
        case 'test':
            // Add "-test" suffix to name, so NW.js will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-test';
            // Change the main entry to spec runner.
            manifest.main = 'spec.html';
            break;
        case 'development':
            // Add "-dev" suffix to name, so NW.js will write all
            // data like cookies and locaStorage into separate place.
            manifest.name += '-dev';
            break;
    }
    destDir.write('package.json', manifest);

    var configFilePath = projectDir.path('config/env_' + utils.getEnvName() + '.json');
    destDir.copy(configFilePath, 'env_config.json');
});


gulp.task('watch', function () {
    //gulp.watch(paths.jsCodeToTranspile, ['transpile-watch']);
    gulp.watch(paths.copyFromAppDir, { cwd: 'app' }, ['copy-watch']);
    gulp.watch('app/**/*.less', ['less-watch']);
});


gulp.task('build', ['less', 'copy', 'finalize']);
