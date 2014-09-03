
var   util = require('../../util/util')
    , cmd = require('../../util/process')
    , path = require('path')
    , bars = require('handlebars')
    , fs = require('graceful-fs')
    , fse = require('fs-extra')

exports.convert = function(flow, icon, done) {

    var icon_folder = util.normalize(path.join(icon.source, 'windows'));
    var icon_file = icon.dest+'.ico';
    var icon_source = util.normalize(path.join(icon_folder, icon_file));
	var cpp_path = path.join(flow.project.paths.build,'cpp');

    flow.log(3, 'icons / converting %s for use', icon.source );

    var icon_xml = path.join(__dirname,'windows','icon.xml');

    	//first copy the ico to the build folder
    util.copy_path(flow, icon_source, path.join(cpp_path, icon_file));
    	//and copy the xml file to include the icon in the exe
    util.copy_path(flow, icon_xml, path.join(cpp_path, '__icon.xml'));
    	//then copy the icon.rc file to the build folder, it needs to be templated to the icon dest name
    var context = { icon : icon.dest };
    var content = fs.readFileSync(path.join(__dirname,'windows/icon.rc'), 'utf8');
    var template = bars.compile(content);
    var rccontent = template(context);

    var rcfilepath = path.join(cpp_path,'icon.rc');

    fse.ensureFileSync(rcfilepath);
    fs.writeFileSync(rcfilepath, rccontent, 'utf8');

    	//:todo: configure/safety
    var vsdir = process.env['VS100COMNTOOLS'] ||
                process.env['VS110COMNTOOLS'] ||
                process.env['VS120COMNTOOLS'];

    var vsvars = path.resolve(vsdir, '../../vc/vcvarsall.bat');

    cmd.exec(flow,'cmd.exe', ['/c', vsvars, '&&', 'rc', '/r', 'icon.rc'], {cwd:cpp_path,quiet:false}, function(code,out,err) {

    	if(!code) {

                //finally, for windows icons, we append a hxcpp include
                //so that it can link against the icon.
            flow.project.prepared.hxcpp.includes['__icon'] = {
                name:'__icon', file:'__icon.xml', path:'__icon.xml',
                source:'flow internal', internal:true
            };

            flow.log(3,'icons - ok - will be embedded in exe at link time');
        } else {
            flow.log(1,'icons - failed - see log above');
        }

        if(done) {
            done();
        }

    });

} //convert