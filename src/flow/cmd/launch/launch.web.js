var  cmd = require('../../util/process')
     util = require('../../util/util')
   , path = require('path')

exports.launch = function(flow) {

    var abs_outpath = path.resolve(flow.run_path, flow.project.paths.output);

    var port = flow.flags.port || flow.config.build.web.port;
    var node = flow.bin_path;
    var launch_wait = flow.config.build.launch_wait;
    var url = 'http://localhost:'+port;

        var flag_launch_wait = flow.flags['launch-wait'];
        var flag_url = flow.flags['url'];

        if(flag_launch_wait !== undefined) {
            launch_wait = parseFloat(flag_launch_wait);
        }

        if(flag_url !== undefined) {
            url = flag_url;
        }

    if(flow.flags.launch !== false) {

            flow.log(2, 'launch at %s, after %ds', url, launch_wait);

        setTimeout(function(){

            util.openurl(flow, url);

        }, launch_wait*1000);

    } else {
        flow.log(2, 'launch - web - not opening url because of --no-launch');
    }

    if(flow.flags.server !== false) {

        util.launch_server(flow, port, abs_outpath);

    } else {

        flow.log(2, 'launch - web - not running node-http because of --no-server');

    }

} //launch

