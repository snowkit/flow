var   path = require('path')
    , haxelib = require('../util/haxelib')
    , util = require('../util/util')
    , bake = require('./bake')
    , bars = require('handlebars')
    , gate = require('json-gate')
    , jsonic = require('jsonic')
    , fs = require('graceful-fs')

    , depends = require('./prepare/depends')
    , conditions = require('./prepare/conditions')
    , defines = require('./prepare/defines')
    , flags = require('./prepare/flags')
    , files = require('./prepare/files')

var internal = {};

    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.prepare = function prepare(flow) {

    flow.project.depends = flow.project.depends || {};

        //preparation starts with the parsed project
    var parsed = flow.project.parsed;

    internal.log(flow, 2, 'prepare - project %s', parsed.project.name );

        //dependencies are a special case as they affect everything, they
        //come first and are required to be complete before anything else
    var _depends = internal.prepare_dependencies(flow, parsed);

        //get out early if missing any dependency
    if(_depends == null) {
        return null;
    }

        //start at the project base
    var prepared = {
        source : util.deep_copy(parsed),
        depends : _depends.found,
        depends_list : _depends.list,
        defines_all : {},
        hxcpp : {
            includes : {}
        }
    }

        //we then merge the project values against our own,
        //so that they cascade and override each other
    internal.cascade_project(flow, prepared);

        //once cascaded we can safely calculate the paths from it
    internal.prepare_config_paths(flow, prepared);

        //this step simply pulls out any conditionals in any root node,
        //tokenizes it, verifies it and pushes it into a cache for later
        //checks against a condition being met
    internal.prepare_project(flow, prepared);

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


internal.template_config_path = function(flow, prepared, path_node, context) {
    var template = bars.compile(path_node);
    var result = template(context);
    return util.normalize(result);
}

internal.prepare_config_paths = function(flow, prepared) {

    flow.project.paths = {
        android : { project : flow.config.build.android.project },
        ios : { project : flow.config.build.ios.project },
        output : flow.project.get_path_output(flow, prepared),
        build : flow.project.get_path_build(flow, prepared)
    }

        //go over the config path values and
        //template them against this specific context
    var path_context = {
        app : {
            arch : flow.target_arch,
            archtag : '',
            debugtag : '',
            iostag : 'os',
            boot : flow.config.build.boot,
            name : prepared.source.project.app.name
        },
        paths : flow.project.paths
    }

    if(flow.flags.debug) {
        path_context.app.debugtag = '-debug';
    }

    if(flow.flags.sim) {
        path_context.app.iostag = 'sim';
    }

    if(flow.target_arch == 'armv7') {
        path_context.app.archtag = '-v7';
    }

        //store for use later against files etc
    flow.project.path_context = path_context;

    var list = ['binary_source_name','binary_dest_name', 'binary_dest_path', 'files_dest_path'];

    for(name in flow.config.build) {
        var node = flow.config.build[name];

            //if this is platform specific
        if(flow.config.build.known_targets.indexOf(name) != -1) {
            for(subname in node) {
                var subnode = node[subname];
                if(list.indexOf(subname) != -1) {
                    flow.config.build[name][subname] = internal.template_config_path(flow, prepared, subnode, path_context);
                }
            }
        } else {
            if(list.indexOf(name) != -1) {
                flow.config.build[name] = internal.template_config_path(flow, prepared, node, path_context);
            }
        }
    }

        //now, assign more specific paths like the binary path
    flow.project.paths.binary = {
        source : flow.project.get_path_binary_name_source(flow, prepared),
        path : flow.project.get_path_binary_dest(flow, prepared),
        name : flow.project.get_path_binary_name(flow, prepared)
    }

    flow.project.paths.binary.full = path.join(flow.project.paths.binary.path, flow.project.paths.binary.name);
    flow.project.paths.files = flow.project.get_path_files(flow, prepared);

    flow.project.paths.binary.full = util.normalize(flow.project.paths.binary.full);
    flow.project.paths.files = util.normalize(flow.project.paths.files, true);

    flow.log(3, 'paths for project', flow.project.paths);

} //prepare_config_paths

internal.prepare_dependencies = function(flow, parsed) {

    internal.log(flow, 3, 'prepare - dependency tree ...');


    var internal_deps = ['hxcpp'];
    var dep_path = path.resolve(flow.flow_path, 'project/dependencies/');

    var internal_depends = {};
    for(index in internal_deps) {
        var dep = internal_deps[index];
        var lib = haxelib.version(flow, dep, '*');
        internal_depends[dep] = {
            name : dep,
            path : lib.path,
            flow_file:path.join(dep_path, dep+'.flow'),
            version:'*'
        };
    }

    flow.project.internal_depends = internal_depends;

        //now we add internal deps as required
    if(flow.target_cpp && !parsed.project.lib) {
        internal.log(flow, 2, 'prepare - dependency tree - adding dependency hxcpp *');
        parsed.project.build.dependencies = parsed.project.build.dependencies || {};
        parsed.project.build.dependencies['hxcpp'] = { version:'*', internal:true };
    }

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

    return { found:_depends.found, list:_depends.list };

} //prepare_dependencies

internal.cascade_project = function(flow, prepared) {

        //we go through all dependencies now and merge
        //them with only unique values persisting, i.e respecting last value
        //we also make a deep copy because the function operates on the one, causing
        //changes to be reflected into the depends tree, which is a fail
    for(name in prepared.depends) {
        var depend = util.deep_copy(prepared.depends[name]);
        prepared.source = util.merge_unique(depend.project, prepared.source);
    }

        //and then bring in any flow configs
        //from the project and store them in flow.config,
        //overriding what's already in there on a value basis (not object bases)
    flow.config = util.merge_combine(prepared.source.flow, flow.config);


        //process some specific platform flags that would be easier as accessed from the config root
        //like, flow.config.build.launch_time instead of if(plat == web etc)
    var multi_list = ['launch_wait'];
    for(name in flow.config.build) {
        if(multi_list.indexOf(name) != -1) {
            var plat = flow.config.build[flow.target];
            if(plat && plat[name]) {
                flow.log(4, 'prepare - moving value of %s to root of flow.config.build. was %s now %s', name, flow.config.build[name], plat[name]);
                flow.config.build[name] = plat[name];
            }
        }
    }

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

    internal.log(flow, 4,'\nproject is \n');
    internal.log(flow, 4, prepared.source);
    internal.log(flow, 4, '');

} //prepare_cascade_project


internal.fail = function(flow, prepared, section, msg) {

    internal.log(flow, 1, '');
    internal.log(flow, 1, 'Error');
    internal.log(flow, 1, 'prepare - stopping due to errors in %s :\n', section);
    internal.log(flow, 1, '> ', msg);
    internal.log(flow, 1, '');

    return flow.project.failed = true;

}

internal.prepare_project = function(flow, prepared) {

    internal.log(flow, 2, 'prepare - project ...');

    //conditions

            //these are cached first because their tokenized version
            //is used to compare against known and unknown defines when
            //preparing the defines themselves, so we go first
        internal.log(flow, 3, 'prepare - project - conditions ...');

            var state = conditions.parse(flow, prepared);

            if(state.err) {
                return internal.fail(flow, prepared, 'conditions', state.err);
            }

        internal.log(flow, 3, 'prepare - project - conditions - ok');

    //defines

                //process the defines as the rest will depend on them
                //and error out if there are any parsing or other errors in there.
            state = internal.prepare_defines(flow, prepared);

            if(state.err) {
                return internal.fail(flow, prepared, 'defines', state.err);
            }

    //flags

            internal.prepare_flags(flow, prepared);

    //icons

            internal.prepare_icons(flow, prepared);

    //files

            internal.prepare_files(flow, prepared);

    //conditional nodes

            internal.prepare_conditional_nodes(flow, prepared);

    //mobile

            internal.prepare_mobile(flow, prepared);

    //hxcpp

            internal.prepare_hxcpp(flow, prepared);

    //user object schema

            internal.prepare_schema(flow, prepared);


    internal.log(flow, 2, 'prepare - project - ok');

} //prepare_project


internal.prepare_conditional_nodes = function(flow, prepared) {

        //backmerge known conditional nodes against the project itself
    if(prepared.source.if) {
        for(condition in prepared.source.if) {
            if(defines.satisfy(flow, prepared, condition)) {

                var node = prepared.source.if[condition];
                if(node.app && node.app.mobile) {
                    if(node.app.mobile.ios) {
                        prepared.source.project.app.mobile.ios.libs = util.merge_unique(node.app.mobile.ios.libs, prepared.source.project.app.mobile.ios.libs);
                    }
                    if(node.app.mobile.android) {
                        prepared.source.project.app.mobile.android.libs = util.merge_unique(node.app.mobile.android.libs, prepared.source.project.app.mobile.android.libs);
                    }
                }

            }
        }
    } //each condition

} //prepare_conditional_nodes

    //for hxcpp, we store the list of absolute paths so they can be used correctly
internal.prepare_hxcpp = function(flow, prepared) {

    //for each node we simply add a
        //  <include name="absolute path" /> to the flow hxcpp output

        //so, do dependencies first, in order
    for(index in prepared.depends_list) {

        var name = prepared.depends_list[index];
        var depend = prepared.depends[name];
        var project = depend.project.project;

        if(project.build.hxcpp) {

            flow.log(3, 'prepare - hxcpp - depend %s has hxcpp includes', name);

            for(include in project.build.hxcpp) {
                var node = project.build.hxcpp[include];

                flow.log(4, 'prepare - hxcpp -      added %s : %s', include, node);

                var src = path.join(depend.project.__root, node);
                prepared.hxcpp.includes[include] = {
                    file : path.basename(src),
                    path : src,
                    name : include,
                    source : depend.project.__path
                };
            }
        } else {
            flow.log(4,'prepare - hxcpp - depend %s has no hxcpp includes', name);
        }

    } //each depends

        //if it's from the source project we append the project root afterward to override
    var source = flow.project.parsed.project;
    if(source.build.hxcpp) {

        flow.log(3, 'prepare - hxcpp - project has hxcpp includes');

        for(name in source.build.hxcpp) {

            var node = source.build.hxcpp[name];
            var src = path.join(flow.project.root, node);
            prepared.hxcpp.includes[name] = {
                file : path.basename(src),
                path : src,
                name : name,
                source : path.join(flow.project.root, flow.project.file)
            };

            flow.log(4, 'prepare - hxcpp -      added %s : %s', name, node);
        }
    }

} //prepare_hxcpp

internal.prepare_mobile = function(flow, prepared) {

    //now we also handle any platform specifics that might need to be resolved to different values
        //like orientations or device targets etc

    if(flow.target == 'ios') {

            //handle native libs as these will be registered unless requested not to
        var libs = prepared.source.project.app.mobile.ios.libs;
        if(libs) {
            if(libs.native) {
                libs._native = {};
                for(name in libs.native) {
                    //generate a unique ID for this file reference
                    libs._native[name] = {
                        fileRef : util.ios_uniqueid(flow),
                        nodeRef : util.ios_uniqueid(flow),
                        name : name
                    }
                }
            }
        }

            //handle conversion from named device target to enum for project file
        switch(prepared.source.project.app.mobile.ios.devices) {
            case 'Universal':
                prepared.source.project.app.mobile.ios._devices = "1,2";
            break;
            case 'iPhone':
                prepared.source.project.app.mobile.ios._devices = 1;
            break;
            case 'iPad':
                prepared.source.project.app.mobile.ios._devices = 2;
            break;
        }

        prepared.source.project.app.mobile._orientation = [];
        switch(prepared.source.project.app.mobile.orientation) {
            case 'landscape':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationLandscapeRight');
            break;
            case 'landscape left':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationLandscapeLeft');
            break;
            case 'landscape both':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationLandscapeLeft');
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationLandscapeRight');
            break;
            case 'portrait':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationPortrait');
            break;
            case 'portrait upside down':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationPortraitUpsideDown');
            break;
            case 'portrait both':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationPortrait');
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationPortraitUpsideDown');
            break;
        }
    }

} //prepare_mobile

internal.prepare_schema = function(flow, prepared) {

    for(name in flow.config.schema) {
        var detail = flow.config.schema[name];
        var schema = gate.createSchema(detail);
        var json = prepared.source[name] || {};
        if(json) {
            try {
                schema.validate(json);
            } catch(e) {
                flow.log(1,e);
            }
        } else {
            flow.log(1, 'prepare - schema requested for %s, but no node in project', name);
        }
    } //each schema

} //prepare_schema

internal.prepare_defines = function(flow, prepared) {

    internal.log(flow, 3, 'prepare - defines ...');

    //store the list of targets as met or unmet defines based on the target
    //we are attempting to prepare for
    for(index in flow.config.build.known_targets) {
        var name = flow.config.build.known_targets[index];
        prepared.defines_all[name] = { name:name, met:flow.target == name };
    }

        //also store the current target arch as a define
    var arch = 'arch-' + flow.target_arch;
    prepared.defines_all[arch] = { name:arch, met:true };

    if(flow.target == 'ios' && flow.flags.sim) {
        prepared.defines_all['ios-sim'] = { name:'ios-sim', met:true };
    }

        //and we store "mobile" for convenience
    if(flow.target_mobile) {
        prepared.defines_all['mobile'] = { name:'mobile', met:true };
    }

    if(flow.target_desktop) {
        prepared.defines_all['desktop'] = { name:'desktop', met:true };
    }

        //we also store a few config values as defines because they can be used to configure the build
    prepared.defines_all['flow_build_command_line'] = { name:'flow_build_command_line', met:flow.config.build.command_line };

        //now we parse all project defines from the project
    prepared.defines_all = defines.parse(flow, prepared.source, prepared.depends, prepared.defines_all);
        //and the final list is filtered against the defines themselves, and the known targets
    prepared.defines = defines.filter(flow, prepared.defines_all);

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
    internal.log(flow, 3, bake.defines(flow, prepared));
    internal.log(flow, 5, prepared.defines);

    internal.log(flow, 3, 'prepare - defines - ok');

    return prepared;

} //prepare_defines

internal.prepare_codepaths = function (flow, prepared) {

    //store the code paths of each of the dependencies in the flag list
    for(name in prepared.depends) {
        var depend = prepared.depends[name];
            prepared.flags.push('-cp ' + depend.path);

        if(depend.project.project.app && depend.project.project.app.codepaths) {
            var _paths = depend.project.project.app.codepaths.map(function(a) {
                var _path = path.resolve(path.join(depend.path, a));
                return '-cp ' + util.normalize(_path, true);
            });
            prepared.flags = util.array_union(prepared.flags, _paths);
        }

    }//each depends

        //store the app code paths flag list
    if(prepared.source.project.app && prepared.source.project.app.codepaths) {
        var _paths = prepared.source.project.app.codepaths.map(function(a) {
            var _path = path.relative(flow.project.paths.build, path.join(flow.run_path, a));
            return '-cp ' + util.normalize(_path, true);
        });
        prepared.flags = util.array_union(prepared.flags, _paths);
    }//each depends

} //prepare_codepaths

internal.prepare_flags = function(flow, prepared) {

    internal.log(flow, 3, 'prepare - project - flags ...');

        prepared.flags = [];
        internal.prepare_codepaths(flow, prepared);
        prepared.flags = flags.parse(flow, prepared);

            //append the debug flag if requested
        if(flow.flags.debug) { prepared.flags.push('-debug'); }

        internal.log(flow, 4, bake.flags(flow, prepared));

    internal.log(flow, 3, 'prepare - project - flags - ok');

} //prepare_flags


internal.prepare_icons = function(flow, prepared) {

    //icons simply need to append their source project path so that they can be
    //correctly located in the resulting icons command.

    if(!prepared.source.project.app && !prepared.source.project.app.icon) {
        return;
    }

    prepared.source.project.app._icon = {
        dest : 'icon',
        source : 'icon'
    };

        //so, do dependencies first, in order, overriding the source path only as it walks
    for(index in prepared.depends_list) {

        var name = prepared.depends_list[index];
        var depend = prepared.depends[name];
        prepared.source.project.app._icon.__path = depend.project.__root;

    } //each depends

        //then, if it's from the source project, override the value to nothing
    if(flow.project.parsed.project.app && flow.project.parsed.project.app.icon) {
        prepared.source.project.app._icon.__path = flow.project.root;
    }


    if(flow.target == 'windows') {
            //finally, for windows icons, we append a hxcpp include 
            //so that it can link against the icon. 
            //This __icons.xml file is generated by the icons command.
        prepared.hxcpp.includes['__icon'] = { 
            name:'__icon', file:'__icon.xml', path:'__icon.xml',
            source:'flow internal', internal:true 
        };

    } //windows only

} //prepare_icons

    //note that files are prepared from the parsed project instead of the prepared
    //project because they are cascaded, leaving dependencies files incorrectly
    //located in the local project file tree (which i will resolve later but is clean enough)
internal.prepare_files = function(flow, prepared) {

    internal.log(flow, 3, 'prepare - files ...');

        var result = files.parse(flow, prepared, flow.project.parsed, null);

            //now, check each dependency and get their files, making them
            //absolute to their path, such that they can be copied
        for(index in prepared.depends) {

            var depend = prepared.depends[index];

            var sourcepath = depend.project.__root;
            var depfiles = files.parse(flow, prepared, depend.project, sourcepath);

                //merge them into the final list
            result.build_files = util.array_union(result.build_files, depfiles.build_files);
            result.project_files = util.array_union(result.project_files, depfiles.project_files);

        } //each depends

        prepared.files = result;

    internal.log(flow, 3, 'prepare - files - ok');

} //prepare_files

