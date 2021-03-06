var
  gulp        = require('gulp'),
  browserSync = require('browser-sync'),
  sass        = require('gulp-sass'),
  concat      = require('gulp-concat'),
  templateCache = require('gulp-angular-templatecache'),
  useref = require('gulp-useref')
;

function handleError (error) {
    console.log(error.toString());
    this.emit('end');
}

// build

gulp.task('copy', function() {
  return gulp.src('./app/*.html')
      .pipe(useref())
      .pipe(gulp.dest('./build'))
});

// Dev

gulp.task('serve', ['sass'], function() {
    browserSync.init({
        server: "./app"
    })
    gulp.watch("./app/sass/**/*.scss", ['sass']).on('change', browserSync.reload)
    gulp.watch("./app/**/*.js").on('change', browserSync.reload)
    gulp.watch("./app/**/*.html", ['templates']).on('change', browserSync.reload)

})
gulp.task('sass', function() {
    return gulp.src("./app/sass/*.scss")
        .pipe(sass())
        .on('error', handleError)
        .pipe(gulp.dest("./app/css/"))
})
gulp.task('templates', function(){
  return gulp.src([
      './app/scripts/**/*.html'
  ])
  .pipe(templateCache({module:'templates', standalone:true}))
  .pipe(gulp.dest('./app/scripts'))
  .pipe(browserSync.stream());
});

// Tasks

gulp.task('dev', ['sass', 'templates']);
gulp.task('default', ['dev', 'serve']);
