
var   buildcpp = require('../build.cpp')
    , path = require('path')
    , util = require('../../../util/util')

exports.run = function run(flow, data) {

    flow.log(2, 'build - lib %s for %s | %s', flow.project.parsed.project.name, flow.target, flow.target_arch);

    var run_path = util.normalize( path.dirname(flow.project.path) );

    buildcpp.build_hxcpp(flow, run_path, function(code,out,err){

        flow.log(2, 'build - done');
    });


} //run

exports.verify = function verify(flow, done) {

    done(null, null);

} //verify

exports.error = function(flow, err) {

} //error