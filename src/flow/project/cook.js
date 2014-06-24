var   path = require('path')
    , haxelib = require('../util/haxelib')
    , util = require('../util/util')
    , projects = require('./project')

    , depends = require('./cook/depends')
    , defines = require('./cook/defines')
    , flags = require('./cook/flags')

var internal = {};

    //convert a parsed project into a fully parsed project,
    //complete with per target flags, values and so on
exports.cook = function cook(flow, project, build_config) {

    flow.project.depends = flow.project.depends || {};

    console.log('\nflow / cooking project %s', project.name );

        //dependencies are a special case as they affect everything, they
        //come first and are required to be complete before anything else
    var _depends = internal.cook_dependencies(flow, project, build_config);

        //get out early if missing any dependency
    if(_depends == null) {
        return null;
    }

        //start at the project base
    var cooked = {
        source : util.deep_copy(project),
        depends : _depends,
        defines_all : {}
    }

        //after dependencies, we process the defines as the rest will depend on them
        //and error out if there are any parsing or other errors in there.
    if(!internal.cook_defines(flow, cooked, build_config)) {
        return null;
    }

        //continued parsing on the build object, the haxe/build flags
    internal.cook_flags(flow, cooked, build_config);

        //return the cooked project
    return cooked;

} //cook



    //internal handlers


internal.cook_dependencies = function(flow, project, build_config) {

    console.log('flow / building dependency tree');

    var _depends = depends.parse(flow, project);

    console.log('flow / done building tree... \n');

    if(Object.size(_depends.failed)) {

        console.log('flow / cook failed due to missing dependencies!');
        console.log('flow / you will probably need to use haxelib to correct this.\n');

        for(name in _depends.failed) {
            var depend = _depends.failed[name];
            console.log('> %s %s', depend.name, depend.version);
        }

        return null;

    } //depends.failed has size

    return _depends.found;

} //cook_dependencies



internal.cook_defines = function(flow, cooked, build_config) {

    console.log('flow / cooking defines \n');

        //store the list of targets as met or unmet defines based on the target
        //we are attempting to cook for
    for(index in build_config.known_targets) {
        var name = build_config.known_targets[index];
        cooked.defines_all[name] = { name:name, met:flow.target == name };
    }


        //now we parse all project defines from the project
    cooked.defines_all = defines.parse(flow, cooked.source, cooked.depends, build_config, cooked.defines_all);
        //and the final list is filtered against the defines themselves, and the known targets
    cooked.defines = defines.filter(flow, cooked.defines_all, build_config);


    if(cooked.defines.err) {
        console.log('flow / defines failed to parse. aborting build : \n');
        console.log('> %s \n',cooked.defines.err);
        return null;
    }

    console.log('flow / defines parsed as \n')
    // console.log(cooked.defines_all);
    console.log(cooked.defines);
    console.log('');

    console.log('flow / done defines ... \n');

    return cooked;

} //cook_defines


internal.cook_flags = function(flow, cooked, build_config) {

    console.log('flow / cooking flags \n');

    cooked.flags = flags.parse(flow, cooked, build_config);

    console.log(cooked.flags);
    console.log('flow / done flags ... \n');

} //cook_flags
