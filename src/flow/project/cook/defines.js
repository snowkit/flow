var   util = require('../../util/util');

var internal = {};

exports.defines = function defines(flow, project, depends, build_config, existing) {

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
                existing = exports.defines(flow, depend.project, null, build_config, existing);
            }
        }
    } //depends

    return existing;

} //defines

internal._unknown = -1;
internal._unmet = false;
internal._met = true;

    //post parsing strip based on existing defines + known targets
exports.filter = function filter(flow, defines, build_config) {

    var results = {};

        //for each define we token any conditionals,
        //and store it's met value as "met_unknown", later becoming either met or unmet

    for(name in defines) {
        var define = defines[name];
        if(define.met === undefined) define.met = internal._unknown;
        if(define.condition) {
            var tokenized = internal.parse_conditional(define.conditional);
            if(tokenized && tokenized.err) {
                return tokenized;
            } else {
                if(tokenized) {
                    define.tokenized = tokenized;
                }
            }
        }
    } //each in define

    internal.satisfy_conditions(defines);

        //now push a simplified list as the results, only by met type
    for(name in defines) {
        var define = defines[name];
        if(define.met == true) {
            results[name] = { name:define.name };
            if(define.value) { results[name].value = define.value };
        }
    }

    return results;

}

internal.token_name = 0;
internal.token_type = 1;

internal.token_types = ['||','&&'];

    //return an array of tokenized values in the form of
    // { value:'mac', against:'ios', as:'||' }
    //the met always starts out as true, because this
    //only parses them, the satisfy will flag them down
internal.parse_conditional = function(cond) {
  //first split the tokens up by space
    var tokens = cond.split(' ');
    tokens.map(function(token){ return token.trim(); });

        //more than one?
    if(tokens.length > 1) {
        var result = [];
        var current = { value:tokens[0], as:'', against:'' };
        var expect = internal.token_type;
        for(index in tokens) {
            if(index > 0) {
                if(expect == internal.token_type) {
                    if(internal.token_types.indexOf(tokens[index]) == -1) {
                            //parse error,
                        return { err:'at "' +cond+'", expecting ' + internal.token_types.join(' or ') + ' but got "' + tokens[index] + '"' };
                    } else {
                        current.as = tokens[index];
                        expect = internal.token_name;
                    }
                } else if(expect == internal.token_name) {
                    if(internal.token_types.indexOf(tokens[index]) != -1) {
                            //parse error,
                        return { err:'at "' +cond+'", expecting a name but got a token "' + tokens[index] + '" instead' };
                    } else {
                        current.against = tokens[index];
                        expect = internal.token_type;
                        result.push(current);
                        current = { value:tokens[index], as:'', against:'' };
                    }
                }
            }
        }

        return result;

    } else {
            //a single token on it's own must be a name, it cannot be a tokentype
        if( internal.token_types.indexOf(tokens[0]) != -1) {
            return { err:'at "'+tokens[0]+'" - a define by itself cannot be a token type, such as ' + internal.token_types.join(', ') };
        } else {
            return;
        }
    }
}

internal.satisfy_single_condition = function(defines, define) {

        //if its even found at all
    if(defines[define.conditional]) {

            //check if the define is known yet
        if(defines[define.conditional].met == -1) {
            // console.log('   conditional unknown yet %s / %s', define.name, define.conditional);
            return -1;
        }

        if(define.condition == 'if') {
            if(defines[define.conditional].met === true) {
                return true;
            } else {
                return false;
            }
        } else if(define.condition == 'unless') {
            if(defines[define.conditional].met === true) {
                return false;
            } else {
                return true;
            }
        }

    } else {
        // console.log('dependency against %s failed as its not found at all', define.conditional);
        return false;
    }
}

internal.satisfy_multi_condition = function(defines, define) {

 //for each step in the condition, we have a final resulting value of true or false
    // console.log('define %s %s', define.name, define.condition, define.conditional)

        //first we check if ALL of the defines in question
        //are unknown, there is nothing we can do yet
    var is_unknown = true;
    for(index in define.tokenized) {
        var tokened = define.tokenized[index];
        var value1 = defines[tokened.value];
        var value2 = defines[tokened.against];
        if(value1.met != -1 || value2.met != -1) {
            is_unknown = false;
        }
    }

        //all of the potential flags in question are unknown, so don't bother
    if(is_unknown) {
        // console.log('unknown flags for all conditions of ', define.tokenized);
        return -1;
    }

        //start at true
    var current;
    for(index in define.tokenized) {
        var tokened = define.tokenized[index];
        var value1 = defines[tokened.value];
        var value2 = defines[tokened.against];

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

    // console.log(current);

    return current;
}

    //walk down the list attempting to satisfy each
    //condition in the list. if a condition is met,
    //it is removed from the working list
internal.satisfy_conditions = function(defines) {

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
                    //simple non multiple conditions
                if(!define.tokenized) {
                    define.met = internal.satisfy_single_condition(defines, define);
                }
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
                if(define.tokenized) {
                    // console.log('do complex define ' + name);
                    define.met = internal.satisfy_multi_condition(defines, define);
                }
            }
        } //each define

        var still_unknown = false;
        for(name in defines) {
            if(defines[name].met == -1) {
                // console.log('unknown found ' + name);
                still_unknown = true;
                break;
            }
        }

        if(!still_unknown) {
            // console.log('stopping because found no more unknowns');
            found_unknown = false;
        } else {
            // console.log('still found unknowns');
        }

        depth++;

    } //while found unknowns or reached a max depth

} //satisfy conditions

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