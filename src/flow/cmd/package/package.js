var   fs = require('graceful-fs')
    , path = require('path')
    , archiver = require('archiver')
    , prettysize = require('prettysize')
 

exports.run = function run(flow, data) {

    flow.log(2, 'package - packaging %s', flow.project.paths.output);

    var rel_path = flow.project.paths.output;
    var abs_path = path.resolve(flow.project.root, flow.project.paths.output);

    if(!fs.existsSync(abs_path)) {
        return flow.log(1, 'package - nothing to package, target %s has not been built (i.e output path is not found at %s)', flow.target, flow.project.paths.output);
    }

    var rel_out_file = path.join(flow.project.parsed.project.app.output, flow.target + '.bin.zip')
    var abs_out_file = path.resolve(flow.project.root, rel_out_file);

    var output = fs.createWriteStream(abs_out_file);
    var archive = archiver('zip');

    output.on('close', function() {
      flow.log( 2, 'package - output is %s at %s', prettysize(archive.pointer()), rel_out_file );
      flow.log( 2, 'package - done');
    });

    archive.on('error', function(err) {
      flow.log(1, 'package - error', err);
      throw err;
    });

    archive.pipe(output);

    archive.bulk([
      { expand: true, cwd: abs_path, src: ['**'] }
    ]);

    archive.finalize();

} //run

exports.verify = function verify(flow, done) {

    flow.project.do_prepare(flow);

    done(null,null);

} //verify

exports.error = function(flow, err) {

} //error