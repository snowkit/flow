
var   fs = require('graceful-fs')
    , path = require('path')
    , util = require('../../util/util')

var internal = {};

exports.run = function run(flow, files) {

        //copy local project + build files
    internal.copy_project_files(flow, files.project_files);
    internal.copy_build_files(flow, files.build_files);

    console.log('');

} //run


    //in this case, verify will return a list of files
    //as a flat array of { source : dest } from prepared
exports.verify = function verify(flow, done) {

    console.log('flow / files - verifying ... ');

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

        // console.log('flow / files - checking for `' + file.source +'`');
        if(!fs.existsSync(file.source)) {
            warning += '       > missing files source path ' + file.source + '\n';
        } else {
            final_project_files.push(file);
        }

    } //index in prepared files

    for(index in flow.project.prepared.files.build_files) {

        var file = flow.project.prepared.files.build_files[index];

        // console.log('flow / files - checking for `' + file.source +'`');
        if(!fs.existsSync(file.source)) {
            warning += '       > missing files source path ' + file.source + '\n';
        } else {
            final_build_files.push(file);
        }

    } //index in prepared build files

    if(flow.config.build.error_on_missing_files) {
        err = warning;
    } else {
        if(warning) {
            internal._missing_warning(flow, warning, 'Warning');
        }
    }

    done(err, { project_files:final_project_files, build_files:final_build_files });

} //verify

internal.copy_project_files = function(flow, files) {

    if(files.length > 0) {

        var output = flow.project.path_output;

        console.log('flow / files - copying project assets to %s\n', output);

                //first deal with the files in the project itself
            for(index in files) {

                var node = files[index];
                console.log('   copying %s to %s%s', node.source, output, node.dest);

                var dest = path.normalize(path.join(output, node.dest));
                util.copy_path(flow, node.source, dest);

            } //each project file

    } //files.length > 0

} //copy_project_files

internal.copy_build_files = function(flow, files) {

    if(files.length > 0) {

        var output = flow.project.path_build;

        console.log('\nflow / files - copying project build files to %s\n', output);

                //then we deal with the build files, to copy over to the build folder not the output folder
            for(index in files) {

                var node = files[index];
                console.log('   copying build file %s to %s%s', node.source, output, node.dest);

                var dest = path.normalize(path.join(output,node.dest));
                util.copy_path(flow, node.source, dest);

            } //each project file

    } //files.length > 0

} //copy_build_files

internal._missing_warning = function(flow, msg, type) {

    console.log('\n    %s', type);
    console.log('      failed to find some files list in project tree!\n');
    console.log('%s', msg);

} //_missing_warning

exports.error = function(flow, err) {

    internal._missing_warning(flow, err, 'Error');

} //error

