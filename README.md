# gulp-spa-map

> 解析模块所依赖的所有模块,将依赖关系输出到指定的文件中

##### options

* type：String
* 文件名，默认map.json

##### 使用

```
'use strict';

var map = require('gulp-spa-map');

module.exports = function (gulp) {
    gulp.task('map', function () {
        return gulp.src([
            'src/pages/**/*.js',
            '!src/pages/*.js',
            '!src/pages/lib/**/*.js'
        ])
        .pipe(map())
        .pipe(gulp.dest('src/'));
    });
}
```

生成的map.json如下：

```
{
    "two.two": {
        "type": "js",
        "path": "two/two.js",
        "deps": [
            "two.directive.twodir"
        ]
    },
    "one.one": {
        "type": "js",
        "path": "one/one.js",
        "deps": [
            "one.directive.oneonedir",
            "one.directive.onedir"
        ]
    },
    "two.directive.twodir": {
        "type": "js",
        "path": "two/directive/twodir/twodir.js",
        "deps": []
    },
    "one.directive.onedir": {
        "type": "js",
        "path": "one/directive/onedir/onedir.js",
        "deps": []
    },
    "one.directive.oneonedir": {
        "type": "js",
        "path": "one/directive/oneonedir/oneonedir.js",
        "deps": []
    }
}
```