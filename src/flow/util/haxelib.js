
var   cmd = require('./process')
    , path = require('path')

//caches a list of installed haxelibs for the remaining execution,
var libs = {};

    exports.path = function(flow, name) {

        console.log('flow / haxelib get path for ' + name);

        if(libs[name]) {
            return libs[name].path;
        }

        var result = cmd.execsync('haxelib path ' + name);

        if(result.code != 0) {
            return '';
        } else {
            result = result.output.trim();
        }

            //for each line we need to find the one without - in front
        var lines = result.split('\n');
        for(index in lines) {
            var line = lines[index].trim();
            if(line.charAt(0) != '-') {
                result = path.normalize(line);
                break;
            }
        }

        if(libs[name]) {
            libs[name].path = result;
        } else {
            libs[name] = {
                name : name,
                path : result
            };
        }

        return result;

    } //path

    exports.get = function(flow, name) {

        if(!libs[name]) {
            libs[name] = {
                name : name,
                path : exports.path(flow, name)
            };
        }

        return libs[name];

    } //get