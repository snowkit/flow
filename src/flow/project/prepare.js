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
    , hxmls = require('./prepare/hxmls')
    , files = require('./prepare/files')

var internal = {};

    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.prepare = function prepare(flow) {

    flow.project.depends = flow.project.depends || {};

        //preparation starts with the parsed project
    var parsed = flow.project.parsed;

        //
    internal.log(flow, 3, 'prepare - project %s', parsed.project.name );

        //dependencies are a special case as they affect everything, they
        //come first and are required to be complete before anything else
    var _depends = internal.prepare_dependencies(flow, parsed);

        //get out early if missing any dependency
    if(_depends == null) {
        internal.log(flow, 4, 'prepare - early out due to failed depends' );
        return null;
    }

        //start at the project base
    var prepared = {
        source : util.deep_copy(parsed),
        depends : _depends.found,
        depends_list : _depends.list,
        defines_all : {},
        hooks : { pre:{}, post:{} },
        hxcpp : {
            includes : {},
            flags : [],
        }
    }

        //
    internal.prepare_config(flow);

        //we then merge the project values against our own,
        //so that they cascade and override each other
    internal.cascade_project(flow, prepared);

        //once cascaded we can safely calculate the paths from it
    internal.prepare_config_paths(flow, prepared);

        //then prepare the remaining nodes that need it
    internal.prepare_project(flow, prepared);

        //allow failing during prepare phases
    if(flow.project.failed) {
        return null;
    }

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


internal.prepare_config = function(flow) {
    var _app = flow.project.parsed.project.app;
    var _app_main = _app.main || 'FlowApp';
    flow.config.build.boot = _app_main;

    flow.config_source = util.deep_copy(flow.config);
}


internal.prepare_config_paths = function(flow, prepared) {

    flow.project.paths = {
        android : { project : flow.config.build.android.project, libabi:'armeabi' },
        ios     : { project : flow.config.build.ios.project },
        output  : flow.project.get_path_output(flow, prepared),
        build   : flow.project.get_path_build(flow, prepared)
    }

    if(flow.target == 'android') {
        switch(flow.target_arch) {
            case 'x86':
                flow.project.paths.android.libabi = 'x86';
            break;
            case 'armv7':
                flow.project.paths.android.libabi = 'armeabi-v7a';
            break;
            default:
                flow.project.paths.android.libabi = 'armeabi';
            break;
        }
    }


        //store for use later against files etc
    flow.project.path_context = flow.project.get_path_context(flow, prepared, flow.target_arch);

        //these template the defaults based on flow.target_arch,
        //in places where they need to be unique they are called again

        //the output files path
    flow.project.paths.files = flow.project.get_path_files(flow, prepared);
    flow.project.paths.binary = {
        source : flow.project.get_path_binary_name_source(flow, prepared),
        path   : flow.project.get_path_binary_dest(flow, prepared),
        name   : flow.project.get_path_binary_name(flow, prepared),
        full   : flow.project.get_path_binary_dest_full(flow, prepared)
    }

    flow.log(3, 'paths for project', flow.project.paths);

} //prepare_config_paths

internal.prepare_dependencies = function(flow, parsed) {

    internal.log(flow, 3, 'prepare - dependency tree ...');


    var internal_dep_list = [];

    if(flow.target_cpp) {
        internal_dep_list.push('hxcpp');
    }

    var dep_path = path.resolve(flow.flow_path, 'project/dependencies/');

    var internal_depends = {};

    for(index in internal_dep_list) {

        var dep = internal_dep_list[index];
        var lib = haxelib.version(flow, dep, '*');

        if(lib == null) {
            internal.log(flow, 1, 'prepare - dependency not found - %s, please run `haxelib install %s`', dep, dep);
            return null;
        }

        internal_depends[dep] = {
            name : dep,
            path : lib.path,
            flow_file:path.join(dep_path, dep+'.flow'),
            version:'*'
        };

    } //index in list

    flow.project.internal_depends = internal_depends;

        //now we add internal deps as required
    if(flow.target_cpp && !parsed.project.lib) {
        internal.log(flow, 4, 'prepare - dependency tree - adding dependency hxcpp *');
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

} //fail

internal.prepare_project = function(flow, prepared) {

    internal.log(flow, 3, 'prepare - project ...');

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

    // project.build.flags and --f cli

            internal.prepare_flags(flow, prepared);

    // project.build.hooks

            internal.prepare_hooks(flow, prepared);

    // project.app nodes except icon

            internal.prepare_app(flow, prepared);

    // project.app.icon

            internal.prepare_icons(flow, prepared);

    // project.files and project.build.files

            internal.prepare_files(flow, prepared);

    // if:

            internal.prepare_conditionals(flow, prepared);

    // web specifics

            internal.prepare_web(flow, prepared);

    // mobile specifics

            internal.prepare_mobile(flow, prepared);

    // hxcpp injection / --f-hxcpp

            internal.prepare_hxcpp(flow, prepared);

    // user object schema

            internal.prepare_schema(flow, prepared);


    internal.log(flow, 3, 'prepare - project - ok');

} //prepare_project


internal.prepare_conditionals = function(flow, prepared) {

    //backmerge known conditional nodes against the project itself
    if(prepared.source.if) {
        for(condition in prepared.source.if) {
            if(defines.satisfy(flow, prepared, condition)) {

                var node = prepared.source.if[condition];

                if(node.build && node.build.number) {
                    prepared.source.project.build.number = node.build.number;
                }

                if(node.app && node.app.mobile) {

                    if(node.app.mobile.ios) {
                        prepared.source.project.app.mobile.ios.libs = util.merge_unique(node.app.mobile.ios.libs, prepared.source.project.app.mobile.ios.libs);
                    }
                    if(node.app.mobile.android) {
                        prepared.source.project.app.mobile.android.libs = util.merge_unique(node.app.mobile.android.libs, prepared.source.project.app.mobile.android.libs);

                        prepared.source.project.app.mobile.android.build_type = node.app.mobile.android.build_type;
                        prepared.source.project.app.mobile.android.keystore_path = node.app.mobile.android.keystore_path;
                        prepared.source.project.app.mobile.android.keystore_alias = node.app.mobile.android.keystore_alias;
                    }

                } //if app and app.mobile

            } //if satisfied
        } //each condition
    } //if conditional node

} //prepare_conditionals

    //for hxcpp, we store the list of absolute paths so they can be used correctly
internal.prepare_hxcpp = function(flow, prepared) {


    //so, do dependencies first, in order
    for(index in prepared.depends_list) {

        var name = prepared.depends_list[index];
        var depend = prepared.depends[name];
        var project = depend.project.project;

        if(project.build.hxcpp) {

            if(project.build.hxcpp.includes) {

                flow.log(3, 'prepare - hxcpp - depend %s has hxcpp includes', name);

                for(include in project.build.hxcpp.includes) {
                    var node = project.build.hxcpp.includes[include];

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

            if(project.build.hxcpp.flags) {
                prepared.hxcpp.flags = util.array_union(prepared.hxcpp.flags, project.build.hxcpp.flags);
            }

        } //hxcpp node

    } //each depends

        //if it's from the source project we append the project root afterward to override
    var source = flow.project.parsed.project;

    if(source.build.hxcpp) {

        if(source.build.hxcpp.includes) {

            flow.log(3, 'prepare - hxcpp - project has hxcpp includes');

            for(name in source.build.hxcpp.includes) {

                var node = source.build.hxcpp.includes[name];
                var src = path.join(flow.project.root, node);
                prepared.hxcpp.includes[name] = {
                    file : path.basename(src),
                    path : src,
                    name : name,
                    source : path.join(flow.project.root, flow.project.file)
                };

                flow.log(4, 'prepare - hxcpp -      added %s : %s', name, node);

            } //each include

        } //if includes

        if(source.build.hxcpp.flags) {
            prepared.hxcpp.flags = util.array_union(prepared.hxcpp.flags, source.build.hxcpp.flags);
        }

    } //if hxcpp node

    for(condition in prepared.source.if) {
        var node = prepared.source.if[condition];
        if(node.build && node.build.hxcpp && node.build.hxcpp.flags) {
            if(defines.satisfy(flow, prepared, condition)) {
                prepared.hxcpp.flags = util.array_union(prepared.hxcpp.flags, node.build.hxcpp.flags);
            }
        }
    }


        //finally, we parse the command line for --f-hxcpp flags
    if(flow.flags['f-hxcpp']) {

        var cmdline_hxcpp_flags = []

        if(flow.flags['f-hxcpp'].constructor == String) {
            cmdline_hxcpp_flags.push(flow.flags['f-hxcpp']);
        } else if(flow.flags['f-hxcpp'].constructor == Array) {
            cmdline_hxcpp_flags = flow.flags['f-hxcpp'];
        } else {
            //nothing to do here...
        }

        prepared.hxcpp.flags = util.array_union(prepared.hxcpp.flags, cmdline_hxcpp_flags);

    } //f-hxcpp flags exist

} //prepare_hxcpp

internal.prepare_web = function(flow, prepared) {

    if(flow.flags.min) {
        prepared.source.project.app.web.min = true;
    }

    var project = prepared.source;
    for(condition in project.if) {
        var node = project.if[condition];
        if(node.app && node.app.web) {
                //merge libs upward if met
            if(defines.satisfy(flow, prepared, condition)) {
                project.project.app.web = util.merge_combine(project.project.app.web, node.app.web);
            }
        }
    }

} //prepare_web

internal.prepare_mobile = function(flow, prepared) {

    //:todo: this might be better a general rule, but since it is for sure
        // a problem on android it's better to short term notify users

        var _app_name = prepared.source.project.app.name;
        if(_app_name) {
            if(_app_name.indexOf(' ') != -1) {
                return internal.fail(flow, prepared, 'project.app.name', 'project.app.name(`'+_app_name+'`) contains a space, which can easily cause problems especially on mobile platforms.');
            }
        }

    //now we also handle any platform specifics that might need to be resolved to different values
        //like orientations or device targets etc

    if(flow.target == 'ios') {

            //handle project lib as ldflag
        var lib_ldflags = [prepared.source.project.app.name];
            //handle native libs as lib_ldflags
        var libs = prepared.source.project.app.mobile.ios.libs;
        if(libs) {
            if(libs.native) {
                for(name in libs.native) {
                    //generate a unique ID for this file reference
                    lib_ldflags.push(name);
                }
            }
        }

            //add the -l parts
        lib_ldflags = lib_ldflags.map(function(a) { return '-l \\"' + a +'\\"'; });
            //join with spaces
        var _lib_ldflags = lib_ldflags.join(' ');
        flow.log(3, 'prepare - ios ldflags set to `%s`', _lib_ldflags);

        prepared.source.project.app.mobile.ios.ldflags = _lib_ldflags;

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
            case 'both':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationPortrait');
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationLandscapeRight');
            break;
            case 'all':
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationPortrait');
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationPortraitUpsideDown');
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationLandscapeRight');
                prepared.source.project.app.mobile._orientation.push('UIInterfaceOrientationLandscapeLeft');
            break;
        }


    } else if(flow.target == 'android') { //ios

        prepared.source.project.app.mobile._orientation = prepared.source.project.app.mobile.orientation;

        switch(prepared.source.project.app.mobile.orientation) {
            case 'landscape left':
                prepared.source.project.app.mobile._orientation = 'reverseLandscape';
            break;
            case 'landscape both':
                prepared.source.project.app.mobile._orientation = 'sensorLandscape';
            break;
            case 'portrait upside down':
                prepared.source.project.app.mobile._orientation = 'reversePortrait';
            break;
            case 'portrait both':
                prepared.source.project.app.mobile._orientation = 'sensorPortrait';
            break;
            case 'both':
                prepared.source.project.app.mobile._orientation = 'sensor';
            break;
            case 'all':
                prepared.source.project.app.mobile._orientation = 'fullSensor';
            break;
        }

    } //android

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

    if(flow.target == 'ios') {

            //ios has a special flag to handle the project folder generation,
            //if this flag is give the framework can use it to write the project
        var ios_project_path = path.resolve( flow.project.root, flow.config.build.ios.project );
        var ios_project_exists = fs.existsSync( ios_project_path );

        if(flow.flags['xcode-project'] || !ios_project_exists) {
            flow.log(2, 'project - ios xcode project will be generated at', ios_project_path);
            prepared.defines_all['ios-xcode-project'] = { name:'ios-xcode-project', met:true };
            flow.project.skip_build = true;
        }

        var allow_build = flow.flags['ios-allow-cli-build'];

            //if not running from xcode, and the project existed
        if((!process.env['XCODE_VERSION_ACTUAL'] && ios_project_exists) && !allow_build) {
            flow.project.skip_build = true;
            flow.log(2, 'project - use xcode ios project at', ios_project_path);
        }

    } //ios

    if(flow.target == 'web') {
        if(prepared.source.project.app && prepared.source.project.app.web) {
            var embed_source_map = prepared.source.project.app.web.source_map_content;
            if(embed_source_map) {
                var source_map_define = 'source-map-content';
                prepared.defines_all[source_map_define] = { name:source_map_define, met:true };
            }
        }
    }

        //and we store "mobile" for convenience
    if(flow.target_mobile) {
        prepared.defines_all['mobile'] = { name:'mobile', met:true };
    }

    if(flow.target_desktop) {
        prepared.defines_all['desktop'] = { name:'desktop', met:true };
    }

    if(flow.flags.debug) {
        prepared.defines_all['debug'] = { name:'debug', met:true };
    }


        //look for command line defines, this must happen before parse, so they are met
    if(flow.flags.d) {

        var cmdline_defines = []

        if(flow.flags.d.constructor == String) {
            cmdline_defines.push(flow.flags.d);
        } else {
            cmdline_defines = flow.flags.d;
        }

        for(index in cmdline_defines) {
            var def = cmdline_defines[index];
            var parts = def.split('=');
            var def_name = parts[0];
            var def_value = parts[1];

            prepared.defines_all[def_name] = { name:def_name, met:true };

            if(def_value) {
                prepared.defines_all[def_name].value = def_value;
            }
        } //cmdline_defines

    } //flow.flags.d


        //we also store a few config values as defines because they need to be be used to configure the build
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

            //add the root folder of the dependency
        prepared.flags.push('-cp ' + depend.path);

             //if this dependency has its own codepaths,
             //these are absolute paths to the project file root
        if(depend.project.project.app && depend.project.project.app.codepaths) {

            var _paths = depend.project.project.app.codepaths.map(function(a) {
                var _path = path.resolve(path.join(depend.path, a));
                return '-cp ' + util.normalize(_path, true);
            });

            prepared.flags = util.array_union(prepared.flags, _paths);

        } //code paths in flow file

            //if the codepaths were added at the usage level
             //these are also absolute paths to the project file root
        if(depend.codepaths && depend.codepaths.length) {

            var _paths = depend.codepaths.map(function(a) {
                var _path = path.resolve(path.join(depend.path, a));
                return '-cp ' + util.normalize(_path, true);
            });

            prepared.flags = util.array_union(prepared.flags, _paths);

        } //added to usage of dependency

    }//each depends

        //store the app code paths flag list,
        //these are stored relative to the build folder
        //because thats where haxe runs from
    if(prepared.source.project.app && prepared.source.project.app.codepaths) {

        var _paths = prepared.source.project.app.codepaths.map(function(a) {
            var _path = path.relative( flow.project.root, path.join(flow.project.root, a) );
            return '-cp ' + util.normalize(_path, true);
        });

        prepared.flags = util.array_union(prepared.flags, _paths);

    }//each depends

} //prepare_codepaths

internal.prepare_flags = function(flow, prepared) {

    internal.log(flow, 3, 'prepare - project - flags ...');

        prepared.hxmls = [];
        prepared.hxmls = hxmls.parse(flow, prepared);

        prepared.flags = [];
        internal.prepare_codepaths(flow, prepared);
        prepared.flags = flags.parse(flow, prepared);

        if(flow.flags.f) {

            var cmdline_flags = []

            if(flow.flags.f.constructor == String) {
                cmdline_flags.push(flow.flags.f);
            } else {
                cmdline_flags = flow.flags.f;
            }

            for(index in cmdline_flags) {
                var flag = cmdline_flags[index];
                prepared.flags.push(flag);
            } //each cmdline_flag

        } //if flow.flags.f

            //append the debug flag if requested
        if(flow.flags.debug) {
            prepared.flags.push('-debug');
        }

        internal.log(flow, 4, bake.flags(flow, prepared));

    internal.log(flow, 3, 'prepare - project - flags - ok');

} //prepare_flags


internal.prepare_hooks = function(flow, prepared) {

    //look for build.pre and build.post tags, and store them in prepared
    //structure, as well as storing their path so we can
    //run them in the right place etc.

    //these are stored as prepared.hooks.pre and prepared.hooks.post,
    //they are stored by project name so they can be later excluded with --skip-hook

        //so, for dependencies their path differs
    for(index in prepared.depends_list) {

        var name = prepared.depends_list[index];
        var depend = prepared.depends[name];

        if(depend.project.project.build.pre) {

            depend.project.project.build.pre.__path = depend.project.__root;
            prepared.hooks.pre[name] = depend.project.project.build.pre;

                //default to requiring success
            if(prepared.hooks.pre[name].require_success === undefined) {
                prepared.hooks.pre[name].require_success = true;
            }

        }

        if(depend.project.project.build.post) {
            depend.project.project.build.post.__path = depend.project.__root;
            prepared.hooks.post[name] = depend.project.project.build.post;

                //default to requiring success
            if(prepared.hooks.post[name].require_success === undefined) {
                prepared.hooks.post[name].require_success = true;
            }
        }

    } //each depends

    if(flow.project.parsed.project.build.pre) {
        flow.project.parsed.project.build.pre.__path = flow.project.root;
        prepared.hooks.pre['__project'] = flow.project.parsed.project.build.pre;

        //default to requiring success
        if(prepared.hooks.pre['__project'].require_success === undefined) {
            prepared.hooks.pre['__project'].require_success = true;
        }
    }

    if(flow.project.parsed.project.build.post) {
        flow.project.parsed.project.build.post.__path = flow.project.root;
        prepared.hooks.post['__project'] = flow.project.parsed.project.build.post;

        //default to requiring success
        if(prepared.hooks.post['__project'].require_success === undefined) {
            prepared.hooks.post['__project'].require_success = true;
        }
    }

} //prepare_hooks


    //prepare the app nodes that make sense
internal.prepare_app = function(flow, prepared) {

    //:todo:wip:
    //this may have side effects, will
    //do when can focus on it

    // "main" : "Main",
    // "output" : "bin",
    // "package" : "org.snowkit.flow_app",
    // "codepaths" : [ "src" ],

} //prepare_app

internal.prepare_icons = function(flow, prepared) {

    //icons simply need to append their source project path so that they can be
    //correctly located in the resulting icons command.

    var using_default = true;

    if(!prepared.source.project.app) {
        if(flow.config.icons_disable_default) {
            return;
        }
    } //no app node

    if(!prepared.source.project.app.icon) {
        if(flow.config.icons_disable_default) {
            return;
        }
    } else {//no icon

        using_default = false;

    } //yes icon

    if(using_default) {

        flow.log(4, 'prepare - icon - using default');

        var default_icon_path = path.resolve(flow.flow_path, 'cmd/icons/');

        prepared.source.project.app._icon = {
            dest : 'flow',
            source : 'default',
            __path : default_icon_path
        };

    } else {

        prepared.source.project.app._icon = {
            dest : 'icon',
            source : prepared.source.project.app.icon,
            __path : ''
        };

            //so, do dependencies first, in order, overriding the source path only as it walks
        for(index in prepared.depends_list) {

            var name = prepared.depends_list[index];
            var depend = prepared.depends[name];

            if(depend.project.project.app && depend.project.project.app.icon) {
                flow.log(4, 'prepare - icon - in depends', name, depend.project.__root);
                prepared.source.project.app._icon.__path = depend.project.__root || prepared.source.project.app._icon.__path;
            }

        } //each depends

            //then, if it's from the source project, override the value to nothing
        if(flow.project.parsed.project.app && flow.project.parsed.project.app.icon) {
            prepared.source.project.app._icon.__path = flow.project.root;
            flow.log(4, 'prepare - icon - sourced from project', flow.project.root);
        }

    } //using_default

} //prepare_icons

    //note that files are prepared from the parsed project instead of the prepared
    //project because they are cascaded, leaving dependencies files incorrectly
    //located in the local project file tree (which i will resolve later but is clean enough)
internal.prepare_files = function(flow, prepared) {

    internal.log(flow, 3, 'prepare - files ...');

    var projconf = flow.project.parsed.flow;
    if(projconf) {
        if(projconf.build && projconf.build.files_allow_unsafe_paths) {
            internal.log(flow, 1, '>>>> prepare - files - IMPORTANT - project is explicitly allowing unsafe paths');

            // if(flow.flags['files-allow-unsafe-paths']) {
                prepared.files_unsafe = true;
                // internal.log(flow, 1, '>>>> prepare - files - given both --files-allow-unsafe-paths and files_allow_unsafe_paths in config. unsafe paths are now enabled!');
                internal.log(flow, 1, '>>>> prepare - files - given files_allow_unsafe_paths in config. unsafe paths are now enabled!');
            // } else {
                // return internal.fail(flow, prepared, 'files', 'prepare - files - unsafe paths requires the --files-allow-unsafe-paths flag as well as files_allow_unsafe_paths in the flow build config from the root project.');
            // }

        }
    }

        var result = { build_files:[], project_files:[] }

        //some local helper functions

            var file_update_into = function(source, dest) {
                return {
                    nodeid: source.nodeid,
                    template: source.template,
                    source: source.source, dest: source.dest,
                    dest_value: source.dest_value,
                    source_value: source.source_value,
                    source_name: source.source_name
                }
            }

                //for each node in the existing list, if this nodeid is the same,
                //we update the existing item, otherwise we add it to the list
            var file_update_or_add = function(list, node) {

                var existed = false;
                for(fidx in list) {
                    var existing = list[fidx];
                    if(existing.nodeid == node.nodeid) {
                        existing = file_update_into(node, existing);
                        list[fidx] = existing;
                        existed = true;
                    }
                }

                if(!existed) {
                    list.push(node);
                }

                return list;

            } //file_update_or_add

            var list_update_or_add = function(list_src, list_dest) {

                for(idx in list_src) {
                    list_dest = file_update_or_add(list_dest, list_src[idx]);
                }

                return list_dest;

            } //list_update_or_add


            //now, check each dependency and get their files, making them
            //absolute to their path, such that they can be copied
        for(index in prepared.depends_list) {

            var name = prepared.depends_list[index];
            var depend = prepared.depends[name];

            var sourcepath = depend.project.__root;
            var depfiles = files.parse(flow, prepared, depend.project, sourcepath);

                //merge them into the final list
            result.build_files = list_update_or_add(depfiles.build_files, result.build_files);
            result.project_files = list_update_or_add(depfiles.project_files, result.project_files);

        } //each depends

            //now fetch the ones from the root project last so they are respected
        var projfiles = files.parse(flow, prepared, flow.project.parsed, null);

            //and merge them
        result.build_files = list_update_or_add(projfiles.build_files, result.build_files);
        result.project_files = list_update_or_add(projfiles.project_files, result.project_files);

        prepared.files = result;

    internal.log(flow, 3, 'prepare - files - ok');

} //prepare_files

