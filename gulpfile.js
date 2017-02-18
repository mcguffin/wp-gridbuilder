var gulp = require('gulp');
var concat = require('gulp-concat');  
var uglify = require('gulp-uglify');  
//var sass = require('gulp-sass');
var sass = require('gulp-ruby-sass');

var sourcemaps = require('gulp-sourcemaps');
var rename = require('gulp-rename');

function logError(){
	console.log('error',arguments);
}

var files = {
	scss : {
		admin : [
			'scss/admin/edit.scss',
//			'scss/admin/tools.scss',
		],
		frontend: [
			'scss/frontend/frontend.scss',
			'scss/frontend/frontend-bootstrap.scss'
		],
	},
	js : [
		'./js/src/Sortable/Sortable.js',
		'./js/src/Sortable/jquery.binding.js',
		'./js/src/admin/edit/grid-base.js',
		'./js/src/admin/edit/grid-model.js',
		'./js/src/admin/edit/grid-ui.js',
		'./js/src/admin/edit/grid-dialog-views.js',
		'./js/src/admin/edit/grid-element.js',
		'./js/src/admin/edit.js'
	],
};


gulp.task( 'js:edit', function(){
	return gulp.src( files.js )
		.pipe( concat( 'edit.js' ) )
		.pipe( gulp.dest( './js/admin/' ) )
		.pipe( uglify() )
		.pipe( rename({suffix:'.min'}) )
		.pipe( gulp.dest( './js/admin/' ) );
} );

gulp.task( 'js:tools', function(){
	return gulp.src( './js/src/admin/tools.js' )
		.pipe( gulp.dest( './js/admin/' ) )
		.pipe( uglify() )
		.pipe( rename({suffix:'.min'}) )
		.pipe( gulp.dest( './js/admin/' ) );
} );

gulp.task( 'scss:admin:dev', function() { 
	return sass( files.scss.admin, {
			precision: 8,
			stopOnError: true,
			require: './scss/library/base64-encode.rb'
		})
		.on('error', sass.logError)
		.pipe( gulp.dest('./css/admin'));

});
gulp.task( 'scss:frontend:dev', function() {
	return sass( files.scss.frontend, {
			precision: 8,
			stopOnError: true,
			require: './scss/library/base64-encode.rb'
		})
		.on('error', sass.logError)
		.pipe( gulp.dest('./css'));
});

gulp.task('default', function() {
	gulp.watch('js/src/**/*.js', [ 
		'js:tools', 
		'js:edit' 
	] );
	gulp.watch('scss/**/*.scss', [ 'scss:admin:dev', 'scss:frontend:dev' ] );
});

