
var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')
    , fs = require('graceful-fs')

exports.convert = function(flow, icon, done) {

    var project = flow.project.prepared.source.project;

    var project_folder = path.join(flow.project.paths.build, flow.project.paths.ios.project, project.app.name);
    var icon_folder = path.join(icon.source, 'ios', 'icon');
    var launch_folder = path.join(icon.source, 'ios', 'launch');

    var xcasset_folder = path.join(project_folder, 'Images.xcassets');
    var icon_output = path.join(xcasset_folder, 'AppIcon.appiconset/' );
    var launch_output = path.join(xcasset_folder, 'LaunchImage.launchimage/');

    flow.log(3, 'icons / copy %s to Images.xcassets in the build folder', icon_folder, icon_output);

    flow.log(2,'icons - ok - copying to output folder');

    if(fs.existsSync(icon_folder)) {
        util.copy_path(flow, icon_folder, icon_output);
    }

    if(fs.existsSync(launch_folder)) {
        util.copy_path(flow, launch_folder, launch_output);
    }

    if(done) {
        done();
    }

} //convert