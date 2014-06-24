
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')
    , nodeutil = require('util')
    , util = require('../util/util')
    , _prepare = require('./prepare')
    , _bake = require('./bake')


exports.default = 'flow.json';


exports.prepare = function prepare(flow, project, build_config) {
    return _prepare.prepare(flow, project, build_config);
}

exports.bake = function bake(flow, project, build_config) {
    return _bake.bake(flow, project, build_config);
}

exports.verify = function verify(flow, project_path, quiet) {

    var project_file = flow.flags.project || project_path;
        project_file = project_file || exports.default;

    var abs_path = path.resolve(project_file);

    if(!quiet) {
        console.log('flow / looking for project file %s', abs_path)
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



