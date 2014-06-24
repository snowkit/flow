var   path = require('path')
    , haxelib = require('../util/haxelib')
    , util = require('../util/util')
    , projects = require('./project')

    , depends = require('./prepare/depends')
    , defines = require('./prepare/defines')
    , flags = require('./prepare/flags')

var internal = {};

    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.prepare = function prepare(flow, build_config) {

    flow.project.depends = flow.project.depends || {};

        //preparation starts with the parsed project
    var project = flow.project.parsed;

    console.log('\nflow / preparing project %s', project.name );

        //dependencies are a special case as they affect everything, they
        //come first and are required to be complete before anything else
    var _depends = internal.prepare_dependencies(flow, project, build_config);

        //get out early if missing any dependency
    if(_depends == null) {
        return null;
    }

        //start at the project base
    var prepared = {
        source : util.deep_copy(project),
        depends : _depends,
        defines_all : {}
    }

        //after dependencies, we process the defines as the rest will depend on them
        //and error out if there are any parsing or other errors in there.
    if(!internal.prepare_defines(flow, prepared, build_config)) {
        return null;
    }

        //continued parsing on the build object, the haxe/build flags
    internal.prepare_flags(flow, prepared, build_config);

        //finally, store it in the project as valid and return
    flow.project.prepared = prepared;

} //prepare



    //internal handlers


internal.prepare_dependencies = function(flow, project, build_config) {

    console.log('flow / building dependency tree');

    var _depends = depends.parse(flow, project);

    console.log('flow / done building tree... \n');

    if(Object.size(_depends.failed)) {

        console.log('flow / prepare failed due to missing dependencies!');
        console.log('flow / you will probably need to use haxelib to correct this.\n');

        for(name in _depends.failed) {
            var depend = _depends.failed[name];
            console.log('> %s %s', depend.name, depend.version);
        }

        return null;

    } //depends.failed has size

    return _depends.found;

} //prepare_dependencies



internal.prepare_defines = function(flow, prepared, build_config) {

    console.log('flow / preparing defines \n');

        //store the list of targets as met or unmet defines based on the target
        //we are attempting to prepare for
    for(index in build_config.known_targets) {
        var name = build_config.known_targets[index];
        prepared.defines_all[name] = { name:name, met:flow.target == name };
    }


        //now we parse all project defines from the project
    prepared.defines_all = defines.parse(flow, prepared.source, prepared.depends, build_config, prepared.defines_all);
        //and the final list is filtered against the defines themselves, and the known targets
    prepared.defines = defines.filter(flow, prepared.defines_all, build_config);


    if(prepared.defines.err) {
        console.log('flow / defines failed to parse. aborting build : \n');
        console.log('> %s \n',prepared.defines.err);
        return null;
    }

    console.log('flow / defines parsed as \n')
    // console.log(prepared.defines_all);
    console.log(prepared.defines);
    console.log('');

    console.log('flow / done defines ... \n');

    return prepared;

} //prepare_defines


internal.prepare_flags = function(flow, prepared, build_config) {

    console.log('flow / preparing flags \n');

    prepared.flags = flags.parse(flow, prepared, build_config);

    console.log(prepared.flags);
    console.log('flow / done flags ... \n');

} //prepare_flags
