
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')
    , util = require('util') //node util, not local


exports.default = 'flow.json';


    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.cook = function cook(flow) {


} //cook

exports.verify = function verify(flow) {

    var project_file = flow.flags.project || exports.default;
    var abs_path = path.resolve(project_file);

    console.log('flow / looking for project file %s', abs_path)

        //fail if not found
    if(!fs.existsSync(abs_path)) {
        return { valid:false, reason:'cannot find file ' + project_file };
    }

        //attempt to parse the project file
    try {

        var project = jsonic( fs.readFileSync( abs_path,'utf8' ) );
        flow.project.current = project;

    } catch(e) {

        var reason = 'syntax error in project file\n';
            reason += util.format(' > %s:%d:%d %s \n', project_file, e.line,e.column, e.message);

            //no reason because it logs the reason here
        return { valid:false, reason:reason };

    }

    return { valid:true, path:abs_path };

} //verify