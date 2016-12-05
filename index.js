'use strict';

var es = require('event-stream');
var path = require('path');
var cancat = require('gulp-concat');
var gutil = require('gulp-util');

var getDeps = function (file) {
    var relativePath = path.relative(file.base, file.path);

    var content = String(file.contents);
    var deps = [];
    var matchs;
    var _id;
    var _deps = [];
    var R = /(^|\W|\s)angular\s*\.\s*module\s*\(\s*['"]([\w\d_\.-]+)['"]\s*,\s*\[([^\]]*)\]\s*\)/gm;

    while ((matchs = R.exec(content))) {
        if (matchs.length) {
            _id = matchs[2].trim();
            _deps = matchs[3].replace(/['"\r\n\s*]/g, '').split(',');
            deps.push({
                id: _id,
                type: 'js',
                path: relativePath,
                deps: _deps
            });
        }
    }

    return deps;
};

var getDepsFiles = function () {
    return function (file, cb) {
        if (file.processedBytempDepsMap) {
            return cb(null, file);
        }
        if (file.isNull()) {
            return cb(null, file);
        }
        if (file.isStream()) {
            return cb(new gutil.PluginError('map', 'doesn\'t support Streams'));
        }
        var deps = getDeps(file);

        var str = [];

        deps.forEach(function (dep) {
            if (dep && dep.id) {
                str.push(JSON.stringify(dep));
            }
        });
        file.processedBytempDepsMap = true;

        if (str.length) {
            file.contents = new Buffer(str.join('\n'));
            cb(null, file);
        } else {
            cb();
        }
        return null;
    };
};

var depsMap = function () {
    return es.map(getDepsFiles());
};

var getItemDeps = function (maps, deps, d) {
    if (deps.length !== 0 && deps[0] !== '') {
        deps.forEach(function (item) {
            getItemDeps(maps, maps[item].deps, d);
            if (d.indexOf(item) === -1) {
                d.push(item);
            }
        });
        deps.splice(0, deps.length, '');
    } else {
        return;
    }
};

var depsReduce = function () {
    return es.map(function (file, cb) {
        var content = String(file.contents);
        var deps = content.split('\n');

        deps = deps.map(function (dep) {
            return JSON.parse(dep);
        });

        var maps = {};

        deps.forEach(function (item) {
            if (!maps[item.id]) {
                maps[item.id] = item;
                delete item.id;
            }
        });

        for (var i in maps) {
            if (maps.hasOwnProperty(i)) {
                var d = [];
                getItemDeps(maps, maps[i].deps, d);
                maps[i].deps = d;
            }
        }

        maps = JSON.stringify(maps, null, 4);

        file.contents = new Buffer(maps);

        cb(null, file);
        return null;
    });
};

module.exports = function (filename) {
    var file = filename || 'map.json';

    return es.pipeline(
        depsMap(),
        cancat(file),
        depsReduce()
    );
};
