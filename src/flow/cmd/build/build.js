
    var   cmds = require('../')
        , builder = require('./builder')
        , hooks = require('../hooks/hooks')

var internal = {};

//Build step


    exports.run = function run(flow, opt) {

        internal.flow = flow;

        if(flow.target_arch === null) {
            flow.log(1, 'unknown target arch, invalid state! can\'t build. stopping.');
            flow.project.failed = true;
            return flow.finished();
        }

            //set the project values
        flow.project.parsed = opt.project.parsed;
        flow.project.root = path.dirname(opt.project.path);
        flow.project.path = opt.project.path;
        flow.project.file = opt.project.file;

        flow.project.ensure_path(flow);

        flow.log(2,'build - %s %s for %s',
            flow.project.parsed.project.name, flow.project.parsed.project.version, flow.target);

            //to build a project we need to prepare it first
        flow.project.prepare(flow);

        if(!flow.project.prepared) {
            flow.log(1, 'build - failed at `prepare`\n');
            flow.project.failed = true;
            return flow.finished();
        }

            //if building a library we defer this to it's own commmand
        if(flow.project.parsed.project.lib) {

            flow.execute(flow, cmds['_build_lib']);

        } else {

                //the we bake it into a buildable form
            flow.project.bake(flow);

            if(!flow.project.baked) {
                flow.log(1, 'build - failed at `bake`\n');
                flow.project.failed = true;
                return flow.finished();
            }

                //run the pre build hooks if any
            hooks.run_hooks(flow, 'pre', internal.step_one);

        } //!lib

    }; //run

    internal.step_one = function(err) {

        var flow = internal.flow;

        if(!err) {

                //run the actual build
            builder.run(flow, internal.step_two);

        } else { //!err

            return flow.finished();

        } //err

    } //step_one

    internal.step_two = function(err) {

        var flow = internal.flow;

        flow.log(2,'build - done');

        if(!err) {
                //first execute any post build hooks
            hooks.run_hooks(flow, 'post', internal.final_step);

        } else { //!err

            return flow.finished();

        }

    } //step_two

    internal.final_step = function(err) {

        var flow = internal.flow;
        if(!err) {

            //if build + run was asked
            if(flow.action == 'run') {
                flow.execute(flow, cmds['launch']);
            } else {
                return flow.finished();
            }

        } else { //err

            return flow.finished();

        }

    } //final_step


//Verification step


    exports.verify = function verify(flow, done) {

        var result = {};
        var target = flow.target;

                //if no project given, it will look for one
        var _current_project = flow.flags.project;
        var _current_project_root = flow.flags['project-root'];
        var project = flow.project.verify(flow, _current_project, _current_project_root);

            //if no valid project was found
        if(!project.parsed) {
            return done( internal._error_project(flow, project.reason), null );
        }

        result.target = target;
        result.project = project;

        if(target && target.charAt(0) != '-') {

                //check that this is a valid target for our system
            var invalid = flow.config.build.invalid_targets[flow.system];

                //if not, invalidate
            if(invalid.indexOf(target) != -1) {
                return done( internal._error_invalid(flow, target), null );
            }

            return done(null, result);

        } //target && target[0] != -

        done(null, result);

    }; //verify



//Error handlers


    exports.error = function error(flow, err) {

        flow.log(1, 'build command error');

        if(err && err.length > 0) {
            flow.log(1,'%s\n', err);
        }

    }; //error

//Internal helpers

    internal._error_project = function(flow, reason){

        if(reason && reason.length > 0) {
            return 'project file error \n\n > ' + reason;
        } else {
            return 'unknown project error';
        }

    } //_error_project

    internal._error_invalid = function(flow, target){

        var err = 'invalid target `'+target+'` for system `'+flow.system+'` \n\n';

        return err;

    } //_error_invalid

