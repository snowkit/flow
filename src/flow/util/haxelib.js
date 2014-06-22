
var cmd = require('./process');

//caches a list of installed haxelibs for the remaining execution,
var libs = {};

    exports.path = function(flow, name) {

        console.log('flow / haxelib get path for ' + name);

        if(libs[name]) {
            return libs[name].path;
        }

        var path = cmd.execsync('haxelib path ' + name);

            //clean up trailing whitespace
        path = path.trim();

            //for each line we need to find the one without - in front
        var lines = path.split('\n');
        for(index in lines) {
            var line = lines[index];
            if(line.charAt(0) != '-') {
                path = line;
                break;
            }
        }

        libs[name] = {
            name : name,
            path : path
        };

        return path;

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