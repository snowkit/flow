
var   fs = require('graceful-fs')
    , path = require('path')
    , wrench = require('wrench')
    , fse = require('fs-extra')
    , bars = require('handlebars')
    , util = require('../../util/util')

var internal = {};

exports.run = function run(flow, files) {

        //copy local project + build files

        var ignore_files = (flow.flags.files === false);

        if(!ignore_files) {
            wrench.mkdirSyncRecursive(flow.project.paths.files, 0755);
            flow.log(3, 'files - copying project files to %s', flow.project.paths.files);
            flow.log(3,'');
        }

        var project_file_path = path.resolve(flow.project.root, flow.project.paths.files);
        var projectfiles = internal.copy_files(flow, files.project_files, project_file_path, ignore_files);

        var ignore_build_files = (flow.flags['build-files'] === false);

        if(!ignore_build_files) {
            wrench.mkdirSyncRecursive(flow.project.paths.build, 0755);
            flow.log(3,'');
            flow.log(3, 'files - copying build files to %s', flow.project.paths.build);
            flow.log(3,'');
        }

        var project_build_file_path = path.resolve(flow.project.root, flow.project.paths.build);
        var buildfiles = internal.copy_files(flow, files.build_files, project_build_file_path, ignore_build_files);

        //clean up the list of files by their destination
    projectfiles.map(function(_path, i){
        _path = util.normalize(_path);
        var _root = path.resolve(flow.project.root, flow.project.paths.files);
            _root = util.normalize(_root, true);
        projectfiles[i] = _path.replace(_root,'');
    });

        //clean up the list of files by their destination
    buildfiles.map(function(_path, i){
        _path = util.normalize(_path);
        var _root = path.resolve(flow.project.root, flow.project.paths.build);
            _root = util.normalize(_root, true);
        buildfiles[i] = _path.replace(_root,'');
    });

        //store the lists
    flow.project.prepared.files.project_files_output = projectfiles;
    flow.project.prepared.files.build_files_output = buildfiles;


        //write out the asset list
        if(flow.timing) console.time('files - write files list');

    internal.write_files_list(flow);

        if(flow.timing) console.timeEnd('files - write files list');


    flow.log(3,'');
    flow.log(3,'files - done');
    flow.log(3,'');

} //run


    //in this case, verify will return a list of files
    //as a flat array of { source : dest } from prepared
exports.verify = function verify(flow, done) {

    flow.log(3, 'files - verifying ... ');

    flow.project.do_prepare(flow);

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

    var err_on_missing = flow.flags['error-on-missing'] || flow.config.build.files_error_on_missing;

    if(err_on_missing) {
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


internal.write_files_list = function(flow) {

    if(flow.flags.list !== false) {

        var out_name = flow.flags['list-name'] || flow.config.build.files_output_list_name;

        if(flow.config.build.files_output_list) {

            var output_path = path.join(flow.project.paths.files, out_name);
                output_path = util.normalize(output_path);

            var output = JSON.stringify(flow.project.prepared.files.project_files_output);

            if(flow.project.prepared.files.project_files_output.length > 0) {

                flow.log(3, 'files - writing file list to ' + output_path);

                fse.ensureFileSync(output_path);
                fs.writeFileSync(output_path, output, 'utf8');

            }

        } //if config

    } //no list

} //write_files_list


internal.copy_files = function(flow, files, output, no_copy) {

    var copied_list = [];

    if(files.length > 0) {

                //first deal with the files in the project itself
            for(index in files) {

                var node = files[index];
                var dest = util.normalize(path.join(output, node.dest));

                if(!no_copy) {

                    if(node.template) {

                        flow.log(3, '   copying with template %s from %s to %s%s', node.template, node.source, output, node.dest);

                        var res = internal.template_path(flow, node, dest);

                        if(!node.not_listed) {
                            copied_list = copied_list.concat( res );
                        }

                    } else {

                        flow.log(3, '   copying %s to %s%s', node.source, output, node.dest);

                        var res = util.copy_path(flow, node.source, dest);

                        if(!node.not_listed) {
                            copied_list = copied_list.concat( res );
                        }
                    }

                } else {//no_copy

                    copied_list.push( dest );

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
        _source_path = util.normalize(path.resolve(flow.project.root, node.source), true);
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

    var fname = path.basename(_source);
    if(fname.charAt(0) == '.') {
        flow.log(3, '        -      skip hidden file ' + _source);
        return;
    }

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
    var file_context = flow.project.get_file_context(flow);

    for(index in templates) {
        var templ = templates[index];
        var context = flow.project.prepared.source[templ];
        if(!context) {
            flow.log(3, '    Warning - template value missing! %s was not found in the project root', templ);
        } else {
            file_context[templ] = context;
        }
    } //each templates

    var raw_file = fs.readFileSync(_source, 'utf8');

    flow.log(6, 'context for file node : ', _source, file_context);

    var template = bars.compile(raw_file);
    var templated = template( file_context );

    fse.ensureFileSync(_dest);
    fs.writeFileSync(_dest, templated, 'utf8');

} //template_file

internal._missing_warning = function(flow, msg, type) {

    var level = 3;

    if(type == 'Error') {
        level = 1;
    }

    console.log('');
    flow.log(level, '%s', type);
    flow.log(level, 'failed to find some files list in project tree!\n');
    flow.log(level, '%s', msg);

} //_missing_warning

exports.error = function(flow, err) {

    internal._missing_warning(flow, err, 'Error');

} //error

