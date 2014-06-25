
    var   cmds = require('./cmd')
        , flagger = require('./util/flagger')
        , project = require('./project/project')
        , haxelib = require('./util/haxelib')


//initial setup

var internal = {};
var flow = {
    bin_path : process.argv[0],
    flow_path : process.argv[1],
    run_path : process.argv[2],
    system : process.argv[3],
    quiet : {},
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
    }
};

//main command processing, called after haxelib
//async init to query paths and config

internal.run = function() {

    //store old path because we will go back
    var cwd = process.cwd();

        //builds happen in the working path
    console.log('flow / running in %s', flow.run_path);
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

    //first check critical flags
    if(flow.flags._has('version')) {

        console.log(flow.version);

    } else if(flow.flags._has('er')) {

        require('./util/er').er();

    } else {

            //start with initing the project state values
        flow.project.init(flow);

            //useful immediate information
        console.log('flow / %s', flow.version);
        console.log('flow / current platform is %s', flow.system);
        console.log('flow / target is %s', flow.target);

        if(flow.target != 'web'){
            console.log('flow / target arch is %s', flow.target_arch);
        }

            //init haxelib cache,
            //and when it's complete,
            //run the main path
        haxelib.init(internal.run);

    } //non critical flags

