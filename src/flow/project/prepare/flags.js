
    var   defines = require('./defines')
        , util = require('../../util/util')

exports.parse = function parse(flow, prepared) {

    var flags = prepared.flags || [];

            //the default flags set
        if(prepared.source.project.build.flags) {
            flags = util.array_union(flags, prepared.source.project.build.flags);
        }

        for(condition in prepared.source.if) {
            var node = prepared.source.if[condition];
            if(node.build && node.build.flags) {
                if(defines.satisfy(flow, prepared, condition)) {
                    flags = util.array_union(flags, node.build.flags);
                }
            }
        }

    return flags;

} //parse
