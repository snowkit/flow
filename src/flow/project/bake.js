
var   path = require('path')
    , util = require('../util/util')

var internal = {};

exports.bake = function bake(flow) {

    var project = flow.project.prepared;

    flow.log(3, 'bake - project %s\n', flow.project.parsed.project.name);

    flow.project.hxml = exports.hxml( flow, project );

    flow.log(3, flow.project.hxml);
    flow.log(3, '');

    flow.project.baked = true;

} //project

    //bakes defines into a usable form
exports.defines = function defines(flow, project, split) {

    split = split || '\n';

    var list = project.defines_list.map(function(a){
        return '-D ' + a;
    });

    return list.join(split) + split;

} //defines

    //bakes flags into a usable form
exports.flags = function flags(flow, project, split) {

    split = split || '\n';

    return project.flags.join(split) + split;

} //flags


exports.target = function(flow, project, split) {

    split = split || '\n';

    var values = '';

    if(flow.target_cpp) {

        var cpp_files_path = path.join(flow.project.paths.build, 'cpp/');
            cpp_files_path = path.relative(flow.project.root, cpp_files_path);
            cpp_files_path = util.normalize(cpp_files_path);

        values += '-cpp ' + cpp_files_path;

    } else if(flow.target_js) { //web

            //js the file can go straight out to the dest path
        var out_file = path.join(flow.project.paths.output, project.source.project.app.name+'.js');
        out_file = path.relative(flow.project.root, out_file);

        values += '-js ' + out_file;

    } else if(flow.target_neko) {

            //neko too can go straight out to the dest path
        var out_file = path.join(flow.project.paths.output, project.source.project.app.name+'.n');
        out_file = path.relative(flow.project.root, out_file);

        values += '-neko ' + out_file;

    } //

    return values;

} //target

exports.hxmls = function(flow, project, split) {
    
    split = split || '\n';

    var _other_hxmls = flow.project.prepared.hxmls;
    
    _other_hxmls = _other_hxmls.map(function(v) {
        return internal.get_hxml_path(flow, v);
    });

    return _other_hxmls.join(split);

} //hxmls

    //bakes the whole project into a usable complete hxml
exports.hxml = function(flow, project, with_compile, split) {

    split = split || '\n';

    var hxml_ = '-main ' + flow.config.build.boot + split;

        //add the target next
    hxml_ += exports.target(flow, project, split);

        //since we want to manually invoke the builds
        //with custom configs we tell haxe only to generate
        //the files, not invoke the post generate compiler (i.e hxcpp for cpp, etc)
    if(!with_compile) {
        hxml_ += split + '-D no-compilation' + split;
    }

    hxml_ += exports.defines(flow, project, split);
    hxml_ += exports.flags(flow, project, split);
    hxml_ += exports.hxmls(flow, project, split);

    return hxml_;

} //hxml

internal.get_hxml_path = function(flow, hxml_file) {
    var hxml_path = util.normalize( path.join(flow.project.paths.build, hxml_file) );
        hxml_path = path.relative( flow.project.root, hxml_path );
    return hxml_path;
}