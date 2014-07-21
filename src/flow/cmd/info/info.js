

exports.run = function run(flow, data) {


    if(flow.flags.hxml) {
        console.log(flow.project.hxml);
    }


} //run

exports.verify = function verify(flow, done) {

    flow.project.do_prepare(flow);

    done(null,null);

} //verify

exports.error = function(flow, err) {

} //error
