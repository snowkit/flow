
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

    glob( "*.flow" , { sync:true, cwd:root || process.cwd() }, function(er, files) {
        list = list.concat(files);
    });

    return list;

} //find_flow_files


exports.verify = function verify(flow, project_path, project_root, is_dependency, quiet) {

    var project_file = flow.flags.project || project_path;
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

        var flow_files = exports.find_flow_files(flow);

        if(flow_files.length > 1) {
            return fail_verify('uh.. multiple *.flow files found, which one did you mean? use --project <your.flow> or keep a single project file in the root of your project');
        } else if(flow_files.length == 0) {
            return fail_verify('cannot find any *.flow project files in the current working directory. run flow from your project root alongside your.flow file');
        } else {
            project_file = flow_files[0];
        }

    } //!project_file

    abs_path = util.normalize(path.resolve(project_file));

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


    //the final target path for the output
exports.get_path_root = function(flow, prepared) {

    return util.normalize(prepared.source.project.app.output, true);

} //get_path_root

exports.get_path_output = function(flow, prepared) {

    var dest_folder = exports.get_path_root(flow, prepared);

    dest_folder = path.join(dest_folder, flow.target);

    if(flow.target_arch == '64') {
        dest_folder += flow.target_arch;
    }

    return util.normalize(dest_folder, true);

} //get_path_output

exports.get_path_build = function(flow, prepared) {

    var dest_folder = exports.get_path_output(flow, prepared);

        //remove trailing slash
    dest_folder = dest_folder.slice(0, -1);

    return util.normalize(dest_folder + '.build', true);

} //get_path_build

exports.get_path_files = function(flow, prepared) {

    var dest_path = flow.config.build.files_dest_path;

    var plat = flow.config.build[flow.target];
    if(plat && plat.files_dest_path) {
        dest_path = plat.files_dest_path;
    }

    return dest_path;

} //get_path_files

exports.get_path_binary_dest = function(flow, prepared) {

    var dest_path = flow.config.build.binary_dest_path;

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_dest_path) {
        dest_path = plat.binary_dest_path;
    }

    return util.normalize(dest_path, true);

} //get_path_binary_dest

exports.get_path_binary_name = function(flow, prepared) {

    var dest_name = flow.config.build.binary_dest_name;

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_dest_name) {
        dest_name = plat.binary_dest_name;
    }

    return dest_name;

} //get_path_binary_name

exports.get_path_binary_name_source = function(flow, prepared) {

    var src_name = flow.config.build.binary_source_name;

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_source_name) {
        src_name = plat.binary_source_name;
    }

    return src_name;

} //get_path_binary_name_source


exports.prepare = function prepare(flow) {

    return _prepare.prepare(flow);

} //exports.prepare


exports.do_prepare = function(flow) {

    if(flow.project.prepared) {
        return;
    }

    flow.quiet.prepare = true;
    flow.quiet.project = true;

    var project = flow.project.verify(flow);

        //if no valid project was found
    if(!project.parsed) {
        return internal._error_project(flow, project.reason);
    }

    flow.project.parsed = project.parsed;
    flow.project.root = path.dirname(project.path);
    flow.project.path = project.path;
    flow.project.file = project.file;

    flow.project.prepare(flow);
    flow.project.bake(flow);

} //do_prepare

internal._error_project = function(flow, reason){

    if(reason && reason.length > 0) {
        return 'project file error \n\n > ' + reason;
    } else {
        return 'unknown project error';
    }

} //_error_project


exports.bake = function bake(flow, project) {

    return _bake.bake(flow, project);

} //exports.bake

exports.find_arch = function(flow) {

    var arch = '';

        //check if there is any explicit arch given
    if(flow.flags.arch) {
        var _arch = flow.flags.arch;
        if(_arch === true) {
            flow.log(1, '\nError\n--arch specified but no arch given\n\n> use --arch 32, --arch 64, --arch armv6 etc.\n');
            return null;
        } else {
            arch = _arch;
        }
    }

        //99.9% (guess) of used macs are x64 now,
        //so default to x64. use --arch 32 if you want to force it
    if(flow.target == 'mac') {
        if(!arch) {
            arch = '64';
        }
    }

        //default to the host operating system arch on linux
    if(flow.target == 'linux') {
        if(!arch) {
            if(process.arch == 'x64') {
                arch = '64';
            } else if(process.arch == 'ia32') {
                arch = '32';
            }
        }
    } //linux

        //default to armv7 on mobile, use --arch armv6 etc to override
    if(flow.target == 'ios' || flow.target == 'android') {

        if(flow.flags.sim) {
                //force sim arch
            arch = 'i386';
        }

        if(!arch) {
            arch = 'armv7';
        }

    }

        //until hxcpp gets x64 support, force 32 bit on windows
    if(flow.target == 'windows') {

        if(arch == '64') {
            flow.log(1, 'hxcpp does not support 64 bit on windows at the moment. Please ask at http://github.com/haxefoundation/hxcpp/issues if you would like this to happen.');
        }
            //force 32
        arch = '32';

    } //windows

    return arch;

} //arch
