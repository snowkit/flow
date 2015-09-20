
    var   defines = require('./defines')
        , util = require('../../util/util')

exports.parse = function parse(flow, prepared) {

    var hxmls = prepared.hxmls || [];

            //the default hxmls set
        if(prepared.source.project.build.hxmls) {
            hxmls = util.array_union(hxmls, prepared.source.project.build.hxmls);
        }

        for(condition in prepared.source.if) {
            var node = prepared.source.if[condition];
            if(node.build && node.build.hxmls) {
                if(defines.satisfy(flow, prepared, condition)) {
                    hxmls = util.array_union(hxmls, node.build.hxmls);
                }
            }
        }

    return hxmls;

} //parse
