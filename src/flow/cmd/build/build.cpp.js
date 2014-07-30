
    var   cmds = require('../')
        , fs = require('graceful-fs')
        , path = require('path')
        , cmd = require('../../util/process')
        , util = require('../../util/util')
        , bars = require('handlebars')
        , fse = require('fs-extra')

var internal = {};

exports.post_build = function(flow, done) {

    flow.log(3,'build - running cpp post process');

    //the post build is so that we can move the binary file
    //from the output path if needed etc, run extra scripts and so on
    var source_path = util.normalize(path.join(flow.project.paths.build, 'cpp/' + flow.project.paths.binary.source));

    flow.log(3,'build - moving binary from %s to %s', source_path, flow.project.paths.binary.full);

        if(flow.timing) console.time('build - binary copy');
    util.copy_path(flow, source_path, flow.project.paths.binary.full);
        if(flow.timing) console.timeEnd('build - binary copy');

    if(flow.target_desktop) {
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


    flow.log(2, 'android specifics', flow.project.prepared.source.project.app.mobile.android);

    //handle ability to compile store build, vs debug test build
    var build_type = flow.project.prepared.source.project.app.mobile.android.build_type;

        //where to build from
    var project_root = path.join(flow.project.paths.build, flow.config.build.android.project);
        //a build file to remove
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

        if(code != 0) {
            flow.log(1,'build - android - stopping because ant failed to build, exit code %d', code);
            return flow.project.failed = true;
        }

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

internal.post_build_desktop = function(flow, source_path, done) {

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

exports.post_haxe = function(flow, done) {

            if(flow.timing) console.time('build - hxcpp');

    var cpp_path = path.join(flow.project.paths.build, 'cpp/');
        cpp_path = path.resolve(flow.run_path, cpp_path);

        //write custom xml
    exports.write_hxcpp(flow, cpp_path);

        //use custom xml
    exports.build_hxcpp(flow, cpp_path, 'flow.Build.xml', function(err) {

            if(flow.timing) console.timeEnd('build - hxcpp');

        if(err) {
            flow.log(1, '\n build - stopping because of errors in hxcpp compile \n');
            return flow.project.failed = true;
        }

        done();

    }); //run hxcpp

} //exports


    //write out the hxcpp file from the flow project into the build folder
exports.write_hxcpp = function(flow, run_path) {

    var dest_file = path.join(run_path,'flow.Build.xml');
    var src_template = path.join(__dirname, 'cpp/flow.Build.xml');

    var context = {
        includes : {
            __haxe : { 
                name:'__haxe', file:'Build.xml', path:'Build.xml', 
                source:'flow internal', internal:true 
            }
        }
    };

    if(flow.project.prepared.hxcpp.includes) {
        for(name in flow.project.prepared.hxcpp.includes) {
            context.includes[name] = flow.project.prepared.hxcpp.includes[name];
        }
    }


    var template_content = fs.readFileSync(src_template, 'utf8');
    var template = bars.compile(template_content);
    var result = template(context);

    fse.ensureFileSync(dest_file);
    fs.writeFileSync(dest_file, result, 'utf8');

        //now, for each of the includes
        //copy them over with a special context
        //that will allow them to know their source

    for(include in context.includes) {

            var node = context.includes[include];

        if(!node.internal) {
            if(fs.existsSync(node.path)) {

                var inc_context = { FLOW_SOURCE:path.dirname(node.path) };
                var inc_content = fs.readFileSync(node.path,'utf8');
                var inc_template = bars.compile(inc_content);
                var inc_result = inc_template(inc_context);

                var inc_dest = path.join(run_path, node.file);

                fse.ensureFileSync(inc_dest);
                fs.writeFileSync(inc_dest, inc_result, 'utf8');

            } else { //if exists
                flow.log(1, 'build - hxcpp - missing external include file?? this will cause errors for sure ', node);
            }

        } //if not internal
    }

} //write_hxcpp

exports.build_hxcpp = function(flow, run_path, hxcpp_file, done) {

    var hxcpp_file = hxcpp_file || 'flow.Build.xml';
    var args = [hxcpp_file];

    if(run_path) {
        run_path = util.normalize(run_path, true);
    }

    if(flow.flags.debug) {
        args.push("-Ddebug");
    }

    if(flow.flags.log > 2) {
        args.push('-verbose');
    }

    args.push('-D' + flow.target);

    switch(flow.target_arch) {
        case '64':
            args.push('-DHXCPP_M64');
            break;
        case 'armv6':
            args.push('-DHXCPP_ARMV6');
            break;
        case 'armv7':
            args.push('-DHXCPP_ARMV7');
            break;
        case 'x86':
            args.push('-DHXCPP_X86');
            break;
    }

    if(flow.target == 'ios') {

        if(flow.flags.sim) {
            args.push('-Dsimulator');
        }

        args.push('-Diphone');
        args.push('-DHXCPP_CPP11');
        args.push('-DHXCPP_CLANG');
        args.push('-DOBJC_ARC');
    }

    if(flow.target == 'android') {
        args.push('-Dandroid-' + flow.project.parsed.project.app.mobile.android.sdk_target);
    }

    flow.log(2, 'build - running hxcpp ...');
    flow.log(3, 'haxelib run hxcpp %s', args.join(' ') );
    flow.log(3, 'running hxcpp from %s', run_path );

    var opt = {
        quiet : false,
        cwd: run_path
    }

    cmd.exec(flow, 'haxelib', ['run','hxcpp'].concat(args), opt, done);

} //build_hxcpp
