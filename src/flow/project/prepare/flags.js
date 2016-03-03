
    var   defines = require('./defines')
        , util = require('../../util/util')

exports.parse = function parse(flow, prepared) {

    var flags = prepared.flags || [];

            //handle dependencies in order
        for(index in prepared.depends_list) {

            var name = prepared.depends_list[index];
            var depend = prepared.depends[name];

            if(depend.project.project.build.flags) {
                flags = util.array_union(flags, depend.project.project.build.flags);
            }

            for(condition in depend.project.if) {
                var node = depend.project.if[condition];
                if(node.build && node.build.flags) {
                    if(defines.satisfy(flow, prepared, condition)) {
                        flags = util.array_union(flags, node.build.flags);
                    }
                }
            } //each condition

        } //name

            //the project itself
        var parsed = flow.project.parsed;
        if(parsed.project.build.flags) {
            flags = util.array_union(flags, parsed.project.build.flags);
        }

        for(condition in parsed.if) {
            var node = parsed.if[condition];
            if(node.build && node.build.flags) {
                if(defines.satisfy(flow, prepared, condition)) {
                    flags = util.array_union(flags, node.build.flags);
                }
            }
        } //each condition

    return flags;

} //parse
