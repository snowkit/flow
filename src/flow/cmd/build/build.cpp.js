
    var   cmds = require('../')
        , fs = require('graceful-fs')
        , path = require('path')
        , cmd = require('../../util/process')
        , haxelib = require('../../util/haxelib')
        , util = require('../../util/util')
        , bars = require('handlebars')
        , fse = require('fs-extra')

var internal = {};

exports.post_build = function(flow, done) {

    flow.log(3,'build - running cpp post process');

    if(flow.target_desktop) {
        flow.log(3,'build - cpp - target desktop post build');
        internal.post_build_desktop(flow, done);
    } else if(flow.target_mobile) {
        flow.log(3,'build - cpp - target mobile post build');
        internal.post_build_mobile(flow, done);
    } else {
        flow.log(3,'build - cpp - non desktop/mobile post build');
        if(done) done();
    }

} //post_build

exports.ios_combine_archs = function(flow, done) {

    if(flow.flags.archs) {

        var archs = flow.flags.archs.split(',');
            archs = archs.map(function(a){ return flow.project.adjust_arch(flow, a.trim()) });

        flow.log(2, "build - ios - combining multiple archs into one", archs);

        var dest = flow.project.get_path_binary_dest_full(flow, flow.project.prepared, 'fat');
            fse.ensureFileSync(dest);

        var args = ['-sdk','iphoneos', 'lipo',
                    '-output', dest,
                    '-create'];

        var input_list = archs.map(function(a){
            return flow.project.get_path_binary_dest_full(flow, flow.project.prepared, a);
        });

        args = args.concat(input_list);

        cmd.exec(flow, 'xcrun', args, { quiet:false }, function(code,out,err){
            if(done) {
                done(code);
            }
        });

        return;

    }  //if multiple archs

} //ios_combine_archs


internal.post_build_mobile = function(flow, done) {

    //run platform specific build chains
    if(flow.target == 'android') {
        return internal.build_android(flow, done);
    }

    if(flow.target == 'ios') {
        return exports.ios_combine_archs(flow, done);
    } //ios

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

    var ant_path = util.normalize(flow.config.build.android.ant_path);

    flow.log(2, 'build - android - using ant at %s', ant_path);

    if(!fs.existsSync(ant_path)) {
        flow.log(1, 'build - android - cannot find ant at specified path %s', ant_path );
        flow.project.failed = true;
        return flow.finished();
    }

    try {

        cmd.exec(flow, ant_path, args, opt, function(code,out,err){

                if(flow.timing) console.timeEnd('build - android - ant');

            if(code != 0) {
                flow.log(1,'build - android - stopping because ant failed to build, exit code %d', code);
                flow.project.failed = true;
                return flow.finished();
            }

                //now move the apk out into the user bin folder
            var apk_name = flow.project.prepared.source.project.app.name + '-' + build_type + '.apk';
            var apk_path = path.join(project_root, 'bin/' + apk_name);
            var apk_dest = path.join(flow.project.paths.output, apk_name);

            if(!fs.existsSync(apk_path)) {

                flow.log(1,'build - android - cannot copy build to output path!');
                flow.log(1,'build - android - missing file because %s build failed to generate an apk:', build_type, apk_path);
                flow.project.failed = true;
                return flow.finished();

            } else {

                    if(flow.timing) console.time('build - apk copy');
                util.copy_path(flow, apk_path, apk_dest);
                    if(flow.timing) console.timeEnd('build - apk copy');

                if(done) {
                    done(code,out,err);
                }

            }

        });

    } catch(e) {
        flow.log(1, 'build - android - cannot execute ant', e );
        return done('cannot execute ant...', null);
    }

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

internal.move_binary = function(flow, target_arch) {

    target_arch = target_arch || flow.target_arch;

    var binary_source = flow.project.get_path_binary_name_source(flow, flow.project.prepared, target_arch);
    var binary_dest_full = flow.project.get_path_binary_dest_full(flow, flow.project.prepared, target_arch);
    var source_path = util.normalize(path.join(flow.project.paths.build, 'cpp/' + binary_source));

    flow.log(3,'build - moving binary for %s from %s to %s', target_arch, source_path, binary_dest_full);

        if(flow.timing) console.time('build - binary copy');

    util.copy_path(flow, source_path, binary_dest_full);

        if(flow.timing) console.timeEnd('build - binary copy');

} //move_binary

internal.build_hxcpp_arch_list = function(flow, arch_list, run_path, hxcpp_file, done ) {

    //no list?
    if(!arch_list) {
        if(done) done();
        return;
    }

        //no more left in list?
    if(arch_list.length <= 0) {
        if(done) done();
        return;
    }

        //remove current arch from list
    var curr_arch = arch_list.shift();

    exports.build_hxcpp(flow, curr_arch, run_path, hxcpp_file, function(err) {

        if(err) {
            flow.log(1, '\n build - stopping because of errors in hxcpp compile, while building arch %s \n', curr_arch);
            flow.project.failed = true;
            return flow.finished();
        }

            //for now lib based projects don't do this step
        if(!flow.project.parsed.project.lib) {
            internal.move_binary(flow, curr_arch);
        }

        internal.build_hxcpp_arch_list(flow, arch_list, run_path, hxcpp_file, done);

    }); //run hxcpp

} //build_hxcpp_arch_list


exports.run_hxcpp = function(flow, run_path, hxcpp_file, done) {

    //building multiple archs?
    var archs = [flow.target_arch];

    if(flow.flags.archs) {
        archs = flow.flags.archs.split(',');
        archs = archs.map(function(a){ return flow.project.adjust_arch(flow, a.trim()); });
        flow.log(2, 'build - building multiple archs', archs);
    } else {
            //just build the normal one
        archs = [flow.target_arch];
    }

    internal.build_hxcpp_arch_list(flow, archs, run_path, hxcpp_file, done );

} //run_hxcpp

exports.post_haxe = function(flow, done) {

    var cpp_path = path.join(flow.project.paths.build, 'cpp/');
        cpp_path = path.resolve(flow.project.root, cpp_path);

        //write custom xml
    exports.write_hxcpp(flow, cpp_path);

        //build against it
    exports.run_hxcpp(flow, cpp_path, 'flow.Build.xml', done);

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

internal.parse_optionstxt = function(flow, options_file, text) {

    var result = [];
    var opt_empty_err = 'build - cpp - Options.txt was blank/empty?!';

    if(text && text.length) {
        flow.log(4, options_file + ' / ' + text);
        var opt_lines = text.split(/\r?\n/g);
        if(opt_lines && opt_lines.length) {

            if(flow.haxe.major == 3
            && flow.haxe.minor == 1) {
                opt_lines = opt_lines[0].split(/ /);
                opt_lines = opt_lines.filter(function(l) { if(l) return true; })
            } else
            if(flow.haxe.major == 3
            && flow.haxe.minor == 2) {
                opt_lines = opt_lines.filter(function(l) { if(l) return true; })
                opt_lines = opt_lines.map(function(l) { return '-D'+l; })
            }

            result = opt_lines;

        } else {
            flow.log(1,opt_empty_err,options_file);
        }
    } else {
        flow.log(1, opt_empty_err, options_file);
    }

    flow.log(4, 'hxcpp flags: ');
    flow.log(4, result);

    return result;

}

exports.build_hxcpp = function(flow, target_arch, run_path, hxcpp_file, done) {

    var hxcpp_file = hxcpp_file || 'flow.Build.xml';
    var args = [hxcpp_file];

    if(run_path) {
        run_path = util.normalize(run_path, true);
    }

    if(flow.flags.debug) {
        args.push("-Ddebug");
    }

        //with --log 3+ hxcpp can also be verbose
    if(flow.flags.log > 2) {
        args.push('-verbose');
    }

        //default to no windows console, but allow it through 
        //--d show_console or user define in project tree
    if(flow.target == 'windows' &&
       flow.project.prepared.defines_list.indexOf('show_console') == -1) {
        args.push('-Dno_console');
    }

    args.push('-D' + flow.target);

    switch(target_arch) {
        case '64':
            args.push('-DHXCPP_M64');

            if(flow.target_mobile) {
                flow.log(1, 'build / WARNING / you are using a --arch 64 setting on mobile, you probably meant --arch arm64?')
            }

            break;
        case 'arm64':
            args.push('-DHXCPP_ARM64');
            args.push('-DHXCPP_M64');
            break;
        case 'armv6':
            args.push('-DHXCPP_ARMV6');
            break;
        case 'armv7':
            args.push('-DHXCPP_ARMV7');
            break;
        case 'armv7s':
            args.push('-DHXCPP_ARMV7S');
            break;
        case 'x86':
            args.push('-DHXCPP_X86');
            break;
        case 'sim64':
            args.push('-Dsimulator');
            args.push('-DHXCPP_M64');
            break;
        case 'sim':
            args.push('-Dsimulator');
            break;
    }

    if(flow.target == 'ios') {
        args.push('-Diphone');
        args.push('-DHXCPP_CPP11');
        args.push('-DHXCPP_CLANG');
    }

    if(flow.target == 'android') {
        args.push('-Dandroid-' + flow.project.parsed.project.app.mobile.android.sdk_target);
    }

        //append command line + project based flags
    args = util.array_union(args, flow.project.prepared.hxcpp.flags);

        //and finally include the Options.txt flags
    try {

        var options_file = path.join(run_path,'Options.txt');
        var options_str = fs.readFileSync(options_file,'utf8');

        flow.log(3, 'build - cpp - using Options.txt from %s', options_file);

        var list = internal.parse_optionstxt(flow, options_file, options_str);
        args = util.array_union(args, list);

    } catch(e) {
        flow.log(3, 'build - cpp - no Options.txt for this build? ', e);
    }


    flow.log(2, 'build - running hxcpp for arch %s ...', target_arch);
    flow.log(3, 'haxelib run hxcpp %s', args.join(' ') );
    flow.log(3, 'running hxcpp from %s', run_path );

    var opt = {
        quiet : false,
        cwd: run_path
    }

    cmd.exec(flow, 'haxelib', ['run','hxcpp'].concat(args), opt, done);

} //build_hxcpp
