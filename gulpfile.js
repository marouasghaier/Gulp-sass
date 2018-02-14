//Gulp plugins
var gulp = require("gulp"),//http://gulpjs.com/
    sass = require("gulp-sass"),//https://www.npmjs.org/package/gulp-sass
    autoprefixer = require('gulp-autoprefixer'),//https://www.npmjs.org/package/gulp-autoprefixer
    minifycss = require('gulp-minify-css'),//https://www.npmjs.org/package/gulp-minify-css
    rename = require('gulp-rename'),//https://www.npmjs.org/package/gulp-rename
    concat = require('gulp-concat'),//https://www.npmjs.com/package/gulp-concat
    clean = require('gulp-rimraf'),//https://www.npmjs.com/package/gulp-rimraf
    flatten = require('gulp-flatten'),//https://www.npmjs.com/package/gulp-flatten
    replace = require('gulp-replace'),//https://www.npmjs.com/package/gulp-replace
    uglify = require('gulp-uglify'),//https://www.npmjs.com/package/gulp-uglify
    browserSync = require('browser-sync'),//http://www.browsersync.io/docs/gulp/
    reload      = browserSync.reload,
    jsValidate = require('gulp-jsvalidate'),//https://www.npmjs.com/package/gulp-jsvalidate
    notify = require('gulp-notify'),//https://www.npmjs.com/package/gulp-notify
    sourcemaps = require('gulp-sourcemaps'),//https://www.npmjs.com/package/gulp-sourcemaps
    inject = require('gulp-inject'),
    streamqueue = require('streamqueue'),
    gulpFilter   = require('gulp-filter'),
    cssimport = require('gulp-cssimport'),
    sassruby = require('gulp-ruby-sass');


var distFolder = "dist/assets/";



//If we review the code, we can see two main gulp operations.
    //gulp.src : tells gulp what files to work on with this task.
    //gulp.dist : tells gulp where to drop off files after this task is finished working on them.


// Moving Files
var filesToMove = [
    'src/fonts/**/*.otf',
    'src/fonts/**/*.woff',
    'src/fonts/**/*.woff2',
    'src/fonts/**/*.eot',
    'src/fonts/**/*.ttf',
    'src/fonts/**/*.css'
];

gulp.task('move', function() {
    return gulp.src(filesToMove, { base: 'src/fonts/' })
        .pipe(flatten())// Use flat paths in the same directory
        .pipe(gulp.dest(distFolder + 'fonts'));
});


// Clean Folder
gulp.task('clean', function(cb) {
    return gulp.src(distFolder + 'fonts/**/*.css', { read: false })
        .pipe(clean({ force: true }));//{ read: false } This tells the task to not read the contents of the files it is deleting
    cb(err);
});

// Compile Sass & Concatenate & Minify CSS
var sassFiles = "src/sass/**/*.scss";
var filter = gulpFilter(['src/sass/**/*.scss'], { restore: true });
gulp.task('css', ['clean'], function(){
    return streamqueue({ objectMode: true },
        gulp.src(sassFiles)
            .pipe(sass({ sourcemap: true, style: 'compact' })) // Compile sass en css
            .pipe(sourcemaps.init({loadMaps: true})),
        gulp.src([distFolder + 'css/main.css', 'src/fonts/**/*.css', 'src/js/plugins/**/*.css'])// Merge main.css with all stylesheet.css
            .pipe(cssimport())
            .pipe(autoprefixer('last 2 versions')))// Add prefix for all browser
        .pipe(concat(distFolder + 'css/all.css')) // Concatenation in all.css
        .pipe(replace('./', '../fonts/'))// Replace url in css
        .pipe(gulp.dest('./'))
        .pipe(rename({suffix: '.min'})) // Create the same fichier + Add.min (rename)
        .pipe(minifycss())// Minifier le ficher dest
        // for file sourcemaps
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('.', {
            includeContent: true,
            sourceRoot: 'src/sass/**/*.scss'
        }))
        //.pipe(filter.restore) // Restore original files
        .pipe(gulp.dest('./'))
        .pipe(reload({stream: true}));// will auto-update + auto-inject into browsers
});

// sassFiless
var sassFiless = [
    'src/sass/**/*.scss',
    'src/fonts/**/*.css',
    'src/js/plugins/**/*.css'
];

gulp.task('scss-to-css', function() {

    return sassruby('src/sass/**/*.scss', { sourcemap: true })
        .pipe(sourcemaps.write())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(concat(distFolder + 'css/scss-source.css')) // Concatenation in all.css
        .pipe(sourcemaps.write())
        .pipe(gulp.dest( './' ));
});


//Validate JS
gulp.task('validate-js', function () {
    return gulp.src("src/js/**/*.js")
        .pipe(jsValidate())// Validate our javascript
        .on("error", notify.onError(function(error) { // When gulp-jsvalidate finds an error
            return error.message; // We need to use gulp-notify to send a notification with the error message.
        }));
});

// Concatenate & Minify JS
gulp.task('scripts', function() {
    return gulp.src(['src/js/custom.js', 'src/js/**/*.js'])// Merge custom.js with all scripts.js
        .pipe(concat(distFolder + 'js/all.js'))
        .pipe(gulp.dest('./'))
        .pipe(rename('all.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(distFolder + 'js/'));
});

// Injection
gulp.task('inject', function () {
    var target = gulp.src('index.html');
    // It's not necessary to read the files (will speed up things), we're only after their paths:
    var sources = gulp.src([distFolder + 'js/all.min.js', distFolder + 'css/all.min.css'], {read: true});

    return target.pipe(inject(sources))
        .pipe(gulp.dest('./'));
});

//Watch Files For Changes
gulp.task('default', ['clean', 'css', 'scss-to-css', 'move', 'validate-js', 'scripts','inject']);


// Default Task
gulp.task("watch", function(){
    gulp.watch(['src/**'], ['default']);
});





