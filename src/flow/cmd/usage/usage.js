
var   fs = require('graceful-fs')
    , path = require('path')
    , cmds = require('../')
    , util = require('../../util/util')

var internal = {};

exports.run = function run(flow, err) {

    if(err && err.length > 0) {
        console.error('\n> Error');
        console.error('> %s', err);
    }

    var intro = fs.readFileSync(path.join(flow.flow_path, 'cmd/usage/intro.md'),'utf8');
    var specific = flow.flags._next('usage');

    console.log('\nflow / %s', flow.version);

    var commands = [];

    for(cmd in cmds) {
        if(cmd.charAt(0) != '_') {
            commands.push(cmd);
        }
    }

    if(specific) {

        console.log('');

        if(commands.indexOf(specific) == -1) {
            console.log('no command `%s`', specific);
            console.log('command list : \n%s%s\n', util.pad(4, '', ' '), commands.join(', '));
            return;
        }

        internal.print_cmd(flow, specific);

    } else {

        console.log(intro);
        console.log('command list : \n%s%s\n', util.pad(4, '', ' '), commands.join(', '));
        internal.print_cmd(flow, 'usage');

    }

    console.log('');

}

internal.print_cmd = function(flow, cmd) {

    var str = 'no usage info listed. try running the command?';
    var cmd_path = path.resolve(flow.flow_path, path.join('cmd',cmd));
    var usage_path = path.join(cmd_path, 'usage.md');

    if(fs.existsSync(usage_path)) {
        str = fs.readFileSync(usage_path,'utf8');
    }

    console.log('%s', str);

}

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function error(flow, err) {

}