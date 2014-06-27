var   util = require('../../util/util')
    , conditions = require('./conditions')


var internal = {};
    internal._unknown = -1;


exports.parse = function parse(flow, source, depends, build_config, existing) {

        //start with given value if any
    existing = existing || {};

        //check for the defines flag on the build object
    var list = [];
        //first check the root defines
    var node = source.project.build;
    if(node) {
        for(index in node.defines) {
            list.push({
                name:source.project.build.defines[index],
                file:source.__path
            });
        }
    }

        //then check for any if: conditional
    if(source.if) {
        for(flag in source.if) {
            var node = source.if[flag].build;
            if(node && node.defines) {
                for(index in node.defines) {
                    list.push({ name:node.defines[index],
                        condition:flag,
                        file:source.__path
                    });
                }
            } //node && node.defines
        } //flag in if
    } //if source.if

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
                existing = exports.parse(flow, depend.project, null, build_config, existing);
            }
        }
    } //depends

    return existing;

} //defines


    //post parsing strip based on existing defines + known targets
exports.filter = function filter(flow, defines, build_config) {

    var results = {};

    internal.satisfy_conditions(flow, defines);

    console.log(defines);

        //now push a simplified list as the results, only by met type
    for(name in defines) {
        var define = defines[name];
        if(define.met == true) {
            results[name] = { name:define.name };
            if(define.value) {
                results[name].value = define.value
            };
        }
    }

    console.log('');
    console.log(results);

    return results;

}
    //just satisfy the single condition. this should be called only after
    //the initial conditionals have all been parsed
// exports.satisfy = function satisfy(flow, project, condition, conditional) {

//     flow.log(4, 'defines - satisfy check', conditional);

//     var tokenized = conditions.conditions[conditional];
//     if(tokenized) {
//         var met = internal.resolve_multi(project.defines_all, tokenized);
//         return (met === true);
//     } else {
//         return project.defines[conditional] ? true : false;
//     }

// } //satisfy


internal.resolve_single = function(flow, defines, define) {

    var condition = define.condition;
    var inverse = false;

        //if this is an inverse condition
    if(condition.indexOf('!') != -1) {
        inverse = true;
        condition = define.condition.replace('!','').trim();
    }

        //if its even found at all
    if(defines[condition]) {

            //check if the define is known yet
        if(defines[condition].met == -1) {
            flow.log(2, '   conditional unknown yet %s / %s', define.name, condition);
            return -1;
        }

        console.log('condition', condition);
        console.log('inverse', inverse);
        console.log('met', defines[condition].met);

        if(defines[condition].met === true) {
            return inverse ? false : true;
        } else {
            return inverse ? true : false;
        }

    } else {
        flow.log(2, 'defines - condition against %s failed as its not found at all', condition);
        return false;
    }

} //resolve_single

internal.resolve_multi = function(flow, defines_all, tokenized) {

    //for each step in the condition, we have a final resulting value of true or false

        //first we check if ALL of the defines in question
        //are unknown, there is nothing we can do yet
    var is_unknown = true;
    for(index in tokenized) {
        var tokened = tokenized[index];
        var value1 = defines_all[tokened.value];
        var value2 = defines_all[tokened.against];
        if(value1.met != -1 || value2.met != -1) {
            is_unknown = false;
        }
    }

        //all of the potential flags in question are unknown, so don't bother
    if(is_unknown) {
        flow.log(4, 'defines - unknown flags for all conditions of ', tokenized);
        return -1;
    }

        //start at true
    var current;
    for(index in tokenized) {
        var tokened = tokenized[index];
        var value1 = defines_all[tokened.value];
        var value2 = defines_all[tokened.against];

        if(value1.met != -1 && value2.met != -1) {
            if(tokened.as == '||') {
                current = value1.met || value2.met;
            } else if(tokened.as == '&&') {
                current = value1.met && value2.met;
            }
        } else {
            //one of these isn't known yet, if it's an || and one of them is met
            //we can already determine that the condition is met
            if(tokened.as == '||') {
                if(value1.met == -1) {
                    if(value2.met === true) {
                        return true;
                    }
                } else if(value2.met == -1) {
                    if(value1.met === true) {
                        return true;
                    }
                }
            }
        }

    } //each tokenized

    flow.log(4, 'defines - satisfy multi condition current', current);

    return current;

} //resolve_multi

    //walk down the list attempting to satisfy each
    //condition in the list. if a condition is met,
    //it is removed from the working list
internal.satisfy_conditions = function(flow, defines) {

    var found_unknown = true;
    var max_depth = 20;
    var depth = 0;

    while(found_unknown && (depth<max_depth)) {

            //first do all simple conditions to flatten the
            //amount of unresolved conditionals

        for(name in defines) {
            var define = defines[name];
                //only care about conditional
            if(define.condition) {
                var condition = conditions.conditions[define.condition];
                if(condition && condition.as === undefined) {
                    define.met = internal.resolve_single(flow, defines, define);
                } //if condition
            } else {
                if(define.met === undefined || define.met == -1) {
                    define.met = true;
                }
            }
        } //each define

            //then run against all complex conditionals

        for(name in defines) {
            var define = defines[name];
            if(define.condition) {
                var condition = conditions.conditions[define.condition];
                if(condition && condition.as !== undefined) {
                    flow.log(2, 'defines - do complex define %s', name);
                    define.met = internal.resolve_multi(defines, define.tokenized);
                } //condition.as
            }
        } //each define

        var still_unknown = false;
        for(name in defines) {
            if(defines[name].met == -1) {
                flow.log(4, 'defines - unknown found %s', name);
                still_unknown = true;
                break;
            }
        }

        if(!still_unknown) {
            flow.log(4, 'defines - stopping because found no more unknowns');
            found_unknown = false;
        } else {
            flow.log(4, 'defines - still found unknowns');
        }

        depth++;

    } //while found unknowns or reached a max depth

    if(depth >= max_depth) {
        flow.log(4, 'defines - stopping because too many loops in define tree(%d)', max_depth);
    }

} //satisfy conditions

internal.parse_define = function(def) {

    var split = def.name.split('=');
    for(item in split) {
        split[item] = split[item].trim();
    }

    var define = {
        name : split[0],
        file : def.file,
        met : internal._unknown
    };

    if(split.length > 1) {
        define.value = split[1];
    }

    if(def.condition) {
        define.condition = def.condition;
    }


    return define;

} //parse_define