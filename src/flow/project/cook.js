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
    }

        //now we parse all project defines from the project
    cooked.defines_all = cook_defines.defines(flow, cooked.source, depends);
        //and the final list is filtered against the defines themselves, and the known targets
    cooked.defines = cook_defines.filter(flow, cooked.defines_all, build_config);

    console.log(cooked.defines);

        //return it
    return cooked;

} //cook



//internal handlers

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
