
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

            if(flow.timing) console.time('build - binary copy');

    var source_binary = flow.config.build.boot;

    var plat = flow.config.build[flow.target];
    if(plat && plat.binary_extension) {
        source_binary += '.'+plat.binary_extension;
    }

    var source_path = path.join(flow.project.path_build, 'cpp/' + source_binary);

    util.copy_path(flow, source_path, flow.project.path_binary);

            if(flow.timing) console.timeEnd('build - binary copy');

        if(flow.system == 'mac' || flow.system == 'linux') {
            if(flow.timing) console.time('build - binary chmod');
            cmd.exec(flow, 'chmod', ['+x',flow.project.path_binary], {quiet:true}, function(code,out,err){
                if(flow.timing) console.timeEnd('build - binary chmod');
                if(done) done(code,out,err);
            });
        } else {
            if(done) done();
        }

} //post_build

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

    var cpp_path = path.join(flow.project.path_build, 'cpp/');
    var hxcpp_file = 'Build.xml';
    var args = [hxcpp_file];

    if(flow.target_native && flow.target_arch == '64') {
        args.push('-DHXCPP_M64');
    }

    flow.log(2, 'build - running hxcpp ...');
    flow.log(3, 'haxelib run hxcpp %s', hxcpp_file );

    var opt = {
        quiet : false,
        cwd: path.resolve(flow.run_path, cpp_path)
    }

    cmd.exec(flow, 'haxelib', ['run','hxcpp'].concat(args), opt, done);


} //build_hxcpp
