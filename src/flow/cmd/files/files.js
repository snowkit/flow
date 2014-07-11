
var   fs = require('graceful-fs')
    , path = require('path')
    , wrench = require('wrench')
    , fse = require('fs-extra')
    , bars = require('handlebars')
    , util = require('../../util/util')

var internal = {};

exports.run = function run(flow, files) {

        //copy local project + build files

    flow.log(2, 'files - copying project assets to %s', flow.project.paths.files);
    flow.log(3,'');

        var projectfiles = internal.copy_files(flow, files.project_files, flow.project.paths.files);

    flow.log(3,'');
    flow.log(2, 'files - copying build files to %s', flow.project.paths.build);
    flow.log(3,'');

        var buildfiles = internal.copy_files(flow, files.build_files, flow.project.paths.build);

        //clean up the list of files by their destination
    projectfiles.map(function(_path, i){
        _path = util.normalize(_path);
        projectfiles[i] = _path.replace(flow.project.paths.files,'');
    });

        //clean up the list of files by their destination
    buildfiles.map(function(_path, i){
        _path = util.normalize(_path);
        buildfiles[i] = _path.replace(flow.project.paths.build,'');
    });

        //store the lists
    flow.project.prepared.files.project_files_output = projectfiles;
    flow.project.prepared.files.build_files_output = buildfiles;


    flow.log(3,'');
    flow.log(3,'files - done');
    flow.log(3,'');

} //run


    //in this case, verify will return a list of files
    //as a flat array of { source : dest } from prepared
exports.verify = function verify(flow, done) {

    flow.log(3, 'files - verifying ... ');

    var final_project_files = [];
    var final_build_files = [];

    var warning = '';
    var err = null;

        //check if each source exists, otherwise
        //we throw an error because this is likely
        //unexpected. this can be configured from the
        //flow : { } object in the project
    for(index in flow.project.prepared.files.project_files) {

        var file = flow.project.prepared.files.project_files[index];

        flow.log(4, 'files - checking for project file `' + file.source +'`');
        if(!fs.existsSync(file.source)) {
            warning += '       > missing files source path ' + file.source + '\n';
        } else {
            final_project_files.push(file);
        }

    } //index in prepared files

    for(index in flow.project.prepared.files.build_files) {

        var file = flow.project.prepared.files.build_files[index];

        flow.log(4, 'files - checking for build file `' + file.source +'`');
        if(!fs.existsSync(file.source)) {
            warning += '       > missing files source path ' + file.source + '\n';
        } else {
            final_build_files.push(file);
        }

    } //index in prepared build files

    if(flow.config.build.files_error_on_missing) {
        if(warning) {
            err = warning;
            flow.project.failed = true;
        }
    } else {
        if(warning) {
            internal._missing_warning(flow, warning, 'Warning');
        }
    }

    done(err, { project_files:final_project_files, build_files:final_build_files });

} //verify

internal.copy_files = function(flow, files, output) {

    var copied_list = [];

    if(files.length > 0) {

                //first deal with the files in the project itself
            for(index in files) {

                var node = files[index];
                var dest = util.normalize(path.join(output, node.dest));

                if(node.template) {
                    flow.log(3, '   copying with template %s from %s to %s%s', node.template, node.source, output, node.dest);
                    copied_list = copied_list.concat( internal.template_path(flow, node, dest) );
                } else {
                    flow.log(3, '   copying %s to %s%s', node.source, output, node.dest);
                    copied_list = copied_list.concat( util.copy_path(flow, node.source, dest) );
                }

            } //each project file

    } //files.length > 0

    return copied_list;

} //copy_project_files

internal.template_path = function(flow, node, dest) {

    if(fs.statSync(node.source).isDirectory()) {
        return internal.template_folder_recursively(flow, node, dest);
    } else {
        internal.template_file(flow, node.template, node.source, dest);
        return [ dest ];
    }

} //template_path

internal.template_folder_recursively = function(flow, node, _dest, _overwrite) {

    var copied_list = [];

    if(_overwrite == undefined) _overwrite = true;

        //make sure the destination exists
        //before copying any files to the location
    wrench.mkdirSyncRecursive(_dest, 0755);

        //obtain a list of items from the source
    var _source_path = node.source;
        //if a relative path from our project, make it absolute
    if(!node.source_name) {
        _source_path = util.normalize(path.resolve(flow.run_path, node.source), true);
    }

    var _source_list = wrench.readdirSyncRecursive(_source_path);

        //for each source item, check if it's a directory
    var _source_file_list = [];

    for(var i = 0; i < _source_list.length; ++i) {
        var _is_dir = fs.statSync( path.join(node.source, _source_list[i]) ).isDirectory();
        if(!_is_dir) {
            var allow = _source_list[i].charAt(0) != '.' || !flow.config.build.files_ignore_dotfiles;
            if(allow) {
              _source_file_list.push(_source_list[i]);
            }
        }
    }

        //for each file only, copy it across
    for(var i = 0; i < _source_file_list.length; ++i) {

        var _dest_file = path.join( _dest, _source_file_list[i] );
        var source_path = path.join(node.source, _source_file_list[i]);

        flow.log(3,'        - copying with template %s %s to %s', node.template, source_path, _dest_file );

        // fse.copySync( source_path, _dest_file );
        internal.template_file(flow, node.template, source_path, _dest_file);
        copied_list.push(_dest_file);

    } //each source file

    return copied_list;

} //template_folder_recursively

internal.template_file = function(flow, _template, _source, _dest) {

    var templates = [];

        //we allow multiple context nodes via ['one','two']
    if(_template.constructor == Array) {
        templates = _template;
    } else if(_template.constructor == String) {
        templates.push(_template);
    } else {
        flow.log(1, '    Warning - template value on `files` currently supports Array or String only', _source, _template );
    }

        //we wrap the context against a root for clarity in the template files
        //as well as allowing multiple contexts side by side
    var real_context = {
        debug : flow.flags.debug || false,
        flow : { config : flow.config }
    };

    for(index in templates) {
        var templ = templates[index];
        var context = flow.project.prepared.source[templ];
        if(!context) {
            flow.log(1, '    Warning - template value missing! %s was not found in the project root', templ);
        } else {
            real_context[templ] = context;
        }
    } //each templates

    var raw_file = fs.readFileSync(_source, 'utf8');

    flow.log(6, 'context for file node : ', _source, real_context);

    var template = bars.compile(raw_file);
    var templated = template( real_context );

    fse.ensureFileSync(_dest);
    fs.writeFileSync(_dest, templated, 'utf8');

} //template_file

internal._missing_warning = function(flow, msg, type) {

    var level = 3;

    if(type == 'Error') {
        level = 1;
    }

    flow.log(level, '\n    %s', type);
    flow.log(level, '      failed to find some files list in project tree!\n');
    flow.log(level, '%s', msg);

} //_missing_warning

exports.error = function(flow, err) {

    internal._missing_warning(flow, err, 'Error');

} //error

