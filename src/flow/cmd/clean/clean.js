
exports.run = function run(flow, data) {

    console.log('flow / doing clean of %s ... ', flow.project.build_path(flow, flow.project.prepared) );

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
} //verify

exports.error = function(flow, err) {

} //error