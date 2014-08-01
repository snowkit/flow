
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
        flow.log(2, 'hooks - stage %s has no hooks', stage);
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
    internal.run_hook(flow, stage, hookitem.name, hookitem.hook, function(code, out, err) {

            //if it's failed and requires success, stop entirely
        if(code != 0 && hookitem.hook.require_success) {

            done({ code:code, out:out, err:err, source:hookitem.hook });
            return;

        } else {

            if(code) {
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

internal.run_hook = function(flow, stage, _name, hook, done) {

    var hook_file = path.join(hook.__path, hook.script);

    flow.log(2, 'hooks - running hook from %s in %s', _name, hook.__path);
    flow.log(2, 'hooks -     running %s hook %s from %s', stage, hook.name, hook.script);
    flow.log(3, 'hooks -     desc : %s', hook.desc || 'no description');

    cmd.exec(flow, flow.bin_path, [hook.script], { cwd:hook.__path }, function(code, our, err){

        flow.log(2, 'hooks -     %s completed with code %d, %s', stage, code, hook.script);

        if(code != 0 && hook.require_success) {
            flow.project.failed = true;
        }

        if(done) {
            done(code, null);
        }

    }); //exec

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

    flow.log(1, 'hooks command error');

    if(err && err.length > 0) {
        flow.log(1,'%s\n', err);
    }

} //error
