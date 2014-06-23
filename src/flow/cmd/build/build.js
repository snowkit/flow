
    var   config = require('./config')
        , cmds = require('../')
        , fs = require('graceful-fs')


//Build step


    exports.run = function run(flow, opt) {

            //default to the system if no target specified
        flow.target = opt.target || flow.system;
            //set the project values
        flow.project.parsed = opt.project.parsed;
        flow.project.path = opt.project.path;
        flow.project.file = opt.project.file;

            //not a normal build, but building a library
            //we defer this to it's own file
        if(flow.flags.lib) {
            flow.execute(flow, cmds['_build_lib']);
        } else {


            console.log('flow / building %s %s for %s',
                flow.project.parsed.name, flow.project.parsed.version, flow.target);

                //to build a project we need to cook it for the dependencies etc
            flow.project.cooked = flow.project.cook(flow, flow.project.parsed, config);

            if(!flow.project.cooked) {
                return flow.project.failed = true;
            }

            // console.log('cooked project\n', flow.project.cooked);

        }

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

