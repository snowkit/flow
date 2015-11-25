
/*
drawable-mdpi/     160 dpi (48x48px)
drawable-hdpi/     240 dpi (72x72px)
drawable-xhdpi/    320 dpi (96x96px)
drawable-xxhdpi/   480 dpi (144x144px)
drawable-xxxhdpi/  640 dpi (192x192px)
*/


var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')
    , fs = require('fs-extra')

exports.convert = function(flow, icon, done) {

    var project = flow.project.prepared.source.project;

    var icon_folder = path.join(icon.source, 'android');
    var icon_output = path.join(flow.project.root, flow.project.paths.android.project, 'app','src','main','res');

    if(fs.existsSync(icon_folder)) {

        flow.log(3, 'icons / copy %s to %s', icon_folder, icon_output);

        flow.log(3,'icons - ok - copying to output folder');

        util.copy_path(flow, icon_folder, icon_output);

    } else {

        flow.log(2,'icons - warning - icons node specified but no source file for android at %s', icon_folder);

    }

    if(done) {
        done();
    }

} //convert