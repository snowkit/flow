var  cmd = require('../../util/process')
   , path = require('path')

var internal = {};

exports.run = function(flow) {

    if(flow.target_desktop) {

        var abs_binary = path.resolve(flow.run_path, flow.project.paths.binary.full);
        var abs_outpath = path.resolve(flow.run_path, flow.project.paths.output);

        cmd.exec(flow, abs_binary, [], { cwd: abs_outpath });

    } else if(flow.target_mobile) {

        switch(flow.target) {
            case 'android':
                internal.run_android(flow);
            case 'ios':
                internal.run_ios(flow);
        }

    }

} //run


internal.run_android = function(flow) {

    flow.log(2, 'run - installing apk to device ...');

    var project = flow.project.prepared.source.project;

        //find out if this is a signed or unsigned store build
    var build_type = project.app.mobile.android.build_type;
        //work out the location of the apk file
    var abs_outpath = path.resolve(flow.run_path, flow.project.paths.output);
        //work out the name of the apk
    var apk_name = project.app.name + '-' + build_type + '.apk';
        //work out where adb should be
    var adb_path = path.join(flow.config.build.android.sdk,'platform-tools/adb');

    var adb_args = ["install", "-r", apk_name];

    flow.log(2, 'run - adb will run in', abs_outpath);
    flow.log(2, 'run - adb %s', adb_args.join(' '));

    cmd.exec(flow, adb_path, adb_args, { cwd: abs_outpath }, function(code,out,err){

        flow.log(2, 'run - installed, starting app on device');

        var activity = project.app.package + '/' + project.app.package + '.' + flow.config.build.android.activity_name;
        var adb_args_run = [ "shell", "am", "start", "-a", "android.intent.action.MAIN", "-n", activity ];

        flow.log(2, 'run - running adb %s', adb_args_run.join(' '));

            //start
        cmd.exec(flow, adb_path, adb_args_run, { cwd: abs_outpath });
            //logcat immediately
        internal.run_android_logcat(flow, adb_path, abs_outpath);

    });

} //run_android

internal.run_android_logcat = function(flow, adb_path, abs_outpath) {

    var logcat_filter = '';

    for(name in flow.config.build.android.logcat_include) {
        var include = flow.config.build.android.logcat_include[name];
        logcat_filter += ' ' + include + ':E';
        logcat_filter += ' ' + include + ':I';
        logcat_filter += ' ' + include + ':V';
    }

    logcat_filter = logcat_filter.trim();

    var adb_args_clear = ["logcat", "-c"];
    var adb_args = ["logcat", "-s"].concat(logcat_filter.split(' '));

    flow.log(2, 'run - starting logcat %s', adb_args.join(' '));

    cmd.exec(flow, adb_path, adb_args_clear, { cwd: abs_outpath }, function(code,out,err){
        cmd.exec(flow, adb_path, adb_args, { cwd: abs_outpath });
    });

} //run_android_logcat

internal.run_ios = function(flow) {

}