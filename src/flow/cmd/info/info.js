
internal = {}

exports.run = function run(flow, data) {


    if(flow.flags.hxml) {
        console.log(flow.project.hxml);
        return;
    }

    if(flow.flags.project_prepared) {
        console.log( JSON.stringify(flow.project.prepared.source, null, '  ') );
        return;
    }

    var result = {
        hxml : internal.escape_json(flow.project.hxml),
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


internal.escape_json = function(str) {
   return str
        .replace(/[\"]/g, '\\\"')
        .replace(/[\n]/g, '\\n')
        .replace(/[\t]/g, '\\t')
}