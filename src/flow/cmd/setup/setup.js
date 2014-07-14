

var   haxelib = require('../../util/haxelib')
    , util = require('../../util/util')

exports.run = function run(flow, data) {

    flow.log(2, 'setup - loading setup help');
    flow.log(2, 'press ctrl-c to end this process');

        //setup will launch a local web server to run the setup
    var setup_content = path.join( __dirname, 'setup/');
    var url = 'http://localhost:40404';

    util.launch_server(flow, 40404, setup_content, true);

    setTimeout(function() {

        util.openurl(flow, url);

    }, 300);

} //run

exports.verify = function verify(flow, done) {

    done(null, null);

} //verify

exports.error = function(flow, err) {

    if(err && err.length > 0) {
        flow.log(1, 'setup / error %s\n', err);
    }

} //error