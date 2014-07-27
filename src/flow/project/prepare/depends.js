var   path = require('path')
    , fs = require('graceful-fs')
    , util = require('../../util/util')
    , haxelib = require('../../util/haxelib')
    , prepare = require('../prepare')

    //return all dependencies, as {found:{}, failed:{}}


exports.parse = function parse(flow, parsed, result, depth) {
        //recursive, so use the one passed in otherwise
    result = result || { found:{}, failed:{} };
    depth = depth || 1;

    prepare.log(flow, 3, '%s parsing dependencies for %s', util.pad(depth*2, '', ' '), parsed.project.name);

    var depends = parsed.project.build.dependencies;
    var found = {};
    var failed = {};

    if(depends) {

        for(name in depends) {

            var depend = depends[name];
            var is_internal = false;
            var custom_flowfile = '';
            var depend_version = '*';

                //if this is dependency with a custom flow file
                //or other options it will be a { } instead of a string
            if(depend.constructor == Object) {
                depend_version = depend.version || '*';
                custom_flowfile = depend.flow_file || '';
                is_internal = depend.internal || false;
            } else {
                if(depend.indexOf('.flow') != -1) {
                    custom_flowfile = depend;
                    depend_version = '*';
                } else {
                    depend_version = depend;
                }
            }

            if(is_internal) {

                found[name] = flow.project.internal_depends[name];

            } else {

                var has = haxelib.version(flow, name, depend_version);

                if(!has) {
                    failed[name] = { name:name, version:depend_version };
                    prepare.log(flow, 3, '        - %s - missing dependency %s %s', util.pad(depth*2, '', ' '), name, depend_version);
                } else {

                    found[name] = { name:name, version:depend_version, path:has.path };

                    if(custom_flowfile) {
                        custom_flowfile = path.resolve(flow.project.root, custom_flowfile);
                        found[name].flow_file = custom_flowfile;
                    }

                    prepare.log(flow, 3, '        - %s - found dependency %s %s %s', util.pad(depth*2, '', ' '), name, depend_version, custom_flowfile);

                }
            }

        } //each depends

    } else {//has dependencies

        prepare.log(flow, 3, 'prepare - %s %s lists no dependencies', util.pad(depth*3, '', ' '), parsed.project.name);

    }

        //store in the results, but
        //don't override them because it goes bottom up,
        //meaning dep1 -> dep2 -> proj, a value in dep2 must override dep1
        //and a value in proj must override both
    for(depend in failed) {
        if(!result.failed[depend]) {
            result.failed[depend] = failed[depend];
        }
    } //each failed

    for(depend in found) {
        if(!result.found[depend]) {
            result.found[depend] = found[depend];
        }
    } //each found

        //finally, for each locally found dependency, verify its project (if any)
    for(depend in found) {

        var lib = found[depend];
        var project_file = flow.project.default_name;

        //if the project has no explicit path given (from internal only atm)
        //we check the folder for any .flow files

        if(!lib.flow_file) {

            var flow_files = flow.project.find_flow_files(flow, lib.path);

            if(flow_files.length > 1) {
                return fail_verify('dependency %s has multiple *.flow files in the root (%s), cannot guess which to use. projects should only keep one root *.flow file in the root', depend, lib.path);
            } else if(flow_files.length == 1) {
                project_file = flow_files[0];
            }

            project_file = path.join(lib.path, project_file);

        } else {
                //but if it does...
            project_file = lib.flow_file;
        }

        flow.log(5, '       looking for dependency project file (maybe) at %s', project_file);

        var state = flow.project.verify(flow, project_file, lib.path, true);

            //store the project value for the dependency
        lib.project = state.parsed;

            //it's ok to be missing a project file,
            //because these are optional files
            //so we only use valid ones
        if(lib.project == null) {

            flow.log(3, 'prepare - %s - %s has no flow file, this is not an error state', util.pad(depth*2, '', ' '), depend);

                //if it's null, but not missing, it's a syntax issue
                //in which case totally abort, this is silly code, could be better
            if(state.reason.indexOf('cannot find') == -1) {
                prepare.log(flow, 1, '\n', state.reason);
                return result = null;
            }

                //but if not, at least try and parse the version
                //information from the haxelib.json because it will be defined
                //in the flags later on before baking
            var haxelib_json = path.join(lib.path, 'haxelib.json');

            if(fs.existsSync(haxelib_json)) {
                var json = JSON.parse( fs.readFileSync(haxelib_json, 'utf8') );
                var deps = {};
                var depCount = 0;
                //Gather haxelib dependencies
                for(k in json.dependencies){
                    depCount++;
                    deps[k] = {version:json.dependencies[k]};
                }
                lib.project = { project: { name:lib.name, version:json.version, build:{dependencies:deps} } };
                prepare.log(flow, 3, 'prepare - %s - found a haxelib json with %s dependencies, it says %s ', util.pad(depth*2, '', ' '),depCount, json.version);
            } else {
                prepare.log(flow,3,'prepare - %s - unable to find any information about this dependency from the haxelib json, so it will have blank information and just the path will be add to -cp and the define be generated... nothing else can happen with this dependency');
                //nothing we can do to define this, so ...
                lib.project = { project : { name:lib.name, version:'', build:{} } };
            }

        }

        result = exports.parse(flow, lib.project, result, depth+1);

    } //each found

    return result;

} //depends
