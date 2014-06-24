var   path = require('path')
    , haxelib = require('../util/haxelib')
    , util = require('../util/util')
    , projects = require('./project')
    , bake = require('./bake')

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

        //we then merge the project values against our own,
        //so that they cascade and override each other
    internal.prepare_cascade_project(flow, prepared, build_config);

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

    if(_depends == null) {
        return null;
    }

    console.log('flow / done building tree... \n');

    if(util.object_size(_depends.failed)) {

        console.log('flow / prepare failed due to missing dependencies!');
        console.log('flow / you will probably need to use haxelib to correct this.\n');

        for(name in _depends.failed) {
            var depend = _depends.failed[name];
            console.log('> %s %s', depend.name, depend.version);
        }

        console.log('');
        return null;

    } //depends.failed has size

    return _depends.found;

} //prepare_dependencies

internal.prepare_cascade_project = function(flow, prepared, build_config) {

        //we go through all dependencies now and merge them only unique values persisting
    for(name in prepared.depends) {
        var depend = prepared.depends[name];
        prepared.source = util.merge_unique(depend.project, prepared.source);
    }

        //and then bring in any flow configs
        //from the project and store them in flow.config,
        //overriding what's already in there on a value basis (not object bases)
    flow.config = util.merge_combine(prepared.source.flow, flow.config);

        //plus, we want to handle any aliases that the projects have asked for,
        //so that their final baked project values are what they expect/asked
    if(flow.config.alias) {
        for(name in prepared.source) {
            for(alias in flow.config.alias) {
                var alias_dest = flow.config.alias[alias];
                if(alias == name) {
                    // console.log('found alias :o %s => %s', name, alias_dest);
                    //merge it into the given alias, and remove the old one
                    prepared.source[alias_dest] = util.merge_unique(prepared.source[name], prepared.source[alias_dest]);
                    delete prepared.source[name];
                }
            }
        }
    }

    // console.log('\nproject is \n');
    // console.log(prepared.source);
    // console.log('');

} //prepare_cascade_project

internal.prepare_defines = function(flow, prepared, build_config) {

    // console.log('flow / preparing defines \n');

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


        //by default we store a list of dependencies and their versions as defines too
    for(name in prepared.depends) {
        var depend = prepared.depends[name];
        if(depend.project) {
            prepared.defines[depend.name] = { name:depend.name, value:depend.project.version };
        } else {
            prepared.defines[depend.name] = { name:depend.name };
        }
    }//each depends



        //now store a list of defines as strings for later use
    prepared.defines_list = [];

    for(name in prepared.defines) {
        var define = prepared.defines[name];
        prepared.defines_list.push(
            (define.value === undefined) ? define.name : define.name + '=' + define.value
        );
    }


    // console.log(prepared.defines_all);
    // console.log(bake.defines(flow, prepared, build_config));
    // console.log(prepared.defines);

    // console.log('\nflow / done defines ... \n');

    return prepared;

} //prepare_defines


internal.prepare_codepaths = function (flow, prepared, build_config) {

        //store the code paths of each of the dependencies in the flag list
    for(name in prepared.depends) {
        var depend = prepared.depends[name];
            prepared.flags.push('-cp ' + depend.path);
    }//each depends

        //store the product code paths flag list
    if(prepared.source.product && prepared.source.product.codepaths) {
        var _paths = prepared.source.product.codepaths.map(function(a) { return '-cp ' + a; });
        prepared.flags = util.array_union(prepared.flags, _paths);
    }//each depends

} //prepare_codepaths

internal.prepare_flags = function(flow, prepared, build_config) {

    // console.log('flow / preparing flags \n');

    prepared.flags = [];
    internal.prepare_codepaths(flow, prepared, build_config);
    prepared.flags = flags.parse(flow, prepared, build_config);

        //append the debug flag if requested
    if(flow.flags.debug) { prepared.flags.push('-debug'); }

    // console.log(bake.flags(flow, prepared, build_config));

    // console.log('\nflow / done flags ... \n');

} //prepare_flags

