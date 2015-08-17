
var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')
    , fs = require('fs-extra')

exports.convert = function(flow, icon, done) {

    flow.log(3, 'icons / copy %s to favicon.png', icon.source);

    var icon_folder = path.join(icon.source, 'web');
    var icon_source = path.join(icon_folder, icon.dest+'.png');
    var icon_file = 'favicon.png';
    var icon_output = path.join(flow.project.paths.files, icon_file);

    if(fs.existsSync(icon_source)) {

        flow.log(3,'icons - ok - copying to output folder');
        util.copy_path(flow, icon_source, icon_output);

    } else {

        flow.log(2,'icons - warning - icons node specified but no source file for web at %s', icon_source);

    }

    if(done) {
        done();
    }

} //convert