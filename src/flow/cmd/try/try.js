
    var   cmds = require('../')

// > flow try web -options
//   is the same as
// > flow build web -options
// > flow run web -options

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