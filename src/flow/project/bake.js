
exports.bake = function bake(flow, build_config) {

    var project = flow.project.parsed;

    console.log('flow / baking project %s', project.name);

    flow.project.baked = {};

} //project

    //bakes flags into a usable form
exports.flags = function flags(flow, project, build_config, split) {

    split = split || '\n';

    return project

}