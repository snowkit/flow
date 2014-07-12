
    var   cmds = require('./cmd')
        , flagger = require('./util/flagger')
        , project = require('./project/project')
        , haxelib = require('./util/haxelib')
        , util = require('./util/util')


//initial setup

    project.defaults = require('./project.defaults');

var internal = {};
var flow = {
    bin_path : util.normalize(process.argv[0]),
    flow_path : util.normalize(path.dirname(process.argv[1])),
    run_path : util.normalize(process.argv[2]),
    system : util.normalize(process.argv[3]),
    quiet : {},
    log_level : 2,
    project : project,
    version : require('./package.json').version,
    config : require('./config'),
    timing : require('./config').build.timing,
    execute : function(_flow, cmd) {
        cmd.verify(_flow, function(err, data) {

            if(!err) {
                cmd.run(_flow, data);
            } else {
                cmd.error(_flow, err);
            }

        }); //verify
    },
    log : function(level) {
        var args = Array.prototype.slice.call(arguments,1);
        if(level <= this.log_level && this.log_level != 0) {
            if(args[0] && args[0].constructor != Object) {
                args[0] = 'flow / ' + args[0];
            }
            console.log.apply(console, args);
        }
    }
};

//main command processing, called after haxelib
//async init to query paths and config

internal.run = function() {

    //store old path because we will go back
    var cwd = process.cwd();

        //builds happen in the working path
    flow.log('');
    flow.log(2, 'running in %s', flow.run_path);
    process.chdir(flow.run_path);

            //get the requested command
        var requested = flow.flags._at(0);
        var command = flow.flags._alias(requested);
            //find the command implementation
        var cmd = cmds[command];

            //check if exists
        if(cmd) {
            flow.execute(flow, cmd);
        } else {
            cmds.usage.run(flow, requested ? 'unknown command ' + requested : '');
        }

        //restore
    process.chdir(cwd);

} //run


//entry point

    var args = [].concat(process.argv);
    args = args.splice(4, args.length-4);

    flow.flags = flagger.parse(args);

    if(flow.flags.log !== undefined) {
        flow.log_level = flow.flags.log;
    }

    //first check critical flags
    if(!args.length || flow.flags._has('usage')) {

        cmds.usage.run(flow, '');

    } else if((flow.flags._has('version') && args.length < 3) || flow.flags.version && args.length < 3) {

        if(!flow.flags.json) {
            console.log(flow.version);
        } else {
                //this may be redundant but might change in future
            console.log(JSON.stringify(flow.version));
        }

    } else if(flow.flags._has('er') && args.length == 1) {

        require('./util/er').er();

    } else {

            //start with initing the project state values
        if(!flow.project.init(flow)) {
            return;
        }

            //useful immediate information
        flow.log(2, '%s', flow.version);
        flow.log(2, 'current platform is %s', flow.system);
        flow.log(2, 'target is %s', flow.target);

        if(flow.target != 'web'){
            flow.log(2, 'target arch is %s', flow.target_arch);
        }

            //init haxelib cache,
            //and when it's complete,
            //run the main path
        haxelib.init(flow, internal.run);

    } //non critical flags

