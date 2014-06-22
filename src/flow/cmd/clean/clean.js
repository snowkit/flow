

exports.run = function run(flow, data) {
    console.log('flow / doing clean');
} //run

exports.verify = function verify(flow, done) {
    done(null,null);
} //verify

exports.error = function(flow, err) {

} //error