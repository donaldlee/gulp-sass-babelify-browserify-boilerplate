'use strict';

var babelify      = require('babelify');
var browserify    = require('browserify');
var browserSync   = require("browser-sync").create();
var gulp          = require('gulp');
var autoprefixer  = require('gulp-autoprefixer');
var handlebars    = require('gulp-compile-handlebars');
var includeFiles  = require('gulp-file-include');
var gulpif        = require('gulp-if');
var notify        = require('gulp-notify');
var rename        = require('gulp-rename');
var sourcemaps    = require('gulp-sourcemaps');
var sass          = require('gulp-sass');
var uglify        = require('gulp-uglify');
var minimist      = require('minimist');
var buffer        = require('vinyl-buffer')
var source        = require('vinyl-source-stream');

var args = minimist(process.argv.slice(2));

  // INIT BROWSER-SYNC
  gulp.task('browser-sync', function() {
    browserSync.init({
      server: "./dist",
      reloadDelay: 0,
      startPath: ""
    });
  });

  // COMPILE MAIN.JS (BROWSERIFY)
  gulp.task('browserify', function() {
    return browserify('./src/js/main.js')
      .transform('babelify')
      .bundle()
      .on('error', function (error) {
        var args = Array.prototype.slice.call(arguments);
        notify.onError({
          title:"Javascript Error",
          message: error.message.split('.js: ')[1]
        }).apply(this, args);
        console.log(error)
        this.emit("end")
      })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(gulpif(args.staging || args.production, uglify()))
      .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest('./dist/js'))
      .pipe(browserSync.stream());
  });

  // COMPILE VENDORS
  gulp.task("vendors", function(){
    return gulp.src("./src/js/vendors.js")
      .pipe(sourcemaps.init())
      .pipe(includeFiles({prefix: '@@', basepath: '@file'}))
      .pipe(gulpif(args.staging || args.production, uglify()))
      .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest('./dist/js'));
  });

  // COPY ONLOAD SCRIPTS
  gulp.task('onload', function(){
    return gulp.src("./src/js/onload.js")
      .pipe(sourcemaps.init())
      .pipe(includeFiles({prefix: '@@', basepath: '@file'}))
      .pipe(gulpif(args.staging || args.production, uglify()))
      .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest('./dist/js'));
  });

  // COMPILE STYLE.CSS (SASS)
  gulp.task('sass', function () {
    return gulp.src('./src/scss/**.scss')
      .pipe(sourcemaps.init())
      .pipe(gulpif(args.staging || args.production, sass({outputStyle:"compressed"}), sass({outputStyle:"compact"})))
      .on('error', function (error) {
        var args = Array.prototype.slice.call(arguments);
        notify.onError({
          title: "Error: "+error.relativePath,
          message: error.messageOriginal
        }).apply(this, args);
        console.log();
        console.log('File:   ',error.file);
        console.log('Line:   ',error.line);
        console.log('Column: ',error.column);
        console.log();
        console.log(error.formatted);
        this.emit("end")
      })
      .pipe(autoprefixer({
        browsers : ['last 5 versions'],
        cascade : false
      }))
      .pipe(rename({extname: ".css"}))
      .pipe(sourcemaps.write('maps'))
      .pipe(gulp.dest('./dist/css'))
      .pipe(browserSync.stream({match: "**/*.css"}));
  });

  // COMPILE HTML (HANDLEBARS)
  gulp.task('html', function() {
    var _config = {
      ignorePartials: true,
      partials : {},
      batch           : ['./src/html/components'],
      helpers : {}
    }
    return gulp.src('./src/html/*.handlebars')
      .pipe(handlebars(require('./src/html/configs/data.json'), _config))
      .pipe(rename(function (path) {path.extname = ".html";}))
      .pipe(gulp.dest('./dist'))
      .pipe(browserSync.stream());
  });

  // COPY ASSETS
  gulp.task('assets', function(){
    return gulp.src('./src/assets/**/*.*')
      .pipe(gulp.dest('./dist/assets'));
  });

/*---------------------------------------------------------------*/
  // BUILD
  gulp.task('build',['browserify','html','sass','assets','vendors','onload']);

  // WATCH
  gulp.task('watch',['build'],function(){
    gulp.watch('./src/js/**/*.*',       ['browserify']);
    gulp.watch('./src/html/**/*.*',     ['html']);
    gulp.watch('./src/scss/**/*.scss',  ['sass']);
  });

  // SYNC
  gulp.task('sync',['build','browser-sync'],function(){
    gulp.watch('./src/js/**/**/*.*',      ['browserify']).on('change',browserSync.reload);
    gulp.watch('./src/html/**/*.*',       ['html']).on('change',browserSync.reload);
    gulp.watch('./src/scss/**/**/*.scss', ['sass']);
  });

  // DEFAULT
  if ( args.sync ) {
    gulp.task("default", ["sync"]);
  } else if ( args.watch ) {
    gulp.task("default", ["watch"]);
  } else {
    gulp.task("default", ["build"]);
  }

