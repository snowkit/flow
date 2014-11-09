var   util = require('../../util/util')
    , path = require('path')
    , fs = require('graceful-fs')
    , cmds = require('../')

var internal = {};


exports.run = function run(flow, data) {

        //if displaying the value
    if(internal.display) {

        if(!flow.flags.json) {

            if(!internal.list) {
                console.log('\n%s = %s\n', internal.leaf, internal.node);
            } else {
                console.log('\n%s = %s\n', internal.leaf, JSON.stringify(internal.node, null, '   ') );
            }

        } else {

            var res = {};

                res[internal.leaf] = internal.node;

            console.log(JSON.stringify(res));

        }

    } else {

            //not displaying the value,
            //means setting it
        if(!flow.user_config) {
            flow.user_config = { config:flow.version };
        }

            //set it using the leaf value helper
        util.set_property(flow, flow.user_config, internal.leaf, internal.value);
            //then save it
        flow.save_user_config();

        flow.log(2, 'config - saved `%s` as `%s`', internal.leaf, internal.value);

    }

} //run


exports.verify = function verify(flow, done) {

        //make sure the project is initialized,
        //as the config can be set from project + dependencies
    flow.project.do_prepare(flow);

    internal.leaf = flow.flags._next('config');
    internal.list = flow.flags.list;
    var err;

    if(internal.leaf) {

        internal.display = false;
        var leaf_index = flow.flags._index(internal.leaf);
        var _value = flow.flags._at(leaf_index+1);

        if(_value == undefined) {
            internal.display = true;
        } else {
            internal.value = _value;
        }

            //try and locate the node in the config object
        var node = util.find_property(flow, flow.config, internal.leaf);

            //no config node?
        if(node === undefined) {
            return done('config node is not found at `' + internal.leaf + '`',null);
        }

            //check if this is a node *object*,
            //without list this is an invalid state
        var is_object = node.constructor == Object;
        if(!internal.list) {
            if(is_object) {
                return done('config node `' + internal.leaf + '` is a leaf node, not a leaf value. use --list to see what values this leaf contains.', null);
            }
        } else {
            if(!is_object) {
                return done('config node `' + internal.leaf + '` is a leaf value, but --list was specified. To print a value of a leaf node, omit the --list flag', null);
            }
        }

            //check if the value is perhaps
            //an object, this is also an invalid state

        if(internal.value) {

            var is_value_object = String(internal.value).indexOf('{') != -1;
                is_value_object = is_value_object || String(internal.value).indexOf('}') != -1;

            if(is_value_object) {
                return done('cannot set a leaf value to an object, should be a primitive value type');
            }

        }

        internal.node = node;

    } else { //leaf

        err = ': requires arguments, see `flow usage config` for details';

    }

    done(err, null);

} //verify

exports.error = function(flow, err) {

    if(err && err.length > 0) {
        flow.log(1, 'config / error %s\n', err);
    }

} //error

