
var   cmd = require('./process')
    , path = require('path')

//caches a list of installed haxelibs for the remaining execution,
var libs = {};

    function HaxelibError(message) {
        this.name = "HaxelibError";
        this.message = message;
    }

    HaxelibError.prototype = Error.prototype;

        //caches all libs and values from haxelib list
    exports.init = function init(flow) {

            //always reset these because we are flushing cache
        libs = {};

            //find haxelib library path
        var out = cmd.execsync('haxelib config');
        if(out.code != 0) {
            var reason = '> haxelib config cannot be called. Is haxe/haxelib installed?\n';
            throw new HaxelibError(reason);
        }

        var haxelib_path = out.output.trim();

            //find and cache the list

        var out = cmd.execsync('haxelib list');
        var list = out.output.trim();
        var name_ver = /^([a-zA-Z-_]*)(:{1})\s(.*)$/igm;

        var match = name_ver.exec(list);
        while (match != null) {
            var name = match[1];
            libs[name] = { name:name, _versions_ : match[3] }
            match = name_ver.exec(list);
        }

            //now we must split up the version string into usable values
        for(lib in libs) {

            var _lib = libs[lib];
            var _vlist = _lib._versions_.split(' ');

            _lib.versions = {};

            for(index in _vlist) {

                var v = _vlist[index].trim();
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
                    lib_path = haxelib_path + '/' + name + '/git';
                } else {
                        //the other types becomes /v,e,r/
                    lib_path = haxelib_path + '/' + v.replace(/\./gi,',');
                }

                lib_path = path.normalize(lib_path) + '/';
                _lib.versions[v] = { version:v, path:lib_path };

                if(current) {
                    _lib.versions['*'] = { version:v, path:lib_path };
                }

                    //remove _versions_
                delete _lib._versions_;

            } //each in vlist
        } //each in libs

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

    exports.path = function path(flow, name, version) {

            //current if none specified
        version = version = "*";

        console.log('flow / haxelib get path for %s(%s)', name, version );

        return libs[name].versions[version].path;

    } //path

    exports.get = function(flow, name) {

        return libs[name];

    } //get