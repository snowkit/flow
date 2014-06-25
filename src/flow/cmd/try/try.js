
    var   cmds = require('../')

// > flow try target --options
//   is the same as
// > flow build target --options
// > flow run target --options

exports.run = function run(flow, data) {

        //this is so build can use this to check if
        //it should execute run as well
    flow.action = 'try';

    flow.execute(flow, cmds['build']);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function(flow, err) {
    flow.log(1, 'try / error %s', err);
}