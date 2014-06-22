
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')
    , util = require('util') //node util, not local


exports.default = 'flow.json';


    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.cook = function cook(flow, project) {

    console.log('flow / cooking project %s', project.name );

    if(project.build)

    return project;

} //cook

    //return only the dependencies, to avoid parsing the entire thing for one value.
    //returns an array of the parsed projects
exports.depends = function depends(flow, project) {

}

    //parse a specific flow project file for its data,
    //for example when walking the dependency tree it will call
    //this on each dependency
exports.parse = function parse(flow, project) {

}

exports.verify = function verify(flow) {

    var project_file = flow.flags.project || exports.default;
    var abs_path = path.resolve(project_file);

    console.log('flow / looking for project file %s', abs_path)

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
            reason += util.format(' > %s:%d:%d %s \n', project_file, e.line,e.column, e.message);

        return fail_verify(reason);

    }

    return result;

} //verify