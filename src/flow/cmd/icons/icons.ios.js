
var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')

exports.convert = function(flow, icon, done) {

    var project = flow.project.prepared.source.project;

    var icon_folder = path.join(icon.source, 'ios');
    var icon_output = path.join(flow.project.paths.build, flow.project.paths.ios.project, project.app.name, 'Images.xcassets', 'AppIcon.appiconset/' );

    flow.log(2, 'icons / copy %s to favicon.png', icon_folder, icon_output);

    flow.log(2,'icons - ok - copying to output folder');

    util.copy_path(flow, icon_folder, icon_output);

    if(done) {
        done();
    }

} //convert