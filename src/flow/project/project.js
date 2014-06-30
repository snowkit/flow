
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')
    , nodeutil = require('util')
    , util = require('../util/util')
    , _prepare = require('./prepare')
    , _bake = require('./bake')
    , bars = require('handlebars')


var internal = {};
exports.default = 'project.flow';

exports.init = function init(flow) {
        //default to the system if no target specified,
        //but needs to watch for command lines calling target
    flow.target =
        flow.flags._next('build') ||
        flow.flags._next('try') ||
        flow.flags._next('clean') ||
        flow.system;

    flow.target_arch = flow.project.find_arch(flow);

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

} //init

bars.registerHelper('toString', function( value ) {
    return ( value === void 0 ) ? 'undefined' : value.toString();
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


exports.verify = function verify(flow, project_path, quiet) {

    var project_file = flow.flags.project || project_path;
        project_file = project_file || exports.default;

    var abs_path = path.resolve(project_file);

    if(!flow.quiet.project && !quiet) {
        flow.log(2, 'project - looking for project file %s', abs_path)
    }

    var result;

    function fail_verify(reason) {
        return {
            parsed : null,
            reason : reason,
            file : project_file,
            path : abs_path
        };
    }

        //fail if not found
    if(!fs.existsSync(abs_path)) {
        return fail_verify('cannot find file ' + project_file);
    }

    var parsed = null;

    var file_contents = fs.readFileSync( abs_path,'utf8' );

    if(!file_contents) {
        return fail_verify('file content is invalid : ' + file_contents);
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


        //safeguard against touching non existing build options
    if(!parsed.project.build) {
        parsed.project.build = {};
    }
        //then merge any base options from flow defaults into it
    parsed.build = util.merge_combine(flow.config.project.build, parsed.project.build);

    parsed.__path = abs_path;
    parsed.__file = project_file;

    result = {
        parsed : parsed,
        path : abs_path,
        file : project_file
    };


    return result;

} //verify


    //the final target path for the output
exports.get_out_root = function(flow, prepared) {

    var dest_folder = path.normalize(prepared.source.project.app.output) + '/';

    dest_folder += flow.target;

    if(flow.target_arch == '64') {
        dest_folder += flow.target_arch;
    }

    return dest_folder;

} //get_out_root

exports.get_out_binary = function(flow, prepared) {

    var app_name = prepared.source.project.app.name;
    var outpath = exports.get_out_path(flow, prepared);
    var outroot = exports.get_out_root(flow, prepared);

    if(flow.target == 'mac' && !flow.config.build.command_line) {
        outpath = path.join(outroot, app_name) + '.app/Contents/MacOS/';
    }

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_extension) {
        app_name += '.'+plat.binary_extension;
    }

    return path.join(outpath, app_name);

} //get_out_binary

exports.get_out_path = function get_out_path(flow, prepared) {

    var dest_folder = exports.get_out_root(flow, prepared);

        //some targets have considerations for their destination
    if(flow.target == 'mac' && !flow.config.build.command_line) {
        var postfix = prepared.source.project.app.name + '.app/' + flow.config.build.mac.output;
        dest_folder = path.join(dest_folder, postfix);
    }

    return dest_folder;

} //out_path

    //the final build data path for the output
exports.get_build_path = function get_build_path(flow, prepared) {

    return exports.get_out_root(flow, prepared) + '.build/';

} //build_path

exports.prepare = function prepare(flow, project, build_config) {

    return _prepare.prepare(flow, project, build_config);

} //exports.prepare

exports.bake = function bake(flow, project, build_config) {

    return _bake.bake(flow, project, build_config);

} //exports.bake

exports.find_arch = function(flow) {

    var arch = '';

        //check if there is any explicit arch given
    if(flow.flags.arch) {
        var _arch = flow.flags.arch;
        if(_arch === true) {
            flow.log(1, '\nError\n--arch specified but no arch given\n\n> use --arch 86, --arch 64, --arch armv6 etc.\n');
            return null;
        } else {
            arch = _arch;
        }
    }

        //99.9% (guess) of used macs are x64 now,
        //so default to x64. use --arch 32 if you want to force it
    if(flow.target == 'mac') {
        if(!arch) arch = '64';
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
