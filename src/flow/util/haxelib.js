
var   cmd = require('./process')
    , path = require('path')
    , util = require('./util')
    , fs = require('graceful-fs')

//caches a list of installed haxelibs for the remaining execution,
var libs = {};
var internal = {};


    function HaxelibError(message) {
        this.name = "HaxelibError";
        this.message = message;
    }

    HaxelibError.prototype = Error.prototype;

    exports.init = function init(flow, done) {

            //find haxelib library path
        cmd.exec(flow, 'haxe', ['-version'], { quiet:true }, function(code, out, err) {

            var version = out || err;
            version = version.trim()

            flow.log(2, 'haxe version %s', version);

            var parts = version.split('.');
            flow.haxe = {
                version: version,
                major:parts[0],
                minor:parts[1],
                patch:parts[2]
            }

            exports.init_haxelib(flow, done);

        });

    }

        //caches all libs and values from haxelib list
    exports.init_haxelib = function init_haxelib(flow, done) {

            //always reset these because we are flushing cache
        libs = {};

            //find haxelib library path
        cmd.exec(flow, 'haxelib', ['config'], {quiet:true}, function(code, out, err) {

            if(code != 0) {
                var reason = '> haxelib config cannot be called. Is haxe/haxelib installed?\n';
                throw new HaxelibError(reason);
            }

            exports.haxelib_path = util.normalize(out.trim());

            flow.log(3, 'haxelib path %s', exports.haxelib_path);

                //find and cache the list

            cmd.exec(flow, 'haxelib', ['list'], {quiet:true}, function(lcode, lout, lerr) {

                var list = lout.trim();
                var name_ver = /^([.0-9a-zA-Z-_]*)(:{1})\s(.*)$/igm;

                var match = name_ver.exec(list);
                while (match != null) {
                    var name = match[1];
                    libs[name] = { name:name, _versions_ : match[3] }
                    match = name_ver.exec(list);
                }

                internal.parse_versions(flow);

                if(done) {
                    done();
                }

            });

        });

    } //init

    exports.current = function current(flow, name) {
        if(libs[name]) {
            return libs[name].versions['*'];
        } else {
            return null;
        }
    }

    exports.version = function version(flow, name, ver) {

        if(libs[name]) {
            return libs[name].versions[ver];
        } else {
            return null;
        }

    } //version

    exports.version_list = function version_list(flow, name) {

        var result = [];

        if(libs[name]) {
            var versions = libs[name].versions;
            for(index in versions) {
                if(index != '*') {
                    if(index == 'dev') {
                        result.push(index + ':' + versions[index]);
                    } else {
                        result.push(index);
                    }
                }
            }
        }

        return result.join(', ');

    } //version

    exports.json = function json(flow, name, version) {

            //current if none specified
        version = version || "*";

        flow.log(3, 'haxelib get json for %s(%s)', name, version );

        if(!libs[name]) {
            flow.log(1, 'haxelib - get json for %s(%s) failed, no haxelib under that name', name, version );
            return;
        }

        var lib_path = libs[name].versions[version].path;
        var json_path = path.resolve(lib_path, 'haxelib.json');

        if(fs.existsSync(json_path)) {
            try {
                return require(json_path);
            } catch(e) {
                flow.log(1, 'haxelib.json failed to parse, from %s', json_path);
            }
        }

    } //json

    exports.path = function path(flow, name, version) {

            //current if none specified
        version = version || "*";

        flow.log(3, 'haxelib get path for %s(%s)', name, version );

        return libs[name].versions[version].path;

    } //path

    exports.get = function(flow, name) {

        return libs[name];

    } //get

internal.parse_versions = function(flow) {

    for(lib in libs) {

        var _lib = libs[lib];
        var _split = /([^\s[]+|\[.*\])/igm;
        var _vlist = _lib._versions_.split(_split);

        _lib.versions = {};

        for(index in _vlist) {

            var v = _vlist[index].trim();
            if(!v) continue;
            var current = v.indexOf('[') != -1;

                //strip [ ] if current
            if(current) {
                v = v.replace(/\[(.*)\]/gi,'$1');
            }

            var lib_path = '';
            if(v.substr(0,4) == 'dev:') {
                    //dev path is already here, so store it
                lib_path = v.replace(/dev:/gi,'');
                    //set name to dev
                v = 'dev';
            } else if(v == 'git') {
                    //git folder is in the root like so
                lib_path = path.join( exports.haxelib_path, lib, 'git' );
            } else {
                    //the other types becomes /v,e,r/
                lib_path = path.join( exports.haxelib_path, lib.replace(/\./gi,','), v.replace(/\./gi,',') );
            }

            lib_path = util.normalize(lib_path, true);
            _lib.versions[v] = { version:v, path:lib_path };

            if(current) {
                _lib.versions['*'] = { version:v, path:lib_path };
            }

                //remove _versions_
            delete _lib._versions_;

        } //each in vlist

        flow.log(4, lib, _lib.versions);

    } //each in libs

}
