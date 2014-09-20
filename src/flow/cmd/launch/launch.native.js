var  cmd = require('../../util/process')
   , path = require('path')
   , fs = require('graceful-fs')

var internal = {};

exports.launch = function(flow) {

    var launch_wait = flow.config.build.launch_wait;
    var flag_launch_wait = flow.flags['launch-wait'];

    if(flag_launch_wait !== undefined) {
        launch_wait = parseFloat(flag_launch_wait);
    }

    if(launch_wait) {

        flow.log(2, 'launch waiting %ds', launch_wait);

        setTimeout(function(){
            internal.launch(flow);
        }, launch_wait*1000);

    } else {

        internal.launch(flow);

    }


} //launch

internal.launch = function(flow) {

    if(flow.target_desktop) {

        var abs_binary = path.resolve(flow.project.root, flow.project.paths.binary.full);
        var abs_outpath = path.resolve(flow.project.root, flow.project.paths.output);

        cmd.exec(flow, abs_binary, [], { cwd: abs_outpath });

    } else if(flow.target_mobile) {

        switch(flow.target) {
            case 'android':
                internal.android_launch_init(flow);

                internal.install_android(flow, function(code) {
                    if(!code) {
                        internal.launch_android(flow);
                    } else {
                        flow.log(1, 'launch - stopping due to failure in install step');
                    }
                });

            case 'ios':
                internal.launch_ios(flow);
        }

    } //target mobile

} //launch

internal.android_launch_init = function(flow) {

    var project = flow.project.prepared.source.project;

        //work out where adb should be
    internal.adb_path = path.join(flow.config.build.android.sdk,'platform-tools/adb');
        //find out if this is a signed or unsigned store build
    internal.build_type = project.app.mobile.android.build_type;
        //work out the name of the apk
    internal.apk_name = project.app.name + '-' + internal.build_type + '.apk';
        //work out the apk location
    internal.abs_outpath = path.resolve(flow.project.root, flow.project.paths.output);

} //android_launch_init

internal.launch_android = function(flow) {

    var project = flow.project.prepared.source.project;

    if(flow.flags.launch !== false) {

        flow.log(2, 'launch - starting app on device');

        var activity = project.app.package + '/' + project.app.package + '.' + flow.config.build.android.activity_name;
        var adb_args_run = [ "shell", "am", "start", "-a", "android.intent.action.MAIN", "-n", activity ];

        flow.log(2, 'launch - running adb %s', adb_args_run.join(' '));

            //start
        cmd.exec(flow, internal.adb_path, adb_args_run, { cwd: internal.abs_outpath });
            //logcat immediately
        internal.launch_android_logcat(flow, internal.adb_path, internal.abs_outpath);

    } else {//--no-launch

        flow.log(2, 'launch - not launching app due to --no-launch');

    }

} //launch_android

internal.install_android = function(flow, done) {

    if(flow.flags.install !== false) {

        flow.log(2, 'launch - installing apk to device ...');

        var adb_args = ["install", "-r", internal.apk_name];

        flow.log(2, 'launch - adb will run in', internal.abs_outpath);
        flow.log(2, 'launch - adb %s', adb_args.join(' '));

        cmd.exec(flow, internal.adb_path, adb_args, { cwd: internal.abs_outpath }, function(code,out,err){

            flow.log(2, 'launch - installed');
            if(done) {
                done(code, out, err);
            }

        }); //exec adb install -r

    } else {

        flow.log(2, 'launch - not installing apk to device due to --no-install');

        if(done) {
            done();
        }

    }

} //launch_android

internal.launch_android_logcat = function(flow) {

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

    flow.log(2, 'launch - starting logcat %s', adb_args.join(' '));

    cmd.exec(flow, internal.adb_path, adb_args_clear, { cwd: internal.abs_outpath }, function(code,out,err){
        cmd.exec(flow, internal.adb_path, adb_args, { cwd: internal.abs_outpath });
    });

} //launch_android_logcat

internal.launch_ios = function(flow) {

        //open the xcode project path
    var ios_project_path = path.resolve( flow.project.root, flow.config.build.ios.project );
    var ios_project_file = path.join( ios_project_path, flow.project.prepared.source.project.app.name + '.xcodeproj' );

    if(fs.existsSync(ios_project_file)) {
        cmd.exec(flow, 'open', [ios_project_file]);
    } else {
        flow.log(1, 'seems the project is not located at expected location %s, can\'t focus it?', ios_project_file);
    }

}