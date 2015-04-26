
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')
    , nodeutil = require('util')
    , util = require('../util/util')
    , _prepare = require('./prepare')
    , _bake = require('./bake')
    , bars = require('handlebars')
    , glob = require('glob')
    , gate = require('json-gate')


var internal = {};
exports.default_name = 'project.flow';

exports.paths = {}
exports.init = function init(flow) {

    var success = true;

        //default to the system if no target specified,
        //but needs to watch for command lines calling target
    flow.target =
        flow.flags._next('build')   ||
        flow.flags._next('launch')  ||
        flow.flags._next('run')     ||
        flow.flags._next('files')   ||
        flow.flags._next('package') ||
        flow.flags._next('clean')   ||
        flow.flags._next('info')    ||
        flow.flags._next('icons')   ||
        flow.flags._next('hooks')   ||
        flow.flags._next('setup')   ||
        flow.flags._next('sync')    ||
        flow.system;

    flow.target_arch = flow.project.find_arch(flow);

        //make sure these exist even if unset
    flow.target_cpp = false;
    flow.target_js = false;
    flow.target_desktop = false;
    flow.target_mobile = false;

    switch(flow.target) {
        case 'mac': case 'windows': case 'linux':
            flow.target_desktop = true;
        break;
        case 'ios': case 'android':
            flow.target_mobile = true;
        break;
    }

    switch(flow.target) {

        case 'mac': case 'windows': case 'linux':
        case 'ios': case 'android': {
            flow.target_cpp = true;
            break;
        }

        case 'web': {
            flow.target_js = true;
            break;
        }

    }

        //target not found in known targets?
    if(flow.config.build.known_targets.indexOf(flow.target) == -1) {
        success = false;
        flow.log(1, '\n\nError');
        flow.log(1, '- unknown target `%s`, known targets include %s\n', flow.target, flow.config.build.known_targets.join(', '));
    }

    return success;

} //init

bars.registerHelper('toString', function( value ) {
    return ( value === void 0 ) ? 'undefined' : value.toString();
});

bars.registerHelper('not_undefined', function( value ) {
    return ( value !== void 0 );
});

bars.registerHelper('is_undefined', function( value ) {
    return ( value === void 0 );
});

bars.registerHelper('upperFirst', function( value ) {
    return value.charAt(0).toUpperCase() + value.slice(1);
});

bars.registerHelper('if', function (v1, op_opt, v2, options) {

    if(options === void 0) {
        if(v2 === void 0) {
            return v1 ? op_opt.fn(this) : op_opt.inverse(this);
        }
    }

    var _true = false;
    switch (op_opt) {
        case '==':  _true = v1 == v2;   break;
        case '===': _true = v1 === v2;  break;
        case '!==': _true = v1 !== v2;  break;
        case '<':   _true = v1 < v2;    break;
        case '<=':  _true = v1 <= v2;   break;
        case '>':   _true = v1 > v2;    break;
        case '>=':  _true = v1 >= v2;   break;
        case '||':  _true = v1 || v2;   break;
        case '&&':  _true = v1 && v2;   break;
    }
    return _true ? options.fn(this) : options.inverse(this);
});


exports.find_flow_files = function(flow, root) {

    var list = [];

    glob( "*.flow" , { sync:true, cwd:root }, function(er, files) {
        list = list.concat(files);
    });

    return list;

} //find_flow_files


exports.verify = function verify(flow, project_path, project_root, is_dependency, quiet) {

    var project_file = project_path;
        project_root = project_root || process.cwd();

    project_root = path.resolve(project_root);

    var abs_path = '';

    function fail_verify(reason) {
        return {
            parsed : null,
            reason : reason,
            file : project_file,
            path : abs_path,
            root : project_root,
        };
    }

        //if no explicit project given, search for one
    if(!project_file) {

        flow.log(3, 'project - searching project root %s', project_root)

        var flow_files = exports.find_flow_files(flow, project_root);

        if(flow_files.length > 1) {
            return fail_verify('uh.. multiple *.flow files found, which one did you mean? use --project <your.flow> or keep a single flow file in the root of your project. root:' + project_root);
        } else if(flow_files.length == 0) {
            return fail_verify('cannot find any *.flow project files in '+project_root+'/ - run flow from your project root alongside your.flow file or use --project <your.flow>');
        } else {
            project_file = flow_files[0];
        }

    } //project_file

    abs_path = util.normalize(path.resolve(project_root, project_file));

    project_root = project_root || path.dirname(abs_path);
    project_root = util.normalize(project_root, true);


    if(!flow.quiet.project && !quiet) {
        flow.log(2, 'project - using project file %s', abs_path)
    }

    if(!fs.existsSync(abs_path)) {
        return fail_verify('cannot find project file at ' + abs_path);
    }

    var result;
    var parsed = null;
    var file_contents = fs.readFileSync( abs_path,'utf8' );

    if(!file_contents) {
        return fail_verify('file content is invalid for %s? content : ', abs_path, file_contents);
    }

    try {

        parsed = jsonic( file_contents );

    } catch(e) {

        var reason = 'syntax error in project file\n';
            reason += nodeutil.format(' > %s:%d:%d %s \n', project_file, e.line,e.column, e.message);

        return fail_verify(reason);

    } //catch

        //check that its valid
    if(!parsed || parsed.constructor != Object) {
        return fail_verify('flow projects are a json object, this appears to be : ' + parsed.constructor.name);
    }

        //now check that it has valid information
    if(!(parsed.project)) {
        return fail_verify('flow projects require a { project:{ name:"", version:"" } } minimum. missing "project"');
    }

    if(!(parsed.project.version)) {
        return fail_verify('flow projects require a { project:{ name:"", version:"" } } minimum. missing "version"');
    }

    if(!(parsed.project.name)) {
        return fail_verify('flow projects require a { project:{ name:"", version:"" } } minimum. missing "name"');
    }

        //then merge any base options from flow defaults into it,
        //unless it is a dependency project, those don't need this
    if(!is_dependency) {
        parsed.project = util.merge_unique(flow.project.defaults.project, parsed.project);
    } else {
        var dependency_defaults = { build:{} };
        parsed.project = util.merge_unique(dependency_defaults, parsed.project);
    }

    parsed.__root = project_root;
    parsed.__path = abs_path;
    parsed.__file = project_file;

    result = {
        parsed : parsed,
        root : project_root,
        path : abs_path,
        file : project_file
    };

    return result;

} //verify



//path utilities



exports.get_path_context = function(flow, prepared, target_arch) {

    var path_context = {
        app : {
            arch : target_arch,
            archtag : '',
            debugtag : flow.flags.debug ? '-debug' : '',
            iostag : 'os',
            boot : flow.config.build.boot,
            name : prepared.source.project.app.name
        },
        paths : flow.project.paths
    }

    if(target_arch == 'sim' || target_arch == 'sim64') {
        path_context.app.iostag = 'sim';
    }

        switch(target_arch) {
            case 'arm64':
            case 'sim64':
                path_context.app.archtag = '-64';
                break;
            case 'armv7':
                path_context.app.archtag = '-v7';
                break;
            case 'x86':
                path_context.app.archtag = '-x86';
                break;
            case 'armv7s':
                path_context.app.archtag = '-v7s';
                break;
        }

    return path_context;

} //get_path_context

exports.path_config_template = function(flow, prepared, path_template, context, norm) {
    var template = bars.compile(path_template);
    var result = template(context);
    return util.normalize(result, norm);
}


    //the final target path for the output
exports.get_path_root = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);
    var outpath = prepared.source.project.app.output;

    var cli_outpath = flow.flags['output-path'];
    if(cli_outpath) {
        if(cli_outpath !== true) {
            outpath = cli_outpath;
        } else {
            flow.log(2, 'project - warning - cli specified output-path without a value. ignoring!');
        }
    }

    return util.normalize(outpath, true);

} //get_path_root

exports.get_path_output = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);
    var dest_folder = exports.get_path_root(flow, prepared);

    dest_folder = path.join(dest_folder, flow.target);

    if(flow.target_arch == '64') {
        dest_folder += '64';
    }

    return util.normalize(dest_folder, true);

} //get_path_output

exports.get_path_build = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);
    var dest_folder = exports.get_path_output(flow, prepared);

        //remove trailing slash
    dest_folder = dest_folder.slice(0, -1);

    return util.normalize(dest_folder + '.build', true);

} //get_path_build

exports.get_path_files = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);
    var dest_path = flow.config.build.files_dest_path;

    var plat = flow.config.build[flow.target];
    if(plat && plat.files_dest_path) {
        dest_path = plat.files_dest_path;
    }

        //work out the context needed
    var context = exports.get_path_context(flow, prepared, target_arch);
        //return the templated value
    return exports.path_config_template(flow, prepared, dest_path, context, true);

} //get_path_files

exports.get_path_binary_dest = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);
    var dest_path = flow.config.build.binary_dest_path;

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_dest_path) {
        dest_path = plat.binary_dest_path;
    }

        //work out the context needed
    var context = exports.get_path_context(flow, prepared, target_arch);
        //return the templated value
    return exports.path_config_template(flow, prepared, dest_path, context, true);

} //get_path_binary_dest

exports.get_path_binary_name = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);
    var dest_name = flow.config.build.binary_dest_name;

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_dest_name) {
        dest_name = plat.binary_dest_name;
    }

        //work out the context needed
    var context = exports.get_path_context(flow, prepared, target_arch);
        //return the templated value
    return exports.path_config_template(flow, prepared, dest_name, context);

} //get_path_binary_name

exports.get_path_binary_name_source = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);
    var src_name = flow.config.build.binary_source_name;

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_source_name) {
        src_name = plat.binary_source_name;
    }

        //work out the context needed
    var context = exports.get_path_context(flow, prepared, target_arch);
        //return the templated value
    return exports.path_config_template(flow, prepared, src_name, context);

} //get_path_binary_name_source

exports.get_path_binary_dest_full = function(flow, prepared, target_arch) {

    target_arch = exports.adjust_arch(flow, target_arch);

    var dest = exports.get_path_binary_dest(flow, prepared, target_arch);
    var file = exports.get_path_binary_name(flow, prepared, target_arch);

    return path.join(dest,file);

} //get_path_binary_full

exports.adjust_arch = function(flow, target_arch) {

    target_arch = target_arch || flow.target_arch;

    if(flow.target == 'ios') {
        if(target_arch == 'i386') target_arch = 'sim';
        if(target_arch == 'x86_64') target_arch = 'sim64';
    }

    return target_arch;

} //adjust_arch

exports.prepare = function prepare(flow) {

    return _prepare.prepare(flow);

} //exports.prepare


exports.do_prepare = function(flow) {

    if(flow.project.prepared) {
        return;
    }

    flow.quiet.prepare = true;
    flow.quiet.project = true;

        //if no project given, it will look for one
    var _current_project = flow.flags.project;
    var _current_project_root = flow.flags['project-root'];
    var project = flow.project.verify(flow, _current_project, _current_project_root);

        //if no valid project was found
    if(!project.parsed) {
        return internal._error_project(flow, project.reason);
    }

    flow.project.parsed = project.parsed;
    flow.project.root = path.dirname(project.path);
    flow.project.path = project.path;
    flow.project.file = project.file;

    exports.ensure_path(flow);

    flow.project.prepare(flow);

    if(flow.project.prepared) {
        flow.project.bake(flow);
    } else {
        flow.log(1, 'project - failed at prepare');
    }

} //do_prepare

exports.ensure_path = function(flow) {

        //ensure we are in the correct place to perform any operations

    flow.log(3, 'project - switch to run in %s', flow.project.root);
    process.chdir(flow.project.root);

} //ensure_path

internal._error_project = function(flow, reason){

    if(reason && reason.length > 0) {
        return 'project file error \n\n > ' + reason;
    } else {
        return 'unknown project error';
    }

} //_error_project


exports.bake = function bake(flow) {

    return _bake.bake(flow);

} //exports.bake


    //return the specific arch/debug etc tags
    //for the given flow state
internal.get_context_tags = function(flow, into_node) {

        if(flow.flags.debug) {
            into_node.debugtag = '-debug';
        }

        if(flow.target_arch == 'sim' || flow.target_arch == 'sim64') {
            into_node.iostag = 'sim';
        }

        if(flow.target_arch == 'arm64') {
            into_node.archtag = '-64';
        }

        if(flow.target_arch == 'sim64') {
            into_node.archtag = '-64';
        }

        if(flow.target_arch == 'armv7') {
            into_node.archtag = '-v7';
        }

        if(flow.target_arch == 'armv7s') {
            into_node.archtag = '-v7s';
        }

    return into_node;

} //get_context_tags

    //get a template context for a file template
exports.get_file_context = function(flow) {

    var result = {
        debug : flow.flags.debug || false,
        arch : flow.target_arch,
        archtag : '',
        debugtag : '',
        flow : {
            config : util.deep_copy(flow.config)
        }
    };

    result = internal.get_context_tags(flow, result);

    return result;

} //get_file_context

exports.find_arch = function(flow) {

    var arch = '';

    if(flow.target == 'web') {
        return 'web';
    }

        //check if there is any explicit arch given
    if(flow.flags.arch) {

        var _arch = flow.flags.arch;

        if(_arch === true) {
            flow.log(1, '\nError\n--arch specified but no arch given\n\n> use --arch 32, --arch 64, --arch armv6 etc.\n');
            return null;
        } else {
            arch = String(_arch);
        }

    } //flags.arch

    if( flow.target == 'mac' ||
        flow.target == 'windows' ||
        flow.target == 'linux') {

        if(!arch) {

                //https://coderwall.com/p/0eds7q
                //because windows is terrible at basics.
            var is64bit = process.arch === 'x64' ||
                          process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');

            if(is64bit) {

                arch = '64';

                    //:todo: currently hxcpp doesn't bundle
                    //the prebuilt Windows64/ libs. And might not build 64 bit?
                    //to build these, use `neko ./build.n`
                    //from within /path/to/hxcpp/project/ folder
                    //and use --arch 64 explicitly
                if(flow.target == 'windows') {
                    arch = '32';
                }

            } else if(process.arch == 'ia32') {
                arch = '32';
            }

        } //not explicit arch

    } //desktop


        //default to armv7 on mobile, use --arch armv6 etc to override
    if(flow.target == 'ios' || flow.target == 'android') {

            //if running from an xcode build
        if(process.env['XCODE_VERSION_ACTUAL']) {
            var env_arch = process.env['CURRENT_ARCH'];
            if(env_arch == 'i386' || env_arch == 'x86_64') {

                arch = 'sim';

                if(env_arch == 'x86_64') {
                    arch += '64';
                }
            }
        }

        if(!arch) {
            arch = 'armv7';
        }

    } //ios || android

    return arch;

} //arch
