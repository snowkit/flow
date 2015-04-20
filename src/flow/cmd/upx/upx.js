    var   cmds = require('../')
        , fs = require('graceful-fs')
        , path = require('path')
        , cmd = require('../../util/process')
        , util = require('../../util/util')

exports.run = function run(flow, data, done) {


    flow.log(2, 'build - running upx...');

    var source_file = flow.project.get_path_binary_dest_full(flow, flow.project.prepared, flow.target_arch);
        source_file = util.normalize(source_file);
    var source_path = flow.project.root;

    var upx_path = util.normalize(path.dirname(flow.bin_path));
    var upx_file = 'upx-' + flow.system;

        if(flow.system == 'linux') {
            upx_file += util.system_arch();
        }
        if(flow.system == 'windows') {
            upx_file += '.exe';
        }

    var upx_bin = util.normalize(path.join(upx_path, upx_file));

    flow.log(3, 'running upx from %s on %s', upx_bin, source_file);

    cmd.exec(flow, upx_bin, ['--best', '--lzma', source_file], { cwd:source_path, quiet:true }, function(code, out, err){

        if(code) {
            flow.log(3, 'upx failed with %d but this is not an error so can continue', code);
            flow.log(3, err);
        } else {
            flow.log(2, out);
        }

        if(done) {
            done();
        }

    });

} //run

exports.verify = function verify(flow, done) {

    var skip = !flow.flags.upx;
        skip = skip || flow.config.build.upx_skip;

    if(skip) {
        done('skipped',null);
        return;
    }

    flow.project.do_prepare(flow);

    done(null,null);

} //verify

exports.error = function(flow, err) {

    if(err && err.length > 0 && err != 'skipped') {
        flow.log(1, 'upx - error', err);
    }

} //error
