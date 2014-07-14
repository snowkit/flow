var   fs = require('graceful-fs')
    , path = require('path')
    , archiver = require('archiver')
    , prettysize = require('prettysize')
 
var internal = {
    valid_formats : ['zip', 'tar'],
    extensions : { zip:'zip', tar:'tar.gz' }
};

exports.run = function run(flow, data) {

    flow.log(2, 'package - packaging %s', flow.project.paths.output);

    var rel_path = flow.project.paths.output;
    var abs_path = path.resolve(flow.project.root, flow.project.paths.output);

    if(!fs.existsSync(abs_path)) {
        return flow.log(1, 'package - nothing to package, target %s has not been built (i.e output path is not found at %s)', flow.target, flow.project.paths.output);
    }

    var extension = internal.extensions[internal.format];

    var outfile = path.join(flow.project.parsed.project.app.output, flow.target + '.package');
        outfile = flow.flags['archive-name'] || outfile;

    var out_file = outfile + '.' + extension;
    var abs_out_file = path.resolve(flow.project.root, out_file);

    var dest_sub_folder = flow.flags['archive-root'] || '';

    if(dest_sub_folder) {
        flow.log(2, 'package - appending sub folder %s', dest_sub_folder);
    }

    var output = fs.createWriteStream(abs_out_file);
    var archive = archiver( internal.format );

    output.on('close', function() {
      flow.log( 2, 'package - output is %s at %s', prettysize(archive.pointer()), out_file );
      flow.log( 2, 'package - done');
    });

    archive.on('error', function(err) {
      flow.log(1, 'package - error', err);
      throw err;
    });

    archive.pipe(output);

    archive.bulk([
      {
          expand: true,
          cwd: abs_path,
          dest : dest_sub_folder,
          src: ['**']
      }
    ]);

    archive.finalize();

} //run

exports.verify = function verify(flow, done) {

    flow.project.do_prepare(flow);

    internal.format = flow.flags.archive || 'zip';

    if(internal.valid_formats.indexOf(internal.format) == -1) {
        return done('unknown format for package, valid formats are ' + internal.valid_formats.join(', '), null);
    }

    done(null,null);

} //verify

exports.error = function(flow, err) {

  flow.log(1, 'package / error %s', err);

} //error