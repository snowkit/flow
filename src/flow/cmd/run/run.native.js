var  cmd = require('../../util/process')
   , path = require('path')

exports.run = function(flow) {

    var abs_binary = path.resolve(flow.run_path, flow.project.path_binary);
    var abs_outpath = path.resolve(flow.run_path, flow.project.path_output);

    cmd.exec(abs_binary, [], { cwd: abs_outpath });

} //run