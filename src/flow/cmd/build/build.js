
    var known_targets = ['mac','windows','linux','ios','android','web'];

    exports.run = function run(target, flow) {

            //default to the system if no target specified
        flow.target = target || flow.system;

        console.log('flow / building for %s', flow.target);

    }; //run

    exports.verify = function verify(flow, done) {

        var target = flow.flags._next('build');

        if(target && target.charAt(0) != '-') {

                //look up the list of known targets
                //if found, it is a valid build command
            if(known_targets.indexOf(target) != -1) {

                return done(null, target);

            } else {

                var err = 'unknown target `' + target + '`\n\n';
                    err += '> known targets : ' + known_targets.join(', ');

                return done(err, null);

            } //not a known target

        } //target && target[0] != -

        done(null, target);

    }; //verify

    exports.error = function error(err, flow) {

        console.log('\nflow / build command error');
        console.log('flow / %s\n', err);
        console.log('flow / build command usage : \n');
        console.log('> flow build ?target -options');
        console.log('\n`target` is optional. Without it, the current platform is used.\n');

    }; //error

