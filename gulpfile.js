var gulp = require('gulp');
var plugins = require("gulp-load-plugins")({lazy:false});
var sass = require('gulp-sass');

gulp.task('scripts', function(){
    //combine all js files of the app
    gulp.src(['!./app/**/*_test.js','./app/**/*.js'])
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('default'))
        .pipe(plugins.concat('app.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('templates',function(){
    //combine all template files of the app into a js file
    gulp.src(['!./app/index.html',
        './app/**/*.html'])
        .pipe(plugins.angularTemplatecache('templates.js',{standalone:true}))
        .pipe(gulp.dest('./build'));
});

gulp.task('css', function(){
    gulp.src('./app/**/*.css')
        .pipe(plugins.concat('app.css'))
        .pipe(gulp.dest('./build'));
});

gulp.task('vendorJS', function(){
    //concatenate vendor JS files
    gulp.src([
            './bower_components/angular/angular.js',
            './bower_components/angular-indexedDB/angular-indexed-db.js',
            './bower_components/angular-route/angular-route.js',
            './bower_components/angular-ui-router/release/angular-ui-router.min.js',
            './bower_components/angular-animate/angular-animate.min.js',
            './bower_components/jquery/dist/jquery.js',
            './bower_components/foundation/js/foundation.js'
        ])
        .pipe(plugins.concat('lib.js'))
        .pipe(gulp.dest('./build'));
});

gulp.task('copy-index', function() {
    gulp.src('./app/index.html')    
        .pipe(gulp.dest('./build'));
});

gulp.task('watch',function(){
    gulp.watch([
        'build/**/*.html',        
        'build/**/*.js',
        'build/**/*.css'        
    ], function(event) {
        return gulp.src(event.path)
            .pipe(plugins.connect.reload());
    });
    gulp.watch(['./app/**/*.js','!./app/**/*test.js'],['scripts']);
    gulp.watch(['!./app/index.html','./app/**/*.html'],['templates']);
    gulp.watch('./stylesheets/**/*.scss',['sass']);
    gulp.watch('./app/**/*.css',['css']);
    gulp.watch('./app/index.html',['copy-index']);

});

gulp.task('sass', function () {
    gulp.src('stylesheets/app.scss')
        .pipe(sass()) 
        .pipe(gulp.dest('app/'))
    ;
});

gulp.task('connect', plugins.connect.server({
    root: ['build'],
    port: 9000,
    livereload: true
}));

gulp.task('default',['connect','scripts','templates','sass','css','copy-index','vendorJS','watch']);