
    var   cmds = require('../')
        , fs = require('graceful-fs')
        , path = require('path')
        , wrench = require('wrench')
        , bake = require('../../project/bake')
        , cmd = require('../../util/process')
        , util = require('../../util/util')


var internal = {};

    //an error to throw in case of failure to find haxe
function HaxeCompileError(message) {
    this.name = "HaxeCompileError";
    this.message = message;
}
HaxeCompileError.prototype = Error.prototype;


exports.run = function(flow, config, done) {

    if(flow.timing) console.time('flow / build - total');

        //if requested we clean up, do so
    if(flow.flags.clean) {
        flow.execute(flow, cmds['clean']);
    }

        //first copy over all the files in the project
    flow.execute(flow, cmds['files']);

        //then ensure the folder for the build data exists
    wrench.mkdirSyncRecursive(flow.project.path_build, 0755);

        //fetch the hxml location
    var hxml_file = internal.get_hxml_file(flow, config);
    var hxml_path = path.join(flow.project.path_build, hxml_file);

        //write out the baked build hxml for the config
        if(flow.timing) console.time('flow / build - write hxml');

    internal.write_hxml(flow, config, hxml_path);

        if(flow.timing) console.timeEnd('flow / build - write hxml');

        //then run the haxe build stage, if it fails, early out
        //but since the console will be logging the output from haxe,
        // no need to log it again.
    if(flow.timing) console.time('flow / build - haxe');
    internal.build_haxe(flow, config, hxml_file, function(err) {
        if(flow.timing) console.timeEnd('flow / build - haxe');

        if(err) {
            console.log('\nflow / build - stopping because of errors in haxe compile \n');
            return flow.project.failed = true;
        }

            //on native targets we run hxcpp against the now
            //generated build files in the build output
        if(flow.target_native) {

            if(flow.timing) console.time('flow / build - hxcpp');
            internal.build_hxcpp(flow, config, function(err) {
                if(flow.timing) console.timeEnd('flow / build - hxcpp');

                if(err) {
                    console.log('\nflow / build - stopping because of errors in hxcpp compile \n');
                    return flow.project.failed = true;
                }

                internal.post_build_cpp(flow, config, function(){
                    internal.post_build(flow, config, done);
                });

            }); //run hxcpp

        } else { //native targets

            internal.post_build(flow, config, done);

        } //!native

    }); //run haxe

} //run


internal.post_build = function(flow, config, done) {

    if(flow.timing) console.timeEnd('flow / build - total');

    if(done) {
        done(flow.project.failed);
    }

} //post_build

internal.post_build_cpp = function(flow, config, done) {

    console.log('flow / build - running cpp post process');

    //the post build is so that we can move the binary file
    //from the output path if needed etc, run extra scripts and so on
    if(flow.timing) console.time('flow / build - binary copy');

        var binary_source = path.join(flow.project.path_build, 'cpp/' + flow.config.build.app_boot);
        util.copy_path(flow, binary_source, flow.project.path_binary);

    if(flow.timing) console.timeEnd('flow / build - binary copy');

        if(flow.system == 'mac' || flow.system == 'linux') {
            if(flow.timing) console.time('flow / build - binary chmod');
            cmd.exec('chmod', ['+x',flow.project.path_binary], {quiet:true}, function(code,out,err){
                if(flow.timing) console.timeEnd('flow / build - binary chmod');
                if(done) done(code,out,err);
            });
        }

} //post_build

internal.build_haxe = function(flow, config, hxml_file, done) {

    console.log('flow / build - running haxe compile against %s', hxml_file );

    var opt = {
        // quiet : false,
        cwd: path.resolve(flow.run_path, flow.project.path_build)
    }

    cmd.exec('haxe', [hxml_file], opt, done);

    return false;

} //build_haxe

internal.build_hxcpp = function(flow, config, done) {

    var cpp_path = path.join(flow.project.path_build, 'cpp/');
    var hxcpp_file = 'Build.xml';

    console.log('flow / build - running hxcpp compile against %s', hxcpp_file );

    var opt = {
        quiet : false,
        cwd: path.resolve(flow.run_path, cpp_path)
    }

    cmd.exec('haxelib', ['run','hxcpp',hxcpp_file], opt, done);


} //build_hxcpp

internal.get_hxml_file = function(flow, config) {

    var hxml_file = 'build';

    if(flow.flags.debug) hxml_file += '.debug';
    if(flow.flags.final) hxml_file += '.final';

    hxml_file += '.hxml';

    return hxml_file;

} //get_hxml_file

internal.write_hxml = function(flow, config, write_to) {

    console.log('flow / build - writing hxml to ' + write_to);

    fs.writeFileSync(write_to, flow.project.hxml, 'utf8');

} //write_hxml