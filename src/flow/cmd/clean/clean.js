
    var   wrench = require('wrench')
        , path = require('path')

var internal = {};

exports.run = function run(flow, opt) {

    if(flow.timing) console.time('clean');

    if(opt.all) {

        flow.log(2, 'clean - cleaning %s ... \n', flow.project.parsed.project.app.output );
        wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.parsed.project.app.output), true);

    } else {

        if(opt.build) {
            flow.log(2, 'clean - cleaning %s ... ', flow.project.paths.build );
            wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.paths.build), true);
        }

        if(opt.output) {
            flow.log(2, 'clean - cleaning %s ... \n', flow.project.paths.output );
            wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.paths.output), true);
        }

    }

    if(flow.timing) console.timeEnd('clean');

} //run

exports.verify = function verify(flow, done) {

    var opt = {
        all : false,
        output : true,
        build : true
    }

        //if called from the command line, make sure its prepared
    flow.project.do_prepare(flow);

    if(flow.flags.all) {
        opt.all = true;
    }

        //default to cleaning both
    var do_build = flow.flags['clean-build'];
    var do_output = flow.flags['clean-output'];

        //can't specify build or output only with all flag
    if(opt.all && (do_build || do_output)) {
        return done("cannot specify --all alongside --clean-build or --clean-output",null);
    }

        //if no flags, do both
    if(!do_output && !do_build) {
        do_output = do_build = true;
    }

    opt.output = do_output;
    opt.build = do_build;

    done(null,opt);

} //verify

exports.error = function(flow, err) {

    flow.log(1, 'clean command error, nothing has been cleaned');

    if(err && err.length > 0) {
        flow.log(1,'%s\n', err);
    }

} //error
