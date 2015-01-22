
var   buildcpp = require('../build.cpp')
    , path = require('path')
    , wrench = require('wrench')
    , util = require('../../../util/util')
    , hooks = require('../../hooks/hooks')


var internal = {};


exports.run = function run(flow, data) {

    flow.log(2, 'build - lib %s for %s | %s', flow.project.parsed.project.name, flow.target, flow.target_arch);

    internal.flow = flow;
    internal.run_path = util.normalize( path.dirname(flow.project.path) );

    var objpath = path.join(internal.run_path, 'obj/');

    if(flow.flags.clean) {
        flow.log(2, 'build - lib - cleaning %s ... \n', objpath );
        wrench.rmdirSyncRecursive(objpath, true);
    }

        //run the pre build hooks if any
    hooks.run_hooks(flow, 'pre', internal.step_one);

} //run

internal.step_one = function(err) {

    var flow = internal.flow;

    if(!err) {
        buildcpp.run_hxcpp(flow, internal.run_path, 'Build.xml', internal.step_two);
    } else { //!err
        return flow.finished();
    } //err

} //step_one

internal.step_two = function(err) {

    var flow = internal.flow;

    flow.log(2,'build - done');

    if(!err) {
        hooks.run_hooks(flow, 'post', internal.final_step);
    } else { //!err
        return flow.finished();
    }

} //step_two


internal.final_step = function(err) {

    var flow = internal.flow;
    if(!err) {

        //post lib build

    } else { //err
        return flow.finished();
    }

} //final_step

exports.verify = function verify(flow, done) {

    done(null, null);

} //verify

exports.error = function(flow, err) {

} //error