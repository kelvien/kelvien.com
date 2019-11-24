var src = __dirname;
var dst = __dirname + '/dist';

var util = require('gulp-util');

var gulp = require('gulp'),
minifyHTML = require('gulp-html-minifier'),
cleanCSS = require('gulp-clean-css'),
uglify = require('gulp-uglify-es').default;

gulp.task('copy', function() {
	gulp.src(src + '/assets/media/**')
            .pipe(gulp.dest(dst + '/assets/media'));
	gulp.src(src + '/resume.pdf')
	    .pipe(gulp.dest(dst));
});

gulp.task('html', function() {
	gulp.src(src + '/*.html')
	    .pipe(util.env.production ? minifyHTML({collapseWhitespace: true}) : util.noop())
	    .pipe(gulp.dest(dst));
});

gulp.task('css', function() {
	gulp.src(src + '/assets/css/**/*.css')
	    .pipe(util.env.production ? cleanCSS() : util.noop())
		.pipe(gulp.dest(dst + '/assets/css'));
});

gulp.task('js', function() {
	gulp.src(src + '/assets/js/**/*.js')
		.pipe(util.env.production ? uglify({output: {ascii_only:true}}) : util.noop())
		.pipe(gulp.dest(dst + '/assets/js'));
});

// Watch me nae-nae
gulp.task('watch', function() {
	gulp.watch('assets/media/**/*', ['copy']);
	gulp.watch('*.html', ['html']);
	gulp.watch('assets/css/**/*.css', ['css']);
	gulp.watch('assets/js/**/*.js', ['js']);
});

gulp.task('default', ['copy', 'html', 'css', 'js'], function() {});
