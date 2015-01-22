
//build hook,
//will execute a seperate node process on
//the project hook nodes in order of their priority,
//followed by their order of inclusion

//example hook in flow file
// pre : {
//     priority : 1,
//     name : 'ios-project-sync',
//     desc : 'checks the ios project project.app flags are synced up',
//     script : 'pre/pre.js',
// }

var   cmd = require('../../util/process')
    , util = require('../../util/util')

var internal = {};

exports.run = function run(flow, data, done) {


    //run through verify, as these can fail

} //run

exports.run_hooks = function(flow, stage, done) {

    var hooks = flow.project.prepared.hooks[stage];
    if(hooks) {
        internal.run_stage(flow, stage, hooks, done);
    } else {
        flow.log(1,'hooks - no stage called', stage);
        if(done) {
            done();
        }
    }

} //hooks

internal.run_stage = function(flow, stage, hooks, done) {

    var list = [];

    for(name in hooks) {

        var hook = hooks[name];
            //use the project name to describe it
        var _name = name;
        if(_name == '__project') {
            _name = flow.project.prepared.source.project.name;
        }

        list.push({name:_name, hook:hook, stage:'pre'});
    }

    if(list.length) {
        internal.run_hook_list(flow, stage, list, done);
    } else {
        flow.log(3, 'hooks - no %s hooks', stage);
        if(done) {
            done();
        }
    }

} //run_pre

internal.run_hook_list = function(flow, stage, list, done) {

        //no more in the list?
        //early out and call the callback
    if(list.length == 0) {
        if(done) {
            done();
        }
        return;
    }

        //copy the list to avoid mangling it
    var _list = list.slice(0);
    var hookitem = _list[0];

        //run a single instance
    internal.run_hook(flow, stage, hookitem.name, hookitem.hook, function(err) {

            //if it's failed and requires success, stop entirely
        if(err && hookitem.hook.require_success) {

            done({ err:err, source:hookitem.hook });
            return;

        } else {

            if(err) {
                flow.log(1, 'hooks - %s failed but was not required to succeed on', stage, hookitem.hook.name, hookitem.hook.script );
            }

                //keep going anyway
                //remove the first item we just used
            _list.shift();
                //run the remaining list
            internal.run_hook_list(flow, stage, _list, done);

        } //

    }); //run_hook

} //run_hook_list


    //work out a special hook specific flow
internal.get_hook_flow = function(flow, stage, _name, hook) {

        // everything must be sent as a copy,
        // as the flow object must remain immutable

    return {
        bin_path        : String(flow.bin_path),
        run_path        : String(flow.run_path),
        system          : String(flow.system),
        version         : String(flow.version),
        config          : util.deep_copy(flow.config),
        flags           : util.deep_copy(flow.flags),
        target          : String(flow.target),
        target_arch     : String(flow.target_arch),
        target_cpp      : Boolean(flow.target_cpp),
        target_js       : Boolean(flow.target_js),
        target_desktop  : Boolean(flow.target_desktop),
        target_mobile   : Boolean(flow.target_mobile),
        project         : util.deep_copy(flow.project.prepared.source),
        log_level       : Number(flow.log_level),
        log : function(){
            var args = Array.prototype.slice.call(arguments,0);
            flow.log.apply(flow,args);
        },

    }
}

internal.run_hook = function(flow, stage, _name, hook, done) {

    var hook_file = path.join(hook.__path, hook.script);

    flow.log(2, 'hooks - running hook from %s in %s', _name, hook.__path);
    flow.log(2, 'hooks -     running %s hook named `%s` from %s', stage, hook.name, hook.script);
    flow.log(3, 'hooks -     desc : %s', hook.desc || 'no description');

    var fail = function(e) {
        if(hook.require_success) {
            flow.project.failed = true;
        }

        flow.log(1, e);

        if(done) {
            done(e);
        }
    } //fail

    var hook_script;

    try {
       hook_script = require(hook_file);
    } catch(e) {
        return fail(e);
    }

    if(hook_script) {

        var hook_flow = internal.get_hook_flow(flow, stage, _name, hook);

        var s = hook_script.hook.toString();
        if(s.indexOf('done()') == -1) {
            return fail('hook script is missing a done(); call. This will stall! fix this before trying again.');
        }

        try {

            hook_script.hook(hook_flow, function(err){
                done(err);
            });

        } catch(e) {
            return fail(e);
        } //try

    } else { //hook_script

        return fail('hook script was not found at ' + hook_file);

    } //if hook_script

} //run_hook

exports.verify = function verify(flow, done) {

    flow.project.do_prepare(flow);

    var pre = flow.flags.pre || false;
    var post = flow.flags.post || false;

    if(pre && post) {
        exports.run_hooks(flow, 'pre', function(err){
            if(!err) {
                exports.run_hooks(flow, 'post', done);
            } else {
                done(err);
            }
        });
        return;
    } else {
        if(pre) {
            exports.run_hooks(flow, 'pre', done);
            return;
        } else if(post) {
            exports.run_hooks(flow, 'post', done);
            return;
        }
    }

        //no pre or post...
    done(null,null);

} //verify

exports.error = function(flow, err) {

    flow.log(1, 'hooks command error', err);

    if(err && err.length > 0) {
        flow.log(1,'%s\n', err);
    }

} //error
