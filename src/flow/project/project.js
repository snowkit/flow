
var   fs = require('graceful-fs')
    , path = require('path')
    , jsonic = require('jsonic')


exports.default = 'flow.json';

    //reads a flow.json project file and returns it's info
exports.parse = function parse(flow) {

    if(!flow.project.file) {
        console.log('flow / no project file..?');
        return null;
    }

    if(!fs.existsSync(flow.project.file)) {
        console.log('flow / project file not found at %s', flow.project.file);
        return null;
    }

    try {

        var project = jsonic( fs.readFileSync(flow.project.file,'utf8') );
        flow.project.current = project;

        return true;

    } catch(e) {

        console.log('flow / syntax error in project file\n');
        console.log('> %s:%d:%d %s \n', path.basename(flow.project.file), e.line,e.column, e.message);

        return false;

    }

} //parse

exports.verify = function verify(flow) {

    var project_file = flow.flags.project || exports.default;
    var abs_path = path.resolve(project_file);

    console.log('flow / looking for project file %s', abs_path)

    if(!fs.existsSync(abs_path)) {
        return null;
    }

    return abs_path;

} //verify