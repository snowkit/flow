
var   path = require('path')


exports.bake = function bake(flow, build_config) {

    var project = flow.project.prepared;

    console.log('flow / baking project %s', flow.project.parsed.name);

    flow.project.hxml = exports.hxml(flow, project, build_config );

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

        //:todo: these should be like build_path and buildetc
    var dest_folder = path.normalize(project.source.product.output) + '/';

        //the build output goes into it's own folder
    dest_folder += flow.target;

    if(flow.target_arch == '64') {
        dest_folder += flow.target_arch;
    }

    switch(flow.target) {
        case 'mac':
        case 'linux':
        case 'windows':
        case 'android':
        case 'ios':
        {
            dest_folder += '.build/'
            var _targets = '-cpp ' + dest_folder + 'cpp/';
                _targets += split + '-cp ' + dest_folder + 'haxe/';
            return _targets;
            break; //yes, break too.
        }

        case 'web':{
            var _targets = '-js ' + dest_folder + '/' + project.source.product.app + '.js';
                _targets += split + '-cp ' + dest_folder + '.build/haxe/';
            return _targets;
            break;
        }
    }

}

    //bakes the whole project into a usable complete hxml
exports.hxml = function(flow, project, build_config, split) {

    split = split || '\n';

    var hxml_ = '-main ' + build_config.app_boot + split;

    hxml_ += exports.defines(flow, project, build_config, split);
    hxml_ += exports.flags(flow, project, build_config, split);
    hxml_ += exports.target(flow, project, build_config, split);

    console.log(hxml_);

} //hxml