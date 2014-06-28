

var internal = {};

    //a cached list of conditionals and their tokenized values
exports.conditions = {}

exports.parse = function(flow, prepared, build_config) {

    if(prepared.source.if) {

        for(flag in prepared.source.if) {
            var save = internal.parse_condition(flag);
            if(save && save.err) {
                return save;
            } else {
                exports.conditions[flag] = save;
            }
        }

    } //prepared.if

    return {};

} //parse

internal.token_name = 0;
internal.token_type = 1;

internal.token_types = ['||','&&','!'];

internal.is_token = function(t) {
    return internal.token_types.indexOf(t) != -1;
}

    //return an array of tokenized values in the form of
    // { value:'mac', as:'||', inverse:true/false }
internal.parse_condition = function(cond) {

    //first split the tokens up by space
    var _pre_tokens = cond.split(' ');
    var tokens = [];
    _pre_tokens.map(function(token){
        if(token.indexOf('!') != -1) {
            var pieces = token.split('!');
            tokens.push('!');
            tokens.push(pieces[1].trim());
        } else {
            tokens.push(token.trim());
        }
    });

        //more than one?
    if(tokens.length > 1) {

        var result = [];
        var current = { condition:tokens[0] };

            //since we consume the first name
            //as current, we expect a token next
        var expect = internal.token_type;

        if(internal.is_token(current.condition)) {
            if(current.condition == '!') {
                    //store the name instead
                current.condition = tokens[1];
                    //mark it as inverse
                current.inverse = true;
                    //remove the !
                tokens.shift();
            } else {
                return { err:'at "' +cond+'", expecting a name or "!" and got "' + current.condition + '" instead' };
            } //if !
        } //internal.is_token

            //remove the name as we already have it in current
        tokens.shift();

        var next_inverse = false;

        for(index in tokens) {

            var token = tokens[index];

            if(expect == internal.token_type) {

                if(!internal.is_token(token)) {
                    return { err:'at "' +cond+'", expecting "' + internal.token_types.join('" or "') + '" but got "' + token + '"' };
                } else {
                    current.as = tokens[index];
                    expect = internal.token_name;
                }

            } else if(expect == internal.token_name) {

                if(internal.is_token(token) && token != '!') {
                        //parse error,
                    return { err:'at "' +cond+'", expecting a name but got a token "' + token + '" instead' };

                } else {

                    if(token == '!') {
                        next_inverse = true;
                        continue;
                    } else {
                            //store the one we had
                        result.push(current);
                            //make a new one
                        current = { condition:token, inverse:next_inverse };
                            //expect a token next
                        expect = internal.token_type;
                            //reset flag
                        next_inverse = false;

                    } //token is not

                } //not is token

            } //token name
        } //each tokens

            //store the last one
        result.push(current);

        return result;

    } else {
            //a single token on it's own must be a name, it cannot be a tokentype
        if( internal.token_types.indexOf(tokens[0]) != -1) {
            return { err:'at "'+tokens[0]+'" - a define by itself cannot be a token type, such as ' + internal.token_types.join(', ') };
        } else {
            return [{ condition:tokens[0] }];
        }
    }

}
