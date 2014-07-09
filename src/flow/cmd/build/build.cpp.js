
    var   cmds = require('../')
        , fs = require('graceful-fs')
        , path = require('path')
        , cmd = require('../../util/process')
        , util = require('../../util/util')


var internal = {};

exports.post_build = function(flow, config, done) {

    flow.log(3,'build - running cpp post process');

    //the post build is so that we can move the binary file
    //from the output path if needed etc, run extra scripts and so on
    var source_path = path.join(flow.project.paths.build, 'cpp/' + flow.project.paths.binary.source);

    flow.log(3,'build - moving binary from %s to %s', source_path, flow.project.paths.binary.full);

        if(flow.timing) console.time('build - binary copy');
    util.copy_path(flow, source_path, flow.project.paths.binary.full);
        if(flow.timing) console.timeEnd('build - binary copy');

    if(flow.target != 'android' && flow.target != 'ios') {
        internal.post_build_desktop(flow, source_path, done);
    } else {
        internal.post_build_mobile(flow, source_path, done);
    }

} //post_build

internal.post_build_mobile = function(flow, source_path, done) {

        //run platform specific build chains
    if(flow.target == 'android') {
        internal.build_android(flow, done);
        return;
    }

        //other platforms end here
    if(done) {
        done();
    }

} //post_build_mobile

    //runs ant, and such
internal.build_android = function(flow, done) {

    //handle ability to compile store build, vs debug test build
    var build_type = 'debug';
    //where to build from
    var project_root = path.join(flow.project.paths.build, flow.config.build.android.project);
    var build_meta_file = path.join(project_root,'bin/build.prop');

    //remove build meta data to ensure build happens
    if(fs.existsSync(build_meta_file)) {
        fs.unlinkSync(build_meta_file);
    }

    var args = [build_type];
    var opt = {
        cwd: project_root,
        quiet:false
    }

            if(flow.timing) console.time('build - android - ant');

    cmd.exec(flow, flow.config.build.android.ant_path, args, opt, function(code,out,err){

            if(flow.timing) console.timeEnd('build - android - ant');

            //now move the apk out into the user bin folder
        var apk_name = flow.project.prepared.source.project.app.name + '-' + build_type + '.apk';
        var apk_path = path.join(project_root, 'bin/' + apk_name);
        var apk_dest = path.join(flow.project.paths.output, apk_name);

            if(flow.timing) console.time('build - apk copy');
        util.copy_path(flow, apk_path, apk_dest);
            if(flow.timing) console.timeEnd('build - apk copy');


        if(done) {
            done(code,out,err);
        }

    });

} //build_android

internal.post_build_desktop = function(flow, done) {

    if(flow.system == 'mac' || flow.system == 'linux') {

                if(flow.timing) console.time('build - binary chmod');

        cmd.exec(flow, 'chmod', ['+x',flow.project.paths.binary.full], {quiet:true}, function(code,out,err){

                if(flow.timing) console.timeEnd('build - binary chmod');

            if(done) {
                done(code,out,err);
            }

        }); //exec

    } else {

        if(done) {
            done();
        }

    }

} //post_build_desktop

exports.post_haxe = function(flow, config, done) {

            if(flow.timing) console.time('build - hxcpp');

    internal.build_hxcpp(flow, config, function(err) {

            if(flow.timing) console.timeEnd('build - hxcpp');

        if(err) {
            flow.log(1, '\n build - stopping because of errors in hxcpp compile \n');
            return flow.project.failed = true;
        }

        done();

    }); //run hxcpp

} //exports


internal.build_hxcpp = function(flow, config, done) {

    var cpp_path = path.join(flow.project.paths.build, 'cpp/');
    var hxcpp_file = 'Build.xml';
    var args = [hxcpp_file];

    if(flow.target_cpp && flow.target_arch == '64') {
        args.push('-DHXCPP_M64');
    }

    if(flow.target == 'android') {
        args.push('-Dandroid');
        args.push('-Dandroid-' + flow.project.parsed.project.app.mobile.android.sdk_target);
    }

    flow.log(2, 'build - running hxcpp ...');
    flow.log(3, 'haxelib run hxcpp %s', args.join(' ') );

    var opt = {
        quiet : false,
        cwd: path.resolve(flow.run_path, cpp_path)
    }

    cmd.exec(flow, 'haxelib', ['run','hxcpp'].concat(args), opt, done);


} //build_hxcpp
