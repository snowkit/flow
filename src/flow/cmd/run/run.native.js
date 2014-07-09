var  cmd = require('../../util/process')
   , path = require('path')

exports.run = function(flow) {

    var abs_binary = path.resolve(flow.run_path, flow.project.paths.binary.full);
    var abs_outpath = path.resolve(flow.run_path, flow.project.paths.output);

    cmd.exec(flow, abs_binary, [], { cwd: abs_outpath });

} //run