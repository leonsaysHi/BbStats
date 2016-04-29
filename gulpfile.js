var
  gulp        = require('gulp'),
  browserSync = require('browser-sync'),
  sass        = require('gulp-sass'),
  concat      = require('gulp-concat'),
  templateCache = require('gulp-angular-templatecache');
;

// Static Server + watching scss/html files
gulp.task('serve', ['sass'], function() {

    browserSync.init({
        server: "./build/"
    });

    gulp.watch("./stylesheets/**/*.scss", ['sass']);
    gulp.watch("./app/**/*.js", ['scripts']);
    gulp.watch("./app/**/*.html", ['templates']);

});

// Compile sass into CSS & auto-inject into browsers
function handleError (error) {
    console.log(error.toString());
    this.emit('end');
}
gulp.task('sass', function() {
    return gulp.src("./stylesheets/*.scss")
        .pipe(sass())
        .on('error', handleError)
        .pipe(gulp.dest("./build/"))
        .pipe(browserSync.stream());
});

// generate ferring.js and bootstrap.js
gulp.task('scripts', function() {
    return gulp.src([
        './app/angular.js',
        './app/angular-route.js',
        './app/angular-animate.js',
        './app/angular-indexed-db.js',
        './app/bbstats.js',
        './app/templates.js',
        './app/main/*.js',
        './app/game/*.js',
        './app/gameconfig/*.js'
    ])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./build/'))
    .pipe(browserSync.stream());
});

gulp.task('templates', function(){
  return gulp.src([
      './app/**/*.html'
  ])
  .pipe(templateCache({module:'bbstats'}))
  .pipe(gulp.dest('./add/'))
  .pipe(browserSync.stream());
});


gulp.task('default', ['serve']);

gulp.task('browser-sync', function() {
    browserSync.init({
        proxy: "bbstats.dev"
    });
});
