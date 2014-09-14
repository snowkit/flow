
var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')
    , fs = require('graceful-fs')

exports.convert = function(flow, icon, done) {

    var project = flow.project.prepared.source.project;

    var project_folder = path.join(flow.project.root, flow.project.paths.ios.project, 'project');
    var icon_folder = path.join(icon.source, 'ios', 'icon');
    var launch_folder = path.join(icon.source, 'ios', 'launch');

    var xcasset_folder = path.join(project_folder, 'Images.xcassets');
    var icon_output = path.join(xcasset_folder, 'AppIcon.appiconset/' );
    var launch_output = path.join(xcasset_folder, 'LaunchImage.launchimage/');

    flow.log(3, 'icons / copy %s and %s to Images.xcassets in the build folder', icon_folder, launch_folder, icon_output);

    if(fs.existsSync(icon_folder)) {
        util.copy_path(flow, icon_folder, icon_output);
        flow.log(3,'icons - ok - copied icons to output folder');
    } else {
        flow.log(2,'icons - cannot find the source icons at %s', icon_folder );
    }

    if(fs.existsSync(launch_folder)) {
        util.copy_path(flow, launch_folder, launch_output);
        flow.log(3,'icons - ok - copied launch to output folder');
    } else {
        flow.log(2,'icons - cannot find the source launch images at %s', launch_folder );
    }

    if(done) {
        done();
    }

} //convert