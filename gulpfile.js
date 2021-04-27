var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
//var sass = require('gulp-ruby-sass');

var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');

function logError(){
	console.log('error',arguments);
}

var files = {
	scss : {
		admin : [
			'./src/scss/admin/edit.scss',
//			'scss/admin/tools.scss',
		],
		frontend: [
			'./src/scss/frontend/frontend.scss',
			'./src/scss/frontend/frontend-bootstrap.scss'
		],
	},
	js : [
		'./src/js/Sortable/Sortable.js',
		'./src/js/Sortable/jquery.binding.js',
		'./src/js/mcguffin/jquery.serializeStructure.js',
		'./src/js/admin/edit/grid-base.js',
		'./src/js/admin/edit/grid-model.js',
		'./src/js/admin/edit/grid-ui.js',
		'./src/js/admin/edit/grid-dialog-views.js',
		'./src/js/admin/edit/grid-element.js',
		'./src/js/admin/edit.js'
	],
};



var sassOptions = {
	outputStyle: 'compressed',
	precision: 8,
	stopOnError: true,
	functions: {
		'base64Encode($string)': function($string) {
			
			let s = Buffer.from($string.getValue()).toString('base64')
			let ss = new $string.constructor
			ss.setValue(s)
			return ss
		}
	}

};

gulp.task( 'js:edit', function(){
	return gulp.src( files.js )
		.pipe( sourcemaps.init() )
		.pipe( concat( 'edit.js' ) )
		.pipe( gulp.dest( './js/admin/' ) )
		.pipe( uglify() )
		.pipe( rename({suffix:'.min'}) )
        .pipe( sourcemaps.write() )
		.pipe( gulp.dest( './js/admin/' ) );
} );

gulp.task( 'js:tools', function(){
	return gulp.src( './src/js/admin/tools.js' )
		.pipe( sourcemaps.init() )
		.pipe( gulp.dest( './js/admin/' ) )
		.pipe( uglify() )
		.pipe( rename({suffix:'.min'}) )
        .pipe( sourcemaps.write() )
		.pipe( gulp.dest( './js/admin/' ) );
} );

gulp.task( 'scss:admin:dev', function() {
    return gulp.src( files.scss.admin )
		.pipe(sourcemaps.init())
        .pipe(
        	sass( sassOptions )
        	.on('error', sass.logError)
        )
        .pipe( sourcemaps.write() )
        .pipe( gulp.dest('./css/admin'));
});

gulp.task( 'scss:frontend:dev', function() {
    return gulp.src( files.scss.frontend )
		.pipe(sourcemaps.init())
        .pipe(
        	sass( sassOptions )
        	.on('error', sass.logError)
        )
        .pipe( sourcemaps.write() )
        .pipe( gulp.dest('./css'));
});

gulp.task( 'scss:admin', function() {
    return gulp.src( files.scss.admin )
        .pipe(
        	sass( sassOptions )
        	.on('error', sass.logError)
        )
        .pipe( gulp.dest('./css/admin'));
});

gulp.task( 'scss:frontend', function() {
    return gulp.src( files.scss.frontend )
        .pipe(
        	sass( sassOptions )
        	.on('error', sass.logError)
        )
        .pipe( gulp.dest('./css'));
});

gulp.task('watch',function(){
	gulp.watch('./src/js/**/*.js', gulp.parallel( 'js:tools', 'js:edit' ) );
	gulp.watch('./src/scss/**/*.scss', gulp.parallel( 'scss:admin:dev', 'scss:frontend:dev' ) );
});

gulp.task('build', gulp.series( 'js:tools', 'js:edit', 'scss:admin:dev', 'scss:frontend:dev' ) );

gulp.task('default', gulp.series( 'js:tools', 'js:edit', 'scss:admin:dev', 'scss:frontend:dev', 'watch' ) );
