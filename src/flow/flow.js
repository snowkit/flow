
    var   cmds = require('./cmd')
        , flagger = require('./util/flagger')
// Main

var flow = {
    bin_path : process.argv[0],
    flow_path : process.argv[1],
    run_path : process.argv[2],
    system : process.argv[3],
    version : '1.0.0-alpha.1'
};

    var args = [].concat(process.argv);
    args = args.splice(4, args.length-4);

    flow.flags = flagger.parse(args);

        //first check critical flags
    if(flow.flags._has('version')) {

        console.log(flow.version);

    } else {

            //useful information
        console.log('flow / %s', flow.version);
        console.log('flow / current platform is %s', flow.system);

            //get the requested command
        var requested = flow.flags._at(0);
        var cmd = cmds[requested];

            //check if exists
        if(cmd) {

            cmd.verify(flow, function(err,data){

                if(!err) {
                    cmd.run(data, flow);
                } else {
                    cmd.error(err, flow);
                }

            }); //verify

        } else {

            cmds.usage.run('unknown command ' + requested);

        }

    } //non critical flags