var src = '.';
var dst = '.';

var gulp = require('gulp'),
minifyHTML = require('gulp-html-minifier'),
minifyCSS = require('gulp-minify-css'),
uglify = require('gulp-uglify');

gulp.task('html', function() {
    return gulp.src(dst + '*.html')
               .pipe(minifyHTML({collapseWhitespace: true}))
			   .pipe(gulp.dest(dst));
});

gulp.task('css', function() {
	return gulp.src(dst + 'assets/css/*.css')
			   .pipe(minifyCSS())
			   .pipe(gulp.dest(dst + 'assets/css/'));
});

gulp.task('js', function() {
	return gulp.src(dst + 'assets/js/*.js')
			   .pipe(uglify({output: {ascii_only:true}}))
			   .pipe(gulp.dest(dst + 'assets/js/'));
});

gulp.task('default', ['html', 'css', 'js'], function() {});