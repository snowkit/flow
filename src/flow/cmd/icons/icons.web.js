
var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')

exports.convert = function(flow, icon, done) {

    flow.log(2, 'icons / copy %s to favicon.png', icon.source);

    var icon_folder = path.join(icon.source, 'web');
    var icon_source = path.join(icon_folder, icon.dest+'.png');
    var icon_file = 'favicon.png';
    var icon_output = path.join(flow.project.paths.files, icon_file);

    flow.log(2,'icons - ok - copying to output folder');
    util.copy_path(flow, icon_source, icon_output);

    if(done) {
        done();
    }

} //convert