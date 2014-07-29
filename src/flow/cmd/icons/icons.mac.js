
var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')

exports.convert = function(flow, icon, done) {

    flow.log(2, 'icons / convert %s to %s.icns', icon.source, icon.dest);

    //run iconutil -c icns <source>/mac/<dest>.iconset/
    //for docs on this https://developer.apple.com/library/mac/documentation/GraphicsAnimation/Conceptual/HighResolutionOSX/Optimizing/Optimizing.html

    var icon_folder = path.join(icon.source, 'mac');
    var icon_set = path.join(icon_folder, icon.dest+'.iconset');
    var icon_file = icon.dest+'.icns';
    var icon_output = path.join(flow.project.paths.files,icon_file);

    flow.log(2, 'icons - converting from %s', icon_set);

    cmd.exec(flow, 'iconutil', ['-c', 'icns', icon_set], { cwd:flow.project.root }, function(code, out, err){

        if(!code) {

            flow.log(2,'icons - ok - copying to output folder');
            util.copy_path(flow, path.join(icon_folder,icon_file), icon_output);

        } else {
            flow.log(2,'icons - failed - see log above');
        }

        if(done) {
            done();
        }

    });

} //