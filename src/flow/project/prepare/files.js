
var   defines = require('./defines')
    , path = require('path')


var internal = {};

    //returns an array of { source:dest } for the files in project
exports.parse = function parse(flow, prepared, project, srcpath, build_config) {

    flow.log(3, 'prepare - files');

    var project_file_list = [];
    var build_file_list = [];

    internal.parse_files(flow, prepared, project.files, project_file_list);
    internal.parse_files(flow, prepared, project.build.files, build_file_list);

    if(srcpath) {
        project_file_list = project_file_list.map(function(p){
            p.source = path.join(srcpath,p.source);
            return p;
        });

        build_file_list = build_file_list.map(function(p){
            p.source = path.join(srcpath,p.source);
            return p;
        });
    }

    return {
        project_files : project_file_list,
        build_files : build_file_list
    };

} //parse


internal.parse_files = function(flow, project, root, file_list) {

    if(!root) return;

        //start with the root object
    internal.parse_node_list(flow, project, root, file_list);

    //parse any potentially conditional files
    if(root.if) {
        for(conditional in root.if) {
            var current = root.if[conditional];
            if(defines.satisfy(flow, project, 'if', conditional)){
                internal.parse_node_list(flow, project, current, file_list);
            }
        } //each condition
    } //if

    if(root.unless) {
        for(conditional in root.unless) {
            var current = root.unless[conditional];
            if(defines.satisfy(flow, project, 'unless', conditional)){
                internal.parse_node_list(flow, project, current, file_list);
            }
        } //each condition
    } //unless

} //parse_project_files



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
        flow.log(1, 'files - parsing failed for %s in %s', name, project.source.__path);
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
            flow.log(1, '\n files - nodes can only be "path", "path => dest" or { path:"path => dest", ... }, given %s is invalid', _node.constructor.name);
            return null;
        }
    }

    var parts = _file_path.split('=>');

    if(parts.length > 2) {
        flow.log(1, '\n files - paths require only "source => dest", found %d components instead of 2\n', parts.length);
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