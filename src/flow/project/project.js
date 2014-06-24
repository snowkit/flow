
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')
    , nodeutil = require('util')
    , util = require('../util/util')
    , _prepare = require('./prepare')
    , _bake = require('./bake')


exports.default = 'flow.json';

exports.init = function init(flow) {
        //default to the system if no target specified,
        //but needs to watch for command lines calling target
    flow.target =
        flow.flags._next('build') ||
        flow.flags._next('try') ||
        flow.flags._next('clean') ||
        flow.system;

    flow.target_arch = flow.project.find_arch(flow);
}

exports.verify = function verify(flow, project_path, quiet) {

    var project_file = flow.flags.project || project_path;
        project_file = project_file || exports.default;

    var abs_path = path.resolve(project_file);

    if(!flow.quiet.project) {
        console.log('flow / project - looking for project file %s', abs_path)
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

    try {

        parsed = jsonic( fs.readFileSync( abs_path,'utf8' ) );

    } catch(e) {

        var reason = 'syntax error in project file\n';
            reason += nodeutil.format(' > %s:%d:%d %s \n', project_file, e.line,e.column, e.message);

        return fail_verify(reason);

    } //catch

        //check that its valid
    if(!parsed || parsed.constructor != Object) {
        return fail_verify('flow projects are a json object, this appears to be : ' + parsed.constructor);
    }

        //now check that it has valid information
    if(!(parsed.name) || !(parsed.version)) {
        return fail_verify('flow projects require a name and a version');
    }

        //safeguard against touching non existing build options
    if(!parsed.build) {
        parsed.build = {};
    }
        //then merge any base options from flow defaults into it
    parsed.build = util.merge_combine(flow.config.project.build, parsed.build);

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
exports.get_out_path = function get_out_path(flow, prepared) {

    var dest_folder = path.normalize(prepared.source.product.output) + '/';

    dest_folder += flow.target;

    if(flow.target_arch == '64') {
        dest_folder += flow.target_arch;
    }

    return dest_folder;

} //out_path

    //the final build data path for the output
exports.get_build_path = function get_build_path(flow, prepared) {

    return exports.get_out_path(flow, prepared) + '.build/';

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
            console.log('\nError\n--arch specified but no arch given\n\n> use --arch 86, --arch 64, --arch armv6 etc.\n');
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
            console.log('flow / hxcpp does not support 64 bit on windows at the moment. Please ask at http://github.com/haxefoundation/hxcpp/issues if you would like this to happen.');
        }
            //force 32
        arch = '32';
    } //windows

    return arch;

} //arch
