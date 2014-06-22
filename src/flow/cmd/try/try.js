
    var   cmds = require('../')

// > flow try web -options
//   is the same as
// > flow build web -options
// > flow run web -options

exports.run = function run(data, flow) {

    flow.flags._swap('try','build');

    flow.execute(cmds['build'], flow);
    flow.execute(cmds['run'], flow);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function(err, flow) {
    console.log('flow / try / error %s', err);
}