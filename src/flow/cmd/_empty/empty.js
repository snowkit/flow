
// a template for adding new commands
// do not add it to the index.js

exports.run = function run(flow, data) {

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
} //verify

exports.error = function(flow, err) {

} //error

exports.usage = function(flow) {
    return 'usage pending';
}