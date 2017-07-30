var src = __dirname;
var dst = __dirname;

var gulp = require('gulp'),
minifyHTML = require('gulp-html-minifier'),
cleanCSS = require('gulp-clean-css'),
uglify = require('gulp-uglify');

gulp.task('html', function() {
    return gulp.src(src + '/*.html')
               .pipe(minifyHTML({collapseWhitespace: true}))
			   .pipe(gulp.dest(dst));
});

gulp.task('css', function() {
	return gulp.src(src + '/assets/css/*.css')
			   .pipe(cleanCSS())
			   .pipe(gulp.dest(dst + '/assets/css/'));
});

gulp.task('js', function() {
	return gulp.src(src + '/assets/js/*.js')
			   .pipe(uglify({output: {ascii_only:true}}))
			   .pipe(gulp.dest(dst + '/assets/js/'));
});

gulp.task('default', ['html', 'css', 'js'], function() {});
