'use strict';

const babelify      = require('babelify');
const browserify    = require('browserify');
const browserSync   = require("browser-sync").create();
const gulp          = require('gulp');
const autoprefixer  = require('gulp-autoprefixer');
const handlebars    = require('gulp-compile-handlebars');
const php           = require('gulp-connect-php');
const includeFiles  = require('gulp-file-include');
const gulpif        = require('gulp-if');
const notify        = require('gulp-notify');
const rename        = require('gulp-rename');
const sourcemaps    = require('gulp-sourcemaps');
const sass          = require('gulp-sass');
const uglify        = require('gulp-uglify');
const minimist      = require('minimist');
const buffer        = require('vinyl-buffer')
const source        = require('vinyl-source-stream');

// FLAGS
const args = minimist(process.argv.slice(2));

// BUILD FOLDER
const dist = './dist';

  // START PHP SERVER
  gulp.task('php', function() {
      php.server({ base: dist, port: 8010, keepalive: true});
  });
  // INIT BROWSER-SYNC
  gulp.task('browser-sync',['php'], () => {
    browserSync.init({
      proxy: '127.0.0.1:8010',
      port: 3000
    });
  });

  // COMPILE MAIN.JS (BROWSERIFY)
  gulp.task('browserify', () => {
    return browserify('./src/js/main.js')
      .transform('babelify')
      .bundle()
      .on('error', (error) => {
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
      .pipe(gulpif(args.staging || args.production, uglify()))
      .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest(dist+'/js'))
      .pipe(browserSync.stream());
  });

  // COMPILE SCRIPTS
  gulp.task('scripts', () => {
    return gulp.src(['./src/js/vendors.js','./src/js/onload.js'])
      .pipe(sourcemaps.init())
      .pipe(includeFiles({prefix: '@@', basepath: '@file'}))
      .pipe(gulpif(args.staging || args.production, uglify()))
      .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest(dist+'/js'))
  });

  // COMPILE STYLE.CSS (SASS)
  gulp.task('sass', () => {
    return gulp.src('./src/scss/**.scss')
      .pipe(sourcemaps.init())
      .pipe(gulpif(args.staging || args.production, sass({outputStyle:'compressed'}), sass({outputStyle:'compact'})))
      .on('error', (error) => {
        let args = Array.prototype.slice.call(arguments);
        notify.onError({
          title   : 'Error: ' + error.relativePath,
          message : error.messageOriginal
        }).apply(this, args);
        console.log('\n');
        console.log('File:   ', error.file);
        console.log('Line:   ', error.line);
        console.log('Column: ', error.column);
        console.log('\n');
        console.log(error.formatted);
        this.emit('end')
      })
      .pipe(autoprefixer({
        browsers : ['last 5 versions'],
        cascade  : false
      }))
      .pipe(rename('style.css'))
      .pipe(sourcemaps.write('css/maps'))
      .pipe(gulp.dest(dist))
      .pipe(browserSync.stream({match: '**/*.css'}));
  });

  // COMPILE TEMPLATES (HANDLEBARS)
  gulp.task('templates', () => {
    let _config = {
      ignorePartials : true,
      partials       : {},
      batch          : ['./src/templates/components'],
      helpers        : {}
    }
    return gulp.src('./src/templates/*.handlebars')
      .pipe(handlebars(require('./src/templates/_configs/data.json'), _config))
      .pipe(rename( (path) => {path.extname = ".php";} ))
      .pipe(gulp.dest(dist))
      .pipe(browserSync.stream());
  });

  // COPY ASSETS
  gulp.task('assets', () => {
    return gulp.src('./src/assets/**/*.*')
      .pipe(gulp.dest(dist+'/assets'))
  });

/*---------------------------------------------------------------*/
  // BUILD
  gulp.task('build',['browserify','templates','sass','assets','scripts']);

  // WATCH
  gulp.task('watch',['build'],() => {
    gulp.watch('./src/js/main.js',                           ['browserify']);
    gulp.watch(['./src/js/vendors.js','./src/js/onload.js'], ['scripts']);
    gulp.watch('./src/templates/**/*.*',                     ['templates']);
    gulp.watch('./src/scss/**/*.scss',                       ['sass']);
  });

  // SYNC
  gulp.task('sync',['build','browser-sync'],() => {
    gulp.watch('./src/js/main.js',                           ['browserify']).on('change',browserSync.reload);
    gulp.watch(['./src/js/vendors.js','./src/js/onload.js'], ['scripts']).on('change',browserSync.reload);
    gulp.watch('./src/templates/**/*.*',                     ['templates']).on('change',browserSync.reload);
    gulp.watch('./src/scss/**/*.scss',                       ['sass']);
  });

  // DEFAULT
  if (args.sync) {
    gulp.task('default', ['sync']);
  } else if (args.watch) {
    gulp.task('default', ['watch']);
  } else {
    gulp.task('default', ['build']);
  }

