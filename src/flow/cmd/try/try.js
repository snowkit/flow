
    var   cmds = require('../')

// > flow try target --options
//   is the same as
// > flow build target --options
// > flow run target --options

exports.run = function run(flow, data) {

    flow.execute(flow, cmds['build']);
    flow.execute(flow, cmds['run']);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function(flow, err) {
    console.log('flow / try / error %s', err);
}