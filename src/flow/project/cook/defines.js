var   util = require('../../util/util');

var internal = {};

exports.defines = function defines(flow, project, depends, existing) {

        //start with given value
    existing = existing || {};

        //check for the defines flag on the build object
    var list = [];
        //first check the root defines
    if(project.build.defines) {
        for(index in project.build.defines) {
            list.push({ name:project.build.defines[index] });
        }
    }

        //then check for any if: conditional
    if(project.build.if) {
        for(flag in project.build.if) {
            var current = project.build.if[flag].defines;
            if(current) {
                for(index in current) {
                    list.push({ name:current[index], condition:'if', conditional:flag });
                }
            }
        }
    }

        //and unless: conditional
    if(project.build.unless) {
        for(flag in project.build.unless) {
            var current = project.build.unless[flag].defines;
            if(current) {
                for(index in current) {
                    list.push({ name:current[index], condition:'unless', conditional:flag });
                }
            }
        }
    }

        //for each define, parse it
    for(index in list) {

        var define = internal.parse_define(list[index]);

            //only store if not found, to respect child project overrides
        if(!existing[define.name]) {
            existing[define.name] = define;
        }

    } //each in the list

        //parse any dependency tree, if available
    if(depends) {
        for(name in depends) {
            var depend = depends[name];
                //possible for a null project,
                //i.e no flow.json in dependency
            if(depend.project) {
                existing = exports.defines(flow, depend.project, null, existing);
            }
        }
    } //depends

    return existing;

} //defines


    //post parsing strip based on existing defines + known targets
exports.filter = function filter(flow, defines, build_config) {

    console.log('flow / filtering defines against', build_config.known_targets);
    var results = {};

    for(name in defines) {
        var define = defines[name];
        var allow = false;

        if(define.condition) {

            var condition = define.conditional;

            console.log('%s %s', define.condition, condition);
            if(define.condition == 'if') {
                if(defines[condition]) {
                    allow = true;
                }
            } else if(define.condition == 'unless') {
                if(!defines[condition]) {
                    allow = true;
                }
            }

        } else {
            allow = true;
        }

        if(allow) {
            results[name] = util.deep_copy(define);
        }
    }

    return results;

}

internal.satisfy_condition = function(define, cond) {
    
}

internal.parse_define = function(def) {

    var split = def.name.split('=');
    for(item in split) {
        split[item] = split[item].trim();
    }

    var define = {
        name : split[0],
    };

    if(split.length > 1) {
        define.value = split[1];
    }

    if(def.condition) {
        define.condition = def.condition;
        define.conditional = def.conditional;
    }


    return define;

} //parse_define