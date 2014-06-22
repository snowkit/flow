
    var config = require('./config');
    var cmds = require('../');

    exports.run = function run(flow, target) {

            //default to the system if no target specified
        flow.target = target || flow.system;

            //not a normal build, but building a library
            //we defer this to it's own file
        if(flow.flags.lib) {
            flow.execute(flow, cmds['_build_lib']);
        } else {
            console.log('flow / building for %s', flow.target);
        }

    }; //run

    exports.verify = function verify(flow, done) {

        var target = flow.flags._next('build') || flow.flags._next('try');

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

                return done(null, target);

            } else {

                return done( exports._error_unknown(flow, target), null);

            } //not a known target

        } //target && target[0] != -

        done(null, target);

    }; //verify

    exports.error = function error(flow, err) {

        console.log('\nflow / build command error');

        if(err && err.length > 0) {
            console.log('flow / %s\n', err);
        }

    }; //error

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

