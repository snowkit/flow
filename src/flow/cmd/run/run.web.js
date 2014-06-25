var  cmd = require('../../util/process')
   , path = require('path')

exports.run = function(flow) {

    var abs_outpath = path.resolve(flow.run_path, flow.project.path_output);

    flow.log(2, 'run - will run later, but output is here : %s', abs_outpath);

} //run