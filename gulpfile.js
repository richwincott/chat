const gulp = require('gulp');
const concat = require('gulp-concat');
const minifyCSS = require('gulp-csso');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const babel = require('gulp-babel');
const pump = require('pump');

const js = require('./js');
const css = require('./css');

let devMode = false;

gulp.task('css', (cb) => {
    pump([
        gulp.src(css),
        minifyCSS(),
        concat('main.css'),
        gulp.dest('./build/css'),
    ], cb); 
});

gulp.task('js', (cb) => {
    pump([
        gulp.src(js),
        gulpif(!devMode, babel()),
        gulpif(!devMode, uglify()),
        concat('scripts.js'),
        gulp.dest('./build/js'),
    ], cb);
});

gulp.task('html', (cb) => {
    pump([
        gulp.src('./src/public/**/*.*'),
        gulp.dest('./build'),
    ], cb);
});

gulp.task('build', () => {
    gulp.start([ 'html', 'css', 'js' ]);
});

gulp.task('start', () => {
    devMode = true;
    gulp.start(['build']);
    gulp.watch('./src/css/**/*.css', ['css']);
    gulp.watch('./src/js/**/*.js', ['js']);
    gulp.watch('./src/public/**/*.*', ['html']);
})