
    var   config = require('./config')
        , cmds = require('../')
        , fs = require('graceful-fs')


//Build step


    exports.run = function run(flow, opt) {

            //default to the system if no target specified
        flow.target = opt.target || flow.system;

        flow.target_arch = exports._find_arch(flow);

        if(flow.target_arch === null) {
            return flow.project.failed = true;
        }

            //set the project values
        flow.project.parsed = opt.project.parsed;
        flow.project.path = opt.project.path;
        flow.project.file = opt.project.file;

            //if building a library we defer this to it's own commmand
        if(flow.flags.lib) {

            flow.execute(flow, cmds['_build_lib']);

        } else {

            console.log('\nflow / building %s %s for %s',
                flow.project.parsed.name, flow.project.parsed.version, flow.target);

                //to build a project we need to prepare it first
            flow.project.prepare(flow, config);

            if(!flow.project.prepared) {
                console.log('flow / project build failed at preparing\n');
                return flow.project.failed = true;
            }

                //the we bake it into a buildable form
            flow.project.bake(flow, config);

            if(!flow.project.baked) {
                console.log('flow / project build failed at baking\n');
                return flow.project.failed = true;
            }

            //only if every stage required to run an actual build succeeded,
            //do we clean up if requested. this allows failed configurations to not
            //wipe the output folder too soon
            if(flow.flags.clean) {
                flow.execute(flow, cmds['clean']);
            }

        } //!lib

    }; //run


//Verification step


    exports.verify = function verify(flow, done) {

        var result = {};
        var target = flow.flags._next('build') || flow.flags._next('try');

        var project = flow.project.verify(flow);

            //if no valid project was found
        if(!project.parsed) {
            return done( exports._error_project(flow, project.reason), null );
        }

        result.target = target;
        result.project = project;

        if(target && target.charAt(0) != '-') {

                //look up the list of known targets
                //if found, it is a valid build command
            if(config.known_targets.indexOf(target) != -1) {

                    //check that this is a valid target for our system
                var invalid = config.invalid_targets[flow.system];

                    //if not, invalidate
                if(invalid.indexOf(target) != -1) {
                    return done( exports._error_invalid(flow, target), null );
                }

                return done(null, result);

            } else {

                return done( exports._error_unknown(flow, target), null);

            } //not a known target

        } //target && target[0] != -

        done(null, result);

    }; //verify


//helpers

    exports._find_arch = function(flow) {

        var arch = '';

            //check if there is any explicit arch given
        if(flow.flags.arch) {
            var _arch = flow.flags.arch;
            if(_arch === true) {
                console.log('\nError\n--arch specified but no arch given\n\n> use --arch 86, --arch 64, --arch armv6 etc.\n');
                return null;
            } else {
                arch = _arch;
            }
        }

            //99.9% (guess) of used macs are x64 now,
            //so default to x64. use --arch 32 if you want to force it
        if(flow.target == 'mac') {
            if(!arch) arch = '64';
        }

            //default to the host operating system arch on linux
        if(flow.target == 'linux') {
            if(!arch) {
                if(process.arch == 'x64') {
                    arch = '64';
                } else if(process.arch == 'ia32') {
                    arch = '32';
                }
            }
        } //linux

            //default to armv7 on mobile, use --arch armv6 etc to override
        if(flow.target == 'ios' || flow.target == 'android') {
            if(!arch) {
                arch = 'armv7';
            }
        }

            //until hxcpp gets x64 support, force 32 bit on windows
        if(flow.target == 'windows') {
            if(arch == '64') {
                console.log('flow / hxcpp does not support 64 bit on windows at the moment. Please ask at http://github.com/haxefoundation/hxcpp/issues if you would like this to happen.');
            }
                //force 32
            arch = '32';
        } //windows

        return arch;

    } //arch

//Error handlers


    exports.error = function error(flow, err) {

        console.log('\nflow / build command error');

        if(err && err.length > 0) {
            console.log('flow / %s\n', err);
        }

    }; //error

    exports._error_project = function(flow, reason){

        if(reason && reason.length > 0) {
            return 'project file error \n\n > ' + reason;
        } else {
            return 'unknown project error';
        }

    } //_error_project

    exports._error_unknown = function(flow, target){

        var err = 'unknown target `' + target + '`\n\n';
            err += '> known targets : ' + config.known_targets.join(', ');

        return err;

    } //_error_unknown

    exports._error_invalid = function(flow, target){

        var err = 'invalid target `'+target+'` for system `'+flow.system+'` \n\n';

        var valid = [].concat(config.known_targets);
        var invalid = config.invalid_targets[flow.system];

            //remove invalid from valid list
        for(index in invalid) {

            var value = invalid[index];
            var valid_index = valid.indexOf(value);
            if(valid_index != -1) {
                valid.splice(valid_index,1);
            }

        } //index in valid

            err += '> valid targets : ' + valid.join(', ');

        return err;

    } //_error_invalid

