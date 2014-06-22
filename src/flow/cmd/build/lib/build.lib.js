
exports.run = function run(flow, data) {

    console.log('flow / building lib %s for %s', flow.flags.lib, flow.target);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
} //verify

exports.error = function(flow, err) {

} //error