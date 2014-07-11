
    var   wrench = require('wrench')
        , path = require('path')

var internal = {};

exports.run = function run(flow, do_all) {

    if(flow.timing) console.time('clean');

    if(do_all) {
        flow.log(2, 'clean - cleaning %s ... \n', flow.project.parsed.project.app.output );
        wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.parsed.project.app.output), true);
    } else {
        flow.log(2, 'clean - cleaning %s ... ', flow.project.paths.build );
        wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.paths.build), true);
        flow.log(2, 'clean - cleaning %s ... \n', flow.project.paths.output );
        wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.paths.output), true);
    }

    if(flow.timing) console.timeEnd('clean');

} //run

exports.verify = function verify(flow, done) {

    var do_all = false;

        //if called from the command line, make sure its prepared
    flow.project.do_prepare(flow);

    if(flow.flags.all) {
        do_all = true;
    }

    done(null,do_all);

} //verify

exports.error = function(flow, err) {

} //error
