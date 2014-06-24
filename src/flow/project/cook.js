var   path = require('path')
    , haxelib = require('../util/haxelib')
    , util = require('../util/util')
    , projects = require('./project')

    , cook_depends = require('./cook/depends')
    , cook_defines = require('./cook/defines')

var internal = {};

    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.cook = function cook(flow, project, build_config) {

    flow.project.depends = flow.project.depends || {};

    console.log('\nflow / cooking project %s', project.name );

    var depends = internal.satisfy_dependency(flow, project);

        //get out early if missing any dependency
    if(depends == null) {
        return null;
    }

        //start at the project base
    var cooked = {
        source : util.deep_copy(project),
        depends : depends,
        defines_all : {}
    }

        //after dependencies, we process the defines as the rest will depend on them
    if(!internal.cook_defines(flow, cooked, build_config)) {
            //error out if there were define errors
        return null;
    }

        //return the cooked project
    return cooked;

} //cook



//internal handlers
internal.cook_defines = function(flow, cooked, build_config) {

        //store the list of targets as met or unmet defines based on the target
        //we are attempting to cook for
    for(index in build_config.known_targets) {
        var name = build_config.known_targets[index];
        cooked.defines_all[name] = { name:name, met:flow.target == name };
    }
        //now we parse all project defines from the project
    cooked.defines_all = cook_defines.defines(flow, cooked.source, cooked.depends, build_config, cooked.defines_all);
        //and the final list is filtered against the defines themselves, and the known targets
    cooked.defines = cook_defines.filter(flow, cooked.defines_all, build_config);

    if(cooked.defines.err) {
        console.log('flow / defines failed to parse. aborting build : \n');
        console.log('> %s \n',cooked.defines.err);
        return null;
    }

    console.log('defines parsed as \n')
    console.log(cooked.defines_all);
    console.log(cooked.defines);
    console.log('');

    return cooked;

} //cook_defines

internal.satisfy_dependency = function(flow, project) {

    console.log('flow / building dependency tree');

    var depends = cook_depends.depends(flow, project);

    console.log('flow / done building tree... \n');

    if(Object.size(depends.failed)) {

        console.log('flow / cook failed due to missing dependencies!');
        console.log('flow / you will probably need to use haxelib to correct this.\n');

        for(name in depends.failed) {
            var depend = depends.failed[name];
            console.log('> %s %s', depend.name, depend.version);
        }

        return null;

    } //depends.failed has size

    return depends.found;

} //satisfy_dependency
