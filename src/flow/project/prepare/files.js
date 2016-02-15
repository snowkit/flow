
var   defines = require('./defines')
    , path = require('path')
    , bars = require('handlebars')

var internal = {};

    //returns an array of { source:dest } for the files in project
exports.parse = function parse(flow, prepared, source, srcpath) {

    flow.log(4, 'prepare - files');

    var project_file_list = [];
    var build_file_list = [];

        //parse normal files nodes
    internal.parse_node_list(flow, prepared, source.project.files, project_file_list);
    internal.parse_node_list(flow, prepared, source.project.build.files, build_file_list);

        //then parse the conditional files/build.files nodes if any
    internal.parse_conditional_files(flow, prepared, source, project_file_list, build_file_list);

    var project_root = flow.project.parsed.__root;
    var project_out = flow.project.paths.output;

        //now, we template the paths context into the list so that things like {{app.name}} resolve out into a path
    project_file_list = internal.template_nodes(flow, project_file_list);
    build_file_list = internal.template_nodes(flow, build_file_list);

        //make sure this file is within the bounds of the project + dependency scope
        //as well as append the given source path (i.e dependency abs file)
    if(srcpath) {

            //first map it to the given source path
        project_file_list = internal.append_source(flow, project_file_list, srcpath);
        build_file_list = internal.append_source(flow, build_file_list, srcpath);

    } else {

            //first map it to the flow project root
        project_file_list = internal.append_source(flow, project_file_list, flow.project.root);
        build_file_list = internal.append_source(flow, build_file_list, flow.project.root);

    }

    return {
        project_files : project_file_list,
        build_files : build_file_list
    };

} //parse


internal.template_path = function(flow, path_node, context) {
    var template = bars.compile(path_node);
    var result = template(context);
    return util.normalize(result);
}

internal.template_nodes = function(flow, list) {

    return list.map(function(file){

        file.dest_value = file.dest;
        file.source_value = file.source;

        file.source = internal.template_path(flow, file.source, flow.project.path_context );
        file.dest = internal.template_path(flow, file.dest, flow.project.path_context );

        return file;

    });

} //template_path

internal.append_source = function(flow, list, srcpath) {

    return list.map(function(file){

        file.source_name = file.source;
        file.source = util.normalize(path.join(srcpath, file.source));

        return file;

    });

} //append_source


internal.parse_conditional_files = function(flow, prepared, source, file_list, build_file_list) {

    if(source.if) {
        for(condition in source.if) {

            var files = source.if[condition].files;
            if(files) {
                if(defines.satisfy(flow, prepared, condition)){
                    internal.parse_node_list(flow, prepared, files, file_list);
                }
            } //files

            if(source.if[condition].build) {
                var build_files = source.if[condition].build.files;
                if(build_files) {
                    if(defines.satisfy(flow, prepared, condition)){
                        internal.parse_node_list(flow, prepared, build_files, build_file_list);
                    }
                }
            }
        } //each condition
    } //if

} //parse_conditional_files

internal.parse_node_list = function(flow, prepared, list, file_list) {
    for(name in list) {
        internal.parse_file(flow, prepared, name, list[name], file_list);
    }
} //parse_node_list

internal.parse_file = function(flow, prepared, _name, _node, file_list) {

    var _path = internal.parse_node(flow, prepared, _name, _node);

    if(_path === null) {
        flow.log(1, 'files - parsing failed for %s in %s', name, prepared.source.__path);
    }

    if(_path) {
        file_list.push( _path );
    }

    return file_list;

} //parse_file


    //parse a path into { nodeid:'', source :'', dest:'', template:'' }
internal.parse_node = function(flow, prepared, _name, _node) {

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
    parts = parts.map(function(part) { return part.trim(); });

    var result = { nodeid:_name, source:util.normalize(parts[0]), dest:util.normalize(parts[1]) };

    if(_node.template) {
        result.template = _node.template;
    }

    if(_node.not_listed) {
        result.not_listed = _node.not_listed;
    }

    return result;

} //parse_path