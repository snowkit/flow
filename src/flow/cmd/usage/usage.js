
var   fs = require('graceful-fs')
    , path = require('path')
    , cmds = require('../')
    , util = require('../../util/util')

var internal = {
    specials : {}
};

exports.run = function run(flow, err) {

    if(err && err.length > 0) {
        console.error('\n> Error');
        console.error('> %s', err);
    }

    var intro = fs.readFileSync(path.join(flow.flow_path, 'cmd/usage/intro.md'),'utf8');
    var specific = flow.flags._next('usage');

    internal.json = flow.flags.json || false;

    internal.commands = [];
    internal.special = ['targets', 'commands'];

    for(cmd in cmds) {
        if(cmd.charAt(0) != '_') {
            internal.commands.push(cmd);
        }
    }

    if(!internal.json) {
        console.log('\nflow / %s', flow.version);
    }

    if(specific) {

        if(!internal.json) {
            console.log('');
        }

        var is_special = internal.special.indexOf(specific) != -1;

        if(internal.commands.indexOf(specific) == -1 && !is_special) {
            if(!internal.json) {
                console.log('no command `%s`', specific);
                console.log('command list : \n%s%s\n', util.pad(4, '', ' '), internal.commands.join(', '));
            }
            return;
        }

        if(!is_special) {
            internal.print_cmd(flow, specific);
        } else {
            internal.print_special(flow, specific);
        }

    } else {

        if(!internal.json) {
            console.log(intro);
            console.log('command list : \n%s%s\n', util.pad(4, '', ' '), internal.commands.join(', '));
        }

        if(flow.flags._has('usage')) {
            internal.print_cmd(flow, 'usage');
        }

    }

    if(!internal.json) {
        console.log('');
    }

} //run


    //printers

internal.print_cmd = function(flow, cmd) {

    var str = 'no usage info listed. try running the command?';
    var cmd_path = path.resolve(flow.flow_path, path.join('cmd',cmd));
    var usage_path = path.join(cmd_path, 'usage.md');

    if(fs.existsSync(usage_path)) {
        str = fs.readFileSync(usage_path,'utf8');
    }

    console.log('%s', str);

} //print_cmd


internal.print_special = function(flow, special) {

    var str = internal.specials[special](flow);

    console.log('%s', str);

} //print_special


//special implementations


internal.specials.commands = function(flow) {

    var str = '';

    if(!internal.json) {

        str += 'command list : \n';
        str += util.pad(4, '', ' ');
        str += internal.commands.join(', ') + '\n';

    } else {

        str = JSON.stringify(internal.commands);

    }

    return str;

} //commands

internal.specials.targets = function(flow) {

    var str = '';

    if(flow.flags.invalid) {

        if(!internal.json) {
            str += 'flow invalid targets by system\n\n';
            for(system in flow.config.build.invalid_targets) {
                var invalid = flow.config.build.invalid_targets[system];
                str += '  ' + system + '\n    ' + invalid.join(', ') + '\n';
            }
        } else {
            str = JSON.stringify(flow.config.build.invalid_targets);
        }

        return str;
    }

        //:todo:
    if(!internal.json) {
        return 'flow targets: []\n';
    } else {
        return JSON.stringify([]);
    }

} //targets


exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function error(flow, err) {

}