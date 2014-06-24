
var   fs = require('graceful-fs')
    , path = require('path')
    , wrench = require('wrench')
    , fse = require('fs-extra')

var internal = {};


exports.run = function run(flow, files) {

    console.log('flow / files - copying project assets to ', flow.project.path_output);

    console.log('');
    for(index in files) {
        var node = files[index];
        console.log('   copying %s to %s%s', node.source, flow.project.path_output, node.dest);
        var dest = path.normalize(path.join(flow.project.path_output,node.dest));
        if(fs.statSync(node.source).isDirectory()) {
            internal.copy_folder_recursively(flow, node.source, dest);
        } else {
            wrench.mkdirSyncRecursive(path.dirname(dest), 0755);
            fse.copySync(node.source, dest);
        }
    }

    console.log('');

} //run

    //in this case, verify will return a list of files
    //as a flat array of { source : dest } from prepared
exports.verify = function verify(flow, done) {

    console.log('flow / files - verifying ... ');

    var final_list = [];
    var warning = '';
    var err = null;

        //check if each source exists, otherwise
        //we throw an error because this is likely
        //unexpected. this can be configured from the
        //flow : { } object in the project
    for(index in flow.project.prepared.files) {

        var file = flow.project.prepared.files[index];
        // console.log('flow / files - checking for `' + file.source +'`');
        if(!fs.existsSync(file.source)) {
            warning += '       > missing files source path ' + file.source + '\n';
        } else {
            final_list.push(file);
        }

    } //index in prepared files

    if(flow.config.build.error_on_missing_files) {
        err = warning;
    } else {
        if(warning) {
            internal._missing_warning(flow, warning, 'Warning');
        }
    }

    done(err, final_list);

} //verify

internal._missing_warning = function(flow, msg, type) {
    console.log('\n    %s', type);
    console.log('      failed to find some files list in project tree!\n');
    console.log('%s', msg);
}

exports.error = function(flow, err) {

    internal._missing_warning(flow, err, 'Error');

} //error


internal.copy_folder_recursively = function(flow, _source, _dest, _overwrite) {

    // console.log('-    copying ' + _source + ' to ' + _dest );

    if(_overwrite == undefined) _overwrite = true;

        //make sure the destination exists
        //before copying any files to the location
    wrench.mkdirSyncRecursive(_dest, 0755);

        //obtain a list of items from the source
    var _source_list = wrench.readdirSyncRecursive(path.resolve(flow.run_path, _source));

        //for each source item, check if it's a directory
    var _source_file_list = [];

    for(var i = 0; i < _source_list.length; ++i) {
        var _is_dir = fs.statSync( path.join(_source, _source_list[i]) ).isDirectory();
        if(!_is_dir) {
            _source_file_list.push(_source_list[i]);
        }
    }

        //for each file only, copy it across
    for(var i = 0; i < _source_file_list.length; ++i) {
        var _dest_file = path.join(_dest,_source_file_list[i]);
        fse.ensureFileSync(_dest_file);
        fse.copySync( path.join(_source, _source_file_list[i]), _dest_file );
    }

} //copy_folder_recursively
