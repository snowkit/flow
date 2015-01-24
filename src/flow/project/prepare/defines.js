var   util = require('../../util/util')
    , conditions = require('./conditions')


var internal = {};
    internal._unknown = -1;


exports.parse = function parse(flow, source, depends, existing) {

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
                    list.push({
                        name:node.defines[index],
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
                //i.e no *.flow in dependency
            if(depend.project) {
                existing = exports.parse(flow, depend.project, null, existing);
            }
        }
    } //depends

    return existing;

} //defines


    //post parsing strip based on existing defines + known targets
exports.filter = function filter(flow, defines) {

    var results = {};

    internal.resolve_defines(flow, defines);

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

    return results;

}

    // just satisfy the single condition. this should be called only after
    // the initial conditionals have all been parsed
exports.satisfy = function satisfy(flow, prepared, condition) {

    flow.log(5, 'defines - satisfy check', condition);

    var cond = conditions.conditions[condition];
    if(cond && cond.length > 1) {

        return internal.resolve_multi(flow, prepared.defines_all, cond);

    } else {

        var satisfied = false;
           //check if this is an inverse condition
        var inverse = false;
        if(condition.indexOf('!') != -1) {
            inverse = true;
            condition = condition.replace('!','').trim();
        }

        var defines = prepared.defines_all;
        var define = defines[condition];

        if(define) {
            if(defines[condition].met === true) {
                satisfied = inverse ? false : true;
            } else {
                satisfied = inverse ? true : false;
            }
        } else {
                //not defined, so if the inverse is queried, return true
            if(inverse) satisfied = true;
        }

        flow.log(5, 'defines - single condition satisfy result? %s ', satisfied);

        return satisfied;

    } //multi condition

} //satisfy


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
            flow.log(4, '   conditional unknown yet %s / %s', define.name, condition);
            return -1;
        }

        if(defines[condition].met === true) {
            return inverse ? false : true;
        } else {
            return inverse ? true : false;
        }

    } else {
        if(!inverse) {
            flow.log(4, 'defines - condition against %s failed as its not found at all', condition);
            return false;
        } else {
            flow.log(4, 'defines - condition against %s success, its not defined, but had !condition', condition);
            return true;
        }
    }

} //resolve_single

internal.resolve_multi = function(flow, defines_all, tokenized) {

    //first we check if ALL of the defines in question
        //are unknown, there is nothing we can do yet
    var is_unknown = true;
    for(index in tokenized) {
        var tokened = tokenized[index];
        var define = defines_all[tokened.condition];
        if(define) {
            if(define.met != -1) {
                is_unknown = false;
            }
        } else {
            defines_all[tokened.condition] = { name:tokened.condition, met:false, nonexistant:true };
            is_unknown = false;
        }
    }

        //all of the potential flags in question are unknown, so don't bother
    if(is_unknown) {
        flow.log(2, 'defines - unknown flags for all conditions of ', tokenized);
        return -1;
    }

        //for each step in the condition, we have a final resulting value of true or false
    var state;

    for(index in tokenized) {

            //we only want to do n-1 amount,
            //because we look ahead at the next item.
            //we can assume there will be > 1 because of the check
            //before calling this function
        if(index == tokenized.length-1) {
            continue;
        }

        var i = parseInt(index);
        var tokened = tokenized[i];
        var next = tokenized[i+1];

        var curdef = defines_all[tokened.condition];
        var nextdef = defines_all[next.condition];

            //if both are known, we can build state
        if(curdef.met != -1 && nextdef.met != -1) {

            var curmet = tokened.inverse ? !curdef.met : curdef.met;
            var nextmet = next.inverse ? !nextdef.met : nextdef.met;

            if(state === undefined) {
                state = curmet;
            }

            if(tokened.as == '||') {
                state = state || (curmet || nextmet);
            } else if(tokened.as == '&&') {
                state = state && (curmet && nextmet);
            }

        } else {

                //one of these isn't known yet, if it's an || and one of them is met
                //we can already determine that the condition is met by or logic
            if(tokened.as == '||') {

                if(curdef.met == -1) {
                    var nextmet = next.inverse ? !nextdef.met : nextdef.met;
                    if(nextmet === true) {
                        return true;
                    }
                } else if(nextdef.met == -1) {
                    var curmet = tokened.inverse ? !curdef.met : curdef.met;
                    if(curmet === true) {
                        return true;
                    }
                }

            } //if ||

        } //curdef.met !-1 nextdef.met !-1

    } //each tokenized

    flow.log(5, 'defines - satisfy multi condition state', state);

    return state;

} //resolve_multi

    //walk down the list attempting to satisfy each
    //condition in the list. if a condition is met,
    //it is removed from the working list
internal.resolve_defines = function(flow, defines) {

    var found_unknown = true;
    var max_depth = 20;
    var depth = 0;

    while(found_unknown && (depth<max_depth)) {

            //first do all simple conditions to flatten the
            //amount of unresolved conditionals

        for(name in defines) {
            var define = defines[name];
            if(define.condition) {
                var condition = conditions.conditions[define.condition];
                if(condition && condition.length == 1) {
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
                if(condition && condition.length > 1) {
                    flow.log(5, 'defines - satisfy check', define.condition);
                    define.met = internal.resolve_multi(flow, defines, condition);
                } //condition.as
            }
        } //each define

        var still_unknown = false;
        for(name in defines) {
            if(defines[name].met == -1) {
                flow.log(5, 'defines - unknown found %s', name);
                still_unknown = true;
                break;
            }
        }

        if(!still_unknown) {
            flow.log(5, 'defines - stopping because found no more unknowns');
            found_unknown = false;
        } else {
            flow.log(5, 'defines - still found unknowns');
        }

        depth++;

    } //while found unknowns or reached a max depth

    if(depth >= max_depth) {
        flow.log(5, 'defines - stopping because too many loops in define tree(%d). check for cyclic references in your defines', max_depth);
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