
//helpers for simple process use

var   exec = require('child_process').exec
    , fs = require('fs')
    , os = require('os')
    , path = require('path')
    , util = require('./util')

        //run a process with set working directory, and args,
        //returns the results as a string for immediate use (blocking)
    exports.exec = function run(cmd, opt, done) {

        args = args || [];

        console.log('flow / running process %s %s', cmd);

        var _process = exec(cmd, opt, function(err, stdout, stderr){
            if(err) {
                done(err, stderr);
            } else {
                done(null, stdout);
            }
        });

    } //exec

        //adapted from
            //https://github.com/arturadib/shelljs/blob/master/src/exec.js
            //http://strongloop.com/strongblog/whats-new-in-node-js-v0-12-execsync-a-synchronous-api-for-child-processes/
        //while waiting for 0.12 node releases
    exports.execsync = function execsync(cmd) {

        var tmpdir = os.tmpdir(),
            script_file = path.resolve(path.join(tmpdir,util.random_file())),
            stdout_file = path.resolve(path.join(tmpdir,util.random_file())),
            code_file = path.resolve(path.join(tmpdir,util.random_file())),
            sleep_file = path.resolve(path.join(tmpdir,util.random_file())),
            stdout_previous = ''

        function update_stdout() {

            if(!fs.existsSync(stdout_file)) {
                return;
            }

            var stdout_current = fs.readFileSync(stdout_file, 'utf8');
            if (stdout_current.length <= stdout_previous.length) {
                return;
            }

            fs.writeFileSync(stdout_file, stdout_current);
            stdout_previous = stdout_current;

        } //update_stdout

        function escape(str) {
            return (str+'').replace(/([\\"'])/g, "\\$1").replace(/\0/g, "\\0");
        }

        cmd += ' > '+stdout_file+' 2>&1';

        var script =
            "var child = require('child_process')," +
            "     fs = require('fs');" +
            "child.exec('"+escape(cmd)+"', {env: process.env, maxBuffer: 20*1024*1024}, function(err) {" +
            "  fs.writeFileSync('"+escape(code_file)+"', err ? err.code.toString() : '0');" +
        "});";

        if(fs.existsSync(script_file))  fs.unlinkSync(script_file);
        if(fs.existsSync(stdout_file))  fs.unlinkSync(stdout_file);
        if(fs.existsSync(code_file))    fs.unlinkSync(code_file);

        fs.writeFileSync(script_file, script);
        exec('"'+process.execPath+'" '+script_file, {
            maxBuffer: 20*1024*1024
        });

        while (!fs.existsSync(code_file)) { update_stdout(); fs.writeFileSync(sleep_file, 'a'); }
        while (!fs.existsSync(stdout_file)) { update_stdout(); fs.writeFileSync(sleep_file, 'a'); }

        var code = parseInt('', 10);
        while (isNaN(code)) {
            code = parseInt(fs.readFileSync(code_file, 'utf8'), 10);
        }

        var stdout = fs.readFileSync(stdout_file, 'utf8');

        try { fs.unlinkSync(script_file); } catch(e) {}
        try { fs.unlinkSync(stdout_file); } catch(e) {}
        try { fs.unlinkSync(code_file); }   catch(e) {}
        try { fs.unlinkSync(sleep_file); }  catch(e) {}

        return {
            code: code,
            output: stdout
        };

    } //execsync
