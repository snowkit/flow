var   path = require('path')
    , haxelib = require('../util/haxelib')
    , util = require('../util/util')
    , bake = require('./bake')
    , bars = require('handlebars')

    , depends = require('./prepare/depends')
    , conditions = require('./prepare/conditions')
    , defines = require('./prepare/defines')
    , flags = require('./prepare/flags')
    , files = require('./prepare/files')

var internal = {};

    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.prepare = function prepare(flow, build_config) {

    flow.project.depends = flow.project.depends || {};

        //preparation starts with the parsed project
    var parsed = flow.project.parsed;

    internal.log(flow, 2, 'prepare - project %s', parsed.project.name );

        //dependencies are a special case as they affect everything, they
        //come first and are required to be complete before anything else
    var _depends = internal.prepare_dependencies(flow, parsed, build_config);

        //get out early if missing any dependency
    if(_depends == null) {
        return null;
    }

        //start at the project base
    var prepared = {
        source : util.deep_copy(parsed),
        depends : _depends,
        defines_all : {}
    }

        //we then merge the project values against our own,
        //so that they cascade and override each other
    internal.prepare_cascade_project(flow, prepared, build_config);

        //once cascaded we can safely calculate the output path
    flow.project.path_build = flow.project.get_build_path(flow, prepared);
    flow.project.path_output = flow.project.get_out_path(flow, prepared) + '/';
    flow.project.path_output_root = flow.project.get_out_root(flow, prepared) + '/';
    flow.project.path_binary = flow.project.get_out_binary(flow, prepared)

        //this step simply pulls out any conditionals in any root node,
        //tokenizes it, verifies it and pushes it into a cache for later
        //checks against a condition being met
    internal.prepare_project(flow, prepared, build_config);

        //finally, store it in the project as valid and return
    flow.project.prepared = prepared;

} //prepare

    //internal handlers

internal.log = function(flow) {
    var args = Array.prototype.slice.call(arguments,1);
    if(!flow.quiet.prepare) {
        flow.log.apply(flow, args);
    }
}

    //expose for children code
exports.log = internal.log;

internal.prepare_dependencies = function(flow, parsed, build_config) {

    internal.log(flow, 3, 'prepare - dependency tree ...');

    var _depends = depends.parse(flow, parsed);

    if(_depends == null) {
        return null;
    }

    if(util.object_size(_depends.failed)) {

        internal.log(flow, 1, 'prepare - failed due to missing dependencies!');
        internal.log(flow, 1, 'you will probably need to use haxelib to correct this.\n');

        for(name in _depends.failed) {
            var depend = _depends.failed[name];
            internal.log(flow, 1, '> %s %s', depend.name, depend.version);
        }

        internal.log(flow, '');
        return null;

    } //depends.failed has size

    internal.log(flow, 3, 'prepare - dependency tree - ok');

    return _depends.found;

} //prepare_dependencies

internal.prepare_cascade_project = function(flow, prepared, build_config) {

    //we go through all dependencies now and merge
        //them with only unique values persisting, i.e respecting last value
    for(name in prepared.depends) {
        var depend = prepared.depends[name];
        prepared.source = util.merge_unique(depend.project, prepared.source);
    }

        //an exception to this rule is files : {} and build : { files : {} } because
        //these are relative paths to the project they originate in, and should be left alone,
        //used later by the files preparation to resolve their paths against the dependency correctly
    if(flow.project.parsed.project.build.files) {
        prepared.source.project.build.files = util.deep_copy(flow.project.parsed.project.build.files, {});
    } else { delete prepared.source.project.build.files; }
    if(flow.project.parsed.project.files) {
        prepared.source.project.files = util.deep_copy(flow.project.parsed.project.files, {});
    } else { delete prepared.source.project.files; }

    console.log(prepared.source.project.build.files);
    console.log(prepared.source.project.files);

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
                    internal.log(flow, 3, 'prepare - found alias %s => %s', name, alias_dest);
                    //merge it into the given alias, and remove the old one
                    prepared.source[alias_dest] = util.merge_unique(prepared.source[name], prepared.source[alias_dest]);
                    delete prepared.source[name];
                }
            }
        } //for each node in prepared.source project
    } //if config has alias

    internal.log(flow, 3,'\nproject is \n');
    internal.log(flow, 3, prepared.source);
    internal.log(flow, 3, '');

} //prepare_cascade_project

internal.fail = function(flow, prepared, section, msg) {

    internal.log(flow, 1, '');
    internal.log(flow, 1, 'Error');
    internal.log(flow, 1, 'prepare - stopping due to errors in %s :\n', section);
    internal.log(flow, 1, '> ', msg);
    internal.log(flow, 1, '');

    return flow.project.failed = true;

}

internal.prepare_project = function(flow, prepared, build_config) {

    internal.log(flow, 2, 'prepare - project ...');


    //conditions

            //these are cached first because their tokenized version
            //is used to compare against known and unknown defines when
            //preparing the defines themselves, so we go first
        internal.log(flow, 3, 'prepare - project - conditions ...');

            var state = conditions.parse(flow, prepared, build_config);

            if(state.err) {
                return internal.fail(flow, prepared, 'conditions', state.err);
            }

        internal.log(flow, 3, 'prepare - project - conditions - ok');

    //defines

                //process the defines as the rest will depend on them
                //and error out if there are any parsing or other errors in there.
            state = internal.prepare_defines(flow, prepared, build_config);

            if(state.err) {
                return internal.fail(flow, prepared, 'defines', state.err);
            }

    //flags

            internal.prepare_flags(flow, prepared, build_config);

    //files

            internal.prepare_files(flow, prepared, build_config);


    internal.log(flow, 2, 'prepare - project - ok');

} //prepare_conditionals


internal.prepare_defines = function(flow, prepared, build_config) {

    internal.log(flow, 3, 'prepare - defines ...');

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

        //if any errors, return out early
    if(prepared.defines.err) {
        return prepared.defines.err;
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


    internal.log(flow, 5, prepared.defines_all);
    internal.log(flow, 4, bake.defines(flow, prepared, build_config));
    internal.log(flow, 5, prepared.defines);

    internal.log(flow, 3, 'prepare - defines - ok');

    return prepared;

} //prepare_defines

internal.prepare_codepaths = function (flow, prepared, build_config) {

    //store the code paths of each of the dependencies in the flag list
    for(name in prepared.depends) {
        var depend = prepared.depends[name];
            prepared.flags.push('-cp ' + depend.path);
    }//each depends

        //store the app code paths flag list
    if(prepared.source.project.app && prepared.source.project.app.codepaths) {
        var _paths = prepared.source.project.app.codepaths.map(function(a) {
            var _path = path.relative(flow.project.path_build, path.join(flow.run_path, a));
            return '-cp ' + _path;
        });
        prepared.flags = util.array_union(prepared.flags, _paths);
    }//each depends

} //prepare_codepaths

internal.prepare_flags = function(flow, prepared, build_config) {

    internal.log(flow, 3, 'prepare - project - flags ...');

        prepared.flags = [];
        internal.prepare_codepaths(flow, prepared, build_config);
        prepared.flags = flags.parse(flow, prepared, build_config);

            //append the debug flag if requested
        if(flow.flags.debug) { prepared.flags.push('-debug'); }

        internal.log(flow, 4, bake.flags(flow, prepared, build_config));

    internal.log(flow, 3, 'prepare - project - flags - ok');

} //prepare_flags

internal.prepare_files = function(flow, prepared, build_config) {

    internal.log(flow, 3, 'prepare - files ...');

        var result = files.parse(flow, prepared, prepared.source, null, build_config);

            //now, check each dependency and get their files, making them
            //absolute to their path, such that they can be copied
        for(index in prepared.depends) {

            var depend = prepared.depends[index];
            var sourcepath = path.dirname(depend.project.__path);
            var depfiles = files.parse(flow, prepared, depend.project, sourcepath, build_config);

                //merge them into the final list
            result.build_files = util.array_union(result.build_files, depfiles.build_files);
            result.project_files = util.array_union(result.project_files, depfiles.project_files);

        } //each depends

        prepared.files = result;

    internal.log(flow, 3, 'prepare - files - ok');

} //prepare_files

