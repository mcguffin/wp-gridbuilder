var gulp = require('gulp');
var concat = require('gulp-concat');  
var uglify = require('gulp-uglify');  
var sass = require('gulp-sass');
//var sass = require('gulp-ruby-sass');
var nodeSass = require('node-sass');

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



var sassOptions = {
	outputStyle: 'compressed',
	precision: 8,
	stopOnError: true,
	functions: {
		'base64Encode($string)': function($string) {
			var buffer = new Buffer( $string.getValue() );
			return nodeSass.types.String( buffer.toString('base64') );
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
	return gulp.src( './js/src/admin/tools.js' )
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

gulp.task('watch',function(){
	gulp.watch('js/src/**/*.js', [ 
		'js:tools', 
		'js:edit' 
	] );
	gulp.watch('scss/**/*.scss', [ 'scss:admin:dev', 'scss:frontend:dev' ] );
});

gulp.task('default', [ 'js:tools', 'js:edit', 'scss:admin:dev', 'scss:frontend:dev', 'watch' ] );

