'use strict';

const babelify      = require('babelify');
const browserify    = require('browserify');
const browserSync   = require("browser-sync").create();
const exec          = require('child_process').exec;
const gulp          = require('gulp');
const autoprefixer  = require('gulp-autoprefixer');
const handlebars    = require('gulp-compile-handlebars');
const php           = require('gulp-connect-php7');
const includeFiles  = require('gulp-file-include');
const gulpif        = require('gulp-if');
const notify        = require('gulp-notify');
const rename        = require('gulp-rename');
const sourcemaps    = require('gulp-sourcemaps');
const sass          = require('gulp-sass');
const uglify        = require('gulp-uglify');
const minimist      = require('minimist');
const buffer        = require('vinyl-buffer');
const source        = require('vinyl-source-stream');

// FLAGS
const args = minimist(process.argv.slice(2));

// BUILD FOLDER
const dist = './dist';

const build = [
  'browserify',
  'templates',
  'sass',
  'assets',
  'scripts'
]

// DEFAULT
if (args.sync) {
  gulp.task('default', ['sync']);
} else if (args.watch) {
  gulp.task('default', ['watch']);
} else {
  gulp.task('default', build);
}

// WATCH
gulp.task('watch', [...build], function() {
  gulp.watch('./src/scss/**/*.scss', ['sass']);
  gulp.watch(['./src/js/main.js', './src/js/components/**/*.js'], ['browserify']).on('change',browserSync.reload);
  gulp.watch(['./src/js/vendors.js','./src/js/onload.js'], ['scripts']).on('change',browserSync.reload);
  gulp.watch('./src/templates/**/*.*', ['templates']).on('change',browserSync.reload);
});

// SYNC + WATCH (PHP SERVER)
gulp.task('sync',['kill-php', 'watch'], function() {
  // run php server
  php.server({ base: dist, port: 8010}, function() {
    browserSync.init({
      proxy: '127.0.0.1:8010',
      port: 3000
    });
  });
});

// kills all php processes, prevents error when building server if server exists
gulp.task('kill-php', function() {
  exec('pkill php', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
  });
});

// // SYNC + WATCH
// gulp.task('sync',['watch'], function() {
//   // serve dist folder on port 4000
//   browserSync.init({
//     server: dist,
//     port: 3000
//   });
// });
/*---------------------------------------------------------------*/

// COMPILE MAIN.JS (BROWSERIFY)
gulp.task('browserify', function() {
  return browserify('./src/js/main.js')
    .transform('babelify')
    .bundle()
    .on('error', function(error) {
      let args = Array.prototype.slice.call(arguments);
      notify.onError({
        title   : 'Javascript Error',
        message : error.message.split('.js: ')[1]
      }).apply(this, args);
      console.log(error)
      this.emit('end')
    })
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(gulpif(args.staging || args.production, uglify()))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest(dist+'/js'))
    .pipe(browserSync.stream());
});

// COMPILE SCRIPTS
gulp.task('scripts', function() {
  return gulp.src(['./src/js/vendors.js', './src/js/onload.js'])
    .pipe(sourcemaps.init())
    .pipe(includeFiles({prefix: '@@', basepath: '@file'}))
    .pipe(gulpif(args.staging || args.production, uglify()))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest(dist+'/js'))
});

// COMPILE STYLE.CSS (SASS)
gulp.task('sass', function() {
  return gulp.src('./src/scss/**.scss')
    .pipe(sourcemaps.init())
    .pipe(sass({outputStyle:'compressed'}))
    .on('error', function(error) {
      let args = Array.prototype.slice.call(arguments);
      notify.onError({
        title   : 'SASS Error',
        message : error.relativePath
      }).apply(this, args);
      console.log('\n');
      console.log('File:', error.file);
      console.log('Line:', error.line, ' | Column:', error.column);
      console.log('\n');
      console.log(error.formatted);
      this.emit('end');
    })
    .pipe(autoprefixer({
      browsers : ['last 5 versions'],
      cascade  : false
    }))
    .pipe(rename('style.css'))
    .pipe(sourcemaps.write('maps'))
    .pipe(gulp.dest(dist))
    .pipe(browserSync.stream({match: '**/*.css'}));
});

// COMPILE TEMPLATES (HANDLEBARS)
gulp.task('templates', function() {
  let _config = {
    ignorePartials : true,
    partials       : {},
    batch          : ['./src/templates/components'],
    helpers        : {}
  }
  return gulp.src('./src/templates/*.handlebars')
    .pipe(handlebars(require('./src/templates/_configs/data.json'), _config))
    .pipe(rename( function(path) {path.extname = ".php";} ))
    .pipe(gulp.dest(dist))
});

// COPY ASSETS
gulp.task('assets', function() {
  return gulp.src('./src/assets/**/*.*')
    .pipe(gulp.dest(dist+'/assets'))
});