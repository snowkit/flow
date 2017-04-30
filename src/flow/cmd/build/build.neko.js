    var   fs = require('graceful-fs')
        , path = require('path')
        , cmd = require('../../util/process')

exports.post_build = function(flow, done) {

    //convert neko.n to binary name
    var abs_binary = path.resolve(flow.project.root, flow.project.paths.binary.full);
    var abs_outpath = path.resolve(flow.project.root, flow.project.paths.output);

    cmd.exec(flow, 'nekotools', ['boot',abs_binary+'.n'], { cwd: abs_outpath }, function(out,err){
        done();
    });

}

exports.post_haxe = function(flow, done) {
    done();
}
