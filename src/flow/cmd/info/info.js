

exports.run = function run(flow, data) {


    if(flow.flags.hxml) {
        console.log(flow.project.hxml);
        return;
    }

    var result = {
        hxml : flow.project.hxml,
        paths : flow.project.paths,
        targets_known : flow.config.build.known_targets,
        targets_invalid : flow.config.build.invalid_targets[flow.system],
    }

    console.log(JSON.stringify(result, null, '  '));

} //run

exports.verify = function verify(flow, done) {

    flow.project.do_prepare(flow);

    done(null,null);

} //verify

exports.error = function(flow, err) {

} //error
