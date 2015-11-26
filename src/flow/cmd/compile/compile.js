
    var   cmds = require('../')


exports.run = function run(flow, data) {

        //this is so build can use this to check if
        //it should execute launch as well
    flow.action = 'compile';

    flow.execute(flow, cmds['build']);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function(flow, err) {
    flow.log(1, 'run / error %s', err);
}