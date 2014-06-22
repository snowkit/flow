
//helpers for simple process use

var   exec = require('child_process').exec
    , fs = require('fs');

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

        //adapted from http://strongloop.com/strongblog/whats-new-in-node-js-v0-12-execsync-a-synchronous-api-for-child-processes/
        //while waiting for 0.12 node releases
    exports.execsync = function execsync(cmd) {
            // Run the command in a subshell
        exec(cmd + ' 2>&1 1>output && echo done! > done');

            // Block the event loop until the command has executed.
        while (!fs.existsSync('done')) {}

            // Read the output
        var output = fs.readFileSync('output',{encoding:'utf8'});

            // Delete temporary files.
        try { fs.unlinkSync('output'); } catch(e) {}
        try { fs.unlinkSync('done'); } catch(e) {}

        return output;

    } //execsync