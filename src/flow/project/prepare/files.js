
var   defines = require('./defines')


var internal = {};

    //returns an array of { source:dest } for the files in project
exports.parse = function parse(flow, project, build_config) {

    // console.log('flow / preparing files');

    var file_list = [];

        //start with the root object
    internal.parse_node_list(flow, project, project.source.files, file_list);

    //parse any potentially conditional files
    if(project.source.files.if) {
        for(conditional in project.source.files.if) {
            var current = project.source.files.if[conditional];
            if(defines.satisfy(flow, project, 'if', conditional)){
                internal.parse_node_list(flow, project, current, file_list);
            }
        } //each condition
    } //if

    if(project.source.files.unless) {
        for(conditional in project.source.files.unless) {
            var current = project.source.files.unless[conditional];
            if(defines.satisfy(flow, project, 'unless', conditional)){
                internal.parse_node_list(flow, project, current, file_list);
            }
        } //each condition
    } //unless

    return file_list;

} //parse

internal.parse_node_list = function(flow, project, list, file_list) {
    for(name in list) {
        if(name != 'if' && name != 'unless') {
            internal.parse_file(flow, project, list[name], file_list);
        }
    }
} //parse_node_list

internal.parse_file = function(flow, project, _node, file_list) {

    var _path = internal.parse_node(flow, project, _node );

    if(_path === null) {
        console.log('flow / files - parsing failed for %s in %s', name, project.source.__path);
        // console.log('flow / files - this is NOT a critical build error, but the files will not exist in the build, so might result in runtime errors.\n')
        // console.log('> %s', _node);
    }

    if(_path) {
        file_list.push(_path);
    }

    return file_list;

} //parse_file


    //parse a path into { source : dest }
internal.parse_node = function(flow, project, _node) {

    var _file_path = _node;

        //if the file node contains more than a string
    if(_node.constructor == Object) {
        _file_path = _node.path;
    } else {
        if(_node.constructor != String) {
            console.log('\nflow / files - nodes can only be "path", "path => dest" or { path:"path => dest", ... }, given %s is invalid', _node.constructor.name);
            return null;
        }
    }

    var parts = _file_path.split('=>');

    if(parts.length > 2) {
        console.log('\nflow / files - paths require only "source => dest", found %d components instead of 2\n', parts.length);
        return null;
    }

        //if just path:'assets' turn it into source:assets, dest:assets
    if(parts.length == 1) {
        parts.push(parts[0]);
    }

        //clean up whitespaces
    parts = parts.map(function(p) { return p.trim(); });

    return { source:parts[0], dest:parts[1] };

} //parse_path