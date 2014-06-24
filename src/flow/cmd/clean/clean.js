
    var   wrench = require('wrench')
        , path = require('path')
        , build_config = require('../build/config')

var internal = {};

exports.run = function run(flow, do_all) {

    if(do_all) {
        console.log('flow / clean - cleaning %s ... \n', flow.project.parsed.product.output );
        wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.parsed.product.output), true);
    } else {
        console.log('flow / clean - cleaning %s ... ', flow.project.path_build );
        wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.path_build), true);
        console.log('flow / clean - cleaning %s ... \n', flow.project.path_output );
        wrench.rmdirSyncRecursive(path.resolve(flow.run_path, flow.project.path_output), true);
    }

} //run

exports.verify = function verify(flow, done) {

    var do_all = false;

        //if called from the command line, verify that build path and such exist!
    if(flow.project.path_build === undefined) {

        flow.quiet.prepare = true;
        flow.quiet.project = true;

        var project = flow.project.verify(flow);

            //if no valid project was found
        if(!project.parsed) {
            return done( internal._error_project(flow, project.reason), null );
        }

        flow.project.parsed = project.parsed;
        flow.project.path = project.path;
        flow.project.file = project.file;

        flow.project.prepare(flow, build_config);

        if(flow.flags.all) {
            do_all = true;
        }

    }

    done(null,do_all);

} //verify

exports.error = function(flow, err) {

} //error


internal._error_project = function(flow, reason){

    if(reason && reason.length > 0) {
        return 'project file error \n\n > ' + reason;
    } else {
        return 'unknown project error';
    }

} //_error_project
