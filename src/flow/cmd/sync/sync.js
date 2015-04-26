
var   util = require('../../util/util')
    , cmds = require('../')
    , watchr = require('watchr')

exports.run = function run(flow, data) {


    var list = flow.project.prepared.files.project_files;

    var watch_paths = [];
    for(i in list) {
        var node = list[i];
        if(!node.not_listed) {
            watch_paths.push(node.source);
        }
    }

    var persist = true;
    if(flow.action == 'run') persist = false;

    var interval = 400;

    if(flow.flags['sync-interval']) interval = flow.flags['sync-interval'];

    flow.log(2, 'sync - watching for project file changes (persist='+persist+')');

    watchr.watch({
        paths: watch_paths,
        persistent: persist,
        interval: interval,
        listeners: {
            error: function(err) {
                flow.log(1, 'sync - error -', err);
            },
            change: function(changeType, filePath, fileCurrentStat, filePreviousStat) {
                flow.log(2, 'sync - syncing files ( triggered by ', changeType, filePath, ')');
                flow.execute(flow, cmds['files']);
            }
        }
    });

} //run

exports.verify = function verify(flow, done) {

    if(!flow.target_desktop && flow.target != 'web') {
        flow.log(1, 'can only run sync with desktop targets!');
        return done('desktop target required', null);
    }

    flow.project.do_prepare(flow);

    done(null, null);

} //verify

exports.error = function(flow, err) {

    if(err && err.length > 0) {
        flow.log(1, 'sync / error %s\n', err);
    }

} //error
