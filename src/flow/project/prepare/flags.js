
    var defines = require('./defines');

exports.parse = function parse(flow, project, build_config) {

    var flags = [];

            //the default flags set
        if(project.source.build.flags) {
            flags = flags.concat(project.source.build.flags);
        }

            //parse any potentially conditional flags
        if(project.source.build.if) {
            for(conditional in project.source.build.if) {
                var current = project.source.build.if[conditional].flags;
                if(current) {
                    if(defines.satisfy(flow, project, 'if', conditional)){
                        flags = flags.concat(current);
                    }
                }
            }
        }

    return flags;

} //parse
