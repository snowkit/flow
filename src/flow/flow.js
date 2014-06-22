
    var   cmds = require('./cmd')
        , flagger = require('./util/flagger')


//initial parsing and setup

var flow = {
    bin_path : process.argv[0],
    flow_path : process.argv[1],
    run_path : process.argv[2],
    system : process.argv[3],
    version : require('./package.json').version
};

//execute a specific cmd object

        flow.execute = function execute(_flow, cmd) {

            cmd.verify(_flow, function(err, data) {

                if(!err) {
                    cmd.run(_flow, data);
                } else {
                    cmd.error(_flow, err);
                }

            }); //verify

        } //execute

//entry point

    var args = [].concat(process.argv);
    args = args.splice(4, args.length-4);

    flow.flags = flagger.parse(args);

        //first check critical flags
    if(flow.flags._has('version')) {

        console.log(flow.version);

    } else if(flow.flags._has('er')) {

        //http://www.geocities.com/spunk1111/flowers.htm

        console.log("      _ _");
        console.log("    _{ ' }_");
        console.log("   { `.!.` }");
        console.log("   ',_/Y\\_,'");
        console.log("     {_,_}");
        console.log("       |");
        console.log("     (\\|  /)");
        console.log("      \\| //");
        console.log("       |//");
        console.log("jgs \\\\ |/  //");
        console.log("^^^^^^^^^^^^^^^");

    } else {

            //useful information
        console.log('flow / %s', flow.version);
        console.log('flow / current platform is %s', flow.system);

            //get the requested command
        var requested = flow.flags._at(0);
        var command = flow.flags._alias(requested);
            //find the command implementation
        var cmd = cmds[command];

            //check if exists
        if(cmd) {
            flow.execute(flow, cmd);
        } else {
            cmds.usage.run(requested ? 'unknown command ' + requested : '');
        }

    } //non critical flags