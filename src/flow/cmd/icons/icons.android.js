
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

exports.convert = function(flow, icon, done) {

    var project = flow.project.prepared.source.project;

    var icon_folder = path.join(icon.source, 'android');
    var icon_output = path.join(flow.project.paths.build, flow.project.paths.android.project, 'res');

    flow.log(3, 'icons / copy %s to %s', icon_folder, icon_output);

    flow.log(3,'icons - ok - copying to output folder');

    util.copy_path(flow, icon_folder, icon_output);

    if(done) {
        done();
    }

} //convert