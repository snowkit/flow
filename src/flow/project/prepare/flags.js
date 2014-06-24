
    var   defines = require('./defines')
        , util = require('../../util/util')

exports.parse = function parse(flow, project, build_config) {

    var flags = project.flags || [];

            //the default flags set
        if(project.source.build.flags) {
            flags = util.array_union(flags, project.source.build.flags);
        }

            //parse any potentially conditional flags
        if(project.source.build.if) {
            for(conditional in project.source.build.if) {
                var current = project.source.build.if[conditional].flags;
                if(current) {
                    if(defines.satisfy(flow, project, 'if', conditional)){
                        flags = util.array_union(flags, current);
                    }
                }
            }
        }

        if(project.source.build.unless) {
            for(conditional in project.source.build.unless) {
                var current = project.source.build.unless[conditional].flags;
                if(current) {
                    if(defines.satisfy(flow, project, 'unless', conditional)){
                        flags = util.array_union(flags, current);
                    }
                }
            }
        }

    return flags;

} //parse
