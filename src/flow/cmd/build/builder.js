
    var   cmds = require('../')
        , fs = require('graceful-fs')
        , path = require('path')
        , wrench = require('wrench')
        , bake = require('../../project/bake')
        , cmd = require('../../util/process')
        , util = require('../../util/util')

        , buildcpp = require('./build.cpp')
        , buildweb = require('./build.web')


var internal = {};

    //an error to throw in case of failure to find haxe
function HaxeCompileError(message) {
    this.name = "HaxeCompileError";
    this.message = message;
}
HaxeCompileError.prototype = Error.prototype;


exports.run = function(flow, done) {

    if(flow.timing) console.time('build - total');

        //if requested we clean up, do so
    if(flow.flags.clean) {
        flow.execute(flow, cmds['clean']);
    }

        //first copy over all the files in the project
    flow.execute(flow, cmds['files']);

        //check for failure already
    if(flow.project.failed) {
        return;
    }

        //then ensure the folder for the build data exists
    wrench.mkdirSyncRecursive(flow.project.paths.build, 0755);

        //fetch the hxml location
    var hxml_file = internal.get_hxml_file(flow);
    var hxml_path = util.normalize(path.join(flow.project.paths.build, hxml_file));

        //write out the baked build hxml for the build
        if(flow.timing) console.time('build - write hxml');

    internal.write_hxml(flow, hxml_path);

        if(flow.timing) console.timeEnd('build - write hxml');

        //write out the asset list
        if(flow.timing) console.time('build - write files list');

    internal.write_files_list(flow);

        if(flow.timing) console.timeEnd('build - write files list');

        //then run the haxe build stage, if it fails, early out
        //but since the console will be logging the output from haxe,
        // no need to log it again.
    if(flow.timing) console.time('build - haxe');

    internal.build_haxe(flow, hxml_file, function(code, out, err) {

        if(flow.timing) console.timeEnd('build - haxe');

        var outerr = out.indexOf('Aborted') != -1;
        var errerr = err.indexOf('Aborted') != -1;

        if(code || outerr || errerr) {
            flow.log(1,'\n build - stopping because of errors in haxe compile \n');
            return flow.project.failed = true;
        }

        internal.post_haxe(flow, done);

    }); //run haxe

} //run

internal.post_haxe = function(flow, done) {

        //on native targets we run hxcpp against the now
        //generated build files in the build output
    if(flow.target_cpp) {

        buildcpp.post_haxe(flow, function(err){
            internal.post_build(flow, done);
        });

    } else if(flow.target_js) {

        buildweb.post_haxe(flow, function(err){
            internal.post_build(flow, done);
        });

    } else { //native targets

        internal.post_build(flow, done);

    } //!native

} //post_haxe

internal.complete = function(flow, done) {

    if(flow.timing) console.timeEnd('build - total');

    flow.log(3,'');

    if(done) done(flow.project.failed);

} //complete

internal.post_build = function(flow, done) {


    if(flow.target_cpp) {

        buildcpp.post_build(flow, function(err){
            internal.complete(flow, done);
        });

    } else if(flow.target_js) {

        buildweb.post_build(flow, function(err){
            internal.complete(flow, done);
        });

    } else { //native targets

        internal.complete(flow, done);

    } //!native

} //post_build


internal.build_haxe = function(flow, hxml_file, done) {

    flow.log(2, 'build - running haxe ...');
    flow.log(3, 'haxe %s', hxml_file );

    var opt = {
        // quiet : false,
        cwd: path.resolve(flow.run_path, flow.project.paths.build)
    }

    cmd.exec(flow, 'haxe', [hxml_file], opt, done);

    return false;

} //build_haxe

internal.get_hxml_file = function(flow) {

    var hxml_file = 'build';

    if(flow.flags.debug) hxml_file += '.debug';
    if(flow.flags.final) hxml_file += '.final';

    hxml_file += '.hxml';

    return hxml_file;

} //get_hxml_file

internal.write_hxml = function(flow, write_to) {

    flow.log(3, 'build - writing hxml to ' + write_to);

    fs.writeFileSync(write_to, flow.project.hxml, 'utf8');

} //write_hxml


internal.write_files_list = function(flow) {

    if(flow.config.build.files_output_list) {

        var output_path = path.join(flow.project.paths.files, flow.config.build.files_output_list_name);
            output_path = util.normalize(output_path);

        flow.log(3, 'build - writing file list to ' + output_path);

        var output = JSON.stringify(flow.project.prepared.files.project_files_output);

        fs.writeFileSync(output_path, output, 'utf8');

    } //if config

} //write_files_list

