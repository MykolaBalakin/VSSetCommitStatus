var gulp = require('gulp');
var clean = require('gulp-clean');
var exec = require('gulp-exec');
var ts = require('gulp-typescript');


var outDir = './build';
var tsProject = ts.createProject('tsconfig.json');

gulp.task('package', function() {
    return gulp.src(outDir + '/vss-extension.json')
        .pipe(exec('tfx extension create --root ' + outDir))
        .pipe(exec.reporter());
});

gulp.task('copy-extensionManifest', function() {
    return gulp.src('./vss-extension.json')
        .pipe(gulp.dest(outDir));
});

gulp.task('copy-extensionIcon', function() {
    return gulp.src('./icon.png')
        .pipe(gulp.dest(outDir));
});

gulp.task('copy-taskContent', function() {
    return gulp.src(['./**/*', '!./**/*.ts', '!./**/node_modules/**', '!./node_modules/**', '!' + outDir + '/**'])
        .pipe(gulp.dest(outDir));
});

gulp.task('copy-node-modules', function() {
    return gulp.src(['./**/node_modules/**', '!./node_modules/**', '!' + outDir + '/**'])
        .pipe(gulp.dest(outDir));
});

gulp.task('copy-resources', gulp.parallel('copy-extensionManifest', 'copy-extensionIcon', 'copy-taskContent'));

gulp.task('build-ts', function() {
    var tsResult = tsProject
        .src()
        .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest(outDir));
});

gulp.task('build', gulp.parallel('build-ts', 'copy-resources', 'copy-node-modules'));

gulp.task('clean', function() {
    return gulp.src(outDir, { read: false })
        .pipe(clean());
});

gulp.task('default', gulp.series('clean', 'build', 'package'));