
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')
    , nodeutil = require('util')
    , _cook = require('./cook')


exports.default = 'flow.json';


exports.cook = function cook(flow, project, build_config) {
    return _cook.cook(flow, project, build_config);
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

    try {

        var parsed = jsonic( fs.readFileSync( abs_path,'utf8' ) );

            //now check that it has valid information
        if(!(parsed.name) || !(parsed.version)) {
            return fail_verify('flow projects require a name and a version');
        }

            //now check that it also has build information,
            //this may change because dependent projects may very well
            //use the parent defaults ? not sure, makes more sense atm to require
        if(!parsed.build) {
            return fail_verify('flow projects require build options');
        }

        result = {
            parsed : parsed,
            path : abs_path,
            file : project_file
        };

    } catch(e) {

        var reason = 'syntax error in project file\n';
            reason += nodeutil.format(' > %s:%d:%d %s \n', project_file, e.line,e.column, e.message);

        return fail_verify(reason);

    }

    return result;

} //verify



