
var  cmd = require('../../util/process')
   , path = require('path')
   , native = require('./run.native')
   , web = require('./run.web')

// > flow run target -options

exports.run = function run(flow, data) {

    if(!flow.project.parsed) {
        return;
    }

    if(flow.project.failed) {
        return;
    }

    flow.log(2, 'running %s %s for %s\n',
        flow.project.parsed.project.name, flow.project.parsed.project.version, flow.target);

    if(flow.target_cpp) {
        native.run(flow);
    } else if(flow.target_js) {
        web.run(flow);
    }

} //run

exports.verify = function verify(flow, done) {

    if(flow.target) {
        done(null,null);
    } else {
        done(true,null);
    }

} //verify

exports.error = function(flow, err) {

    if(err && err.length > 0) {
        flow.log(1, 'run / error %s', err);
    }

} //error