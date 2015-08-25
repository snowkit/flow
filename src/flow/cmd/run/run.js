
    var   cmds = require('../')

// > flow run target --options
//   is the same as
// > flow build target --options
// > flow run target --options

exports.run = function run(flow, data) {

        //this is so build can use this to check if
        //it should execute launch as well
    flow.action = 'run';

    flow.execute(flow, cmds['build']);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function(flow, err) {
    flow.log(1, 'run / error %s', err);
}