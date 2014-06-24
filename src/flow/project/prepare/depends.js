var   path = require('path')
    , fs = require('graceful-fs')
    , util = require('../../util/util')
    , haxelib = require('../../util/haxelib')
    , projects = require('../project')


    //return all dependencies, as {found:{}, failed:{}}
exports.parse = function parse(flow, project, result, depth) {

        //recursive, so use the one passed in otherwise
    result = result || { found:{}, failed:{} };
    depth = depth || 1;

    // console.log('flow / %s parsing dependencies for %s', util.pad(depth*2, '', ' '), project.name);

    var depends = project.build.dependencies;
    var found = {};
    var failed = {};

    if(depends) {

        for(depend in depends) {

            var depend_version = depends[depend];
            var has = haxelib.version(flow, depend, depend_version);

            if(!has) {
                failed[depend] = { name:depend, version:depend_version };
                console.log('flow / %s - missing dependency %s %s', util.pad(depth*3, '', ' '), depend, depend_version);
            } else {
                found[depend] = { name:depend, version:depend_version, path:has.path };
                console.log('flow / %s - found dependency %s %s', util.pad(depth*3, '', ' '), depend, depend_version);
            }

        } //each depends

    } else {//has dependencies

        console.log('flow / %s %s lists no dependencies', util.pad(depth*3, '', ' '), project.name);

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
        var project_file = path.join(lib.path, flow.project.default);
        var state = projects.verify(flow, project_file, true);

            //store the project value for the dependency
        lib.project = state.parsed;

            //it's ok to be missing a project file,
            //because these are optional files
            //so we only use valid ones
        if(lib.project == null) {

                //if it's null, but not missing, it's a syntax issue
                //in which case totally abort
            if(state.reason.indexOf('cannot find') == -1) {
                console.log('\n', state.reason);
                return result = null;
            }
                //but if not, at least try and parse the version
                //information from the haxelib.json because it will be defined
                //in the flags later on before baking
            var haxelib_json = path.join(lib.path, 'haxelib.json');
            if(fs.existsSync(haxelib_json)) {
                var json = JSON.parse( fs.readFileSync(haxelib_json, 'utf8') );
                lib.project = { name:lib.name, version:json.version, build:{} };
            } else {
                //nothing we can do to define this, so ...
                lib.project = { name:lib.name, version:'', build:{} };
            }

        } else {
            //for valid project files though, we can continue parsing their deps
            //but only if the found deps dont contain our name, to avoid
            //recursive dependencies

            if(!result.found[project.name]) {
                result = exports.parse(flow, state.parsed, result, depth+1);
            }
        }

    } //each found

    return result;

} //depends
