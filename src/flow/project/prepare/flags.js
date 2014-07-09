
    var   defines = require('./defines')
        , util = require('../../util/util')

exports.parse = function parse(flow, project, build_config) {

    var flags = project.flags || [];

            //the default flags set
        if(project.source.project.build.flags) {
            flags = util.array_union(flags, project.source.project.build.flags);
        }

            //parse any potentially conditional flags
        if(project.source.project.build.if) {
            for(conditional in project.source.project.build.if) {
                var current = project.source.project.build.if[conditional].flags;
                if(current) {
                    if(defines.satisfy(flow, project, 'if', conditional)){
                        flags = util.array_union(flags, current);
                    }
                }
            }
        }

        if(project.source.project.build.unless) {
            for(conditional in project.source.project.build.unless) {
                var current = project.source.project.build.unless[conditional].flags;
                if(current) {
                    if(defines.satisfy(flow, project, 'unless', conditional)){
                        flags = util.array_union(flags, current);
                    }
                }
            }
        }

    return flags;

} //parse
