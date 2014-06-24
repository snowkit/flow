
var   path = require('path')

exports.bake = function bake(flow, build_config) {

    var project = flow.project.prepared;

    console.log('\nflow / bake - project %s\n', flow.project.parsed.name);

    flow.project.hxml = exports.hxml(flow, project, build_config );

    console.log(flow.project.hxml);
    console.log('');

    flow.project.baked = true;

} //project

    //bakes defines into a usable form
exports.defines = function defines(flow, project, build_config, split) {

    split = split || '\n';

    var list = project.defines_list.map(function(a){
        return '-D ' + a;
    });

    return list.join(split) + split;

} //defines

    //bakes flags into a usable form
exports.flags = function flags(flow, project, build_config, split) {

    split = split || '\n';

    return project.flags.join(split) + split;

} //flags


exports.target = function(flow, project, build_config, split) {

    split = split || '\n';

    var values = '-cp ' + flow.project.path_build + 'haxe/';

    switch(flow.target) {

        case 'mac': case 'linux': case 'windows':
        case 'android': case 'ios': {
            values += split + '-cpp ' + flow.project.path_build + 'cpp/';
            break;
        } //native

        case 'web':{
            values += split + '-js ' + flow.project.path_output + project.source.product.app + '.js';
            break;
        } //web

    } //switch

    return values;

} //target

    //bakes the whole project into a usable complete hxml
exports.hxml = function(flow, project, build_config, split) {

    split = split || '\n';

    var hxml_ = '-main ' + flow.config.build.app_boot + split;

    hxml_ += exports.defines(flow, project, build_config, split);
    hxml_ += exports.flags(flow, project, build_config, split);
    hxml_ += exports.target(flow, project, build_config, split);

    return hxml_;

} //hxml