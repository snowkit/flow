    var   fs = require('graceful-fs')
        , path = require('path')
        , jscrush = require('jscrush')
        , UglifyJS = require('uglify-js')


exports.post_build = function(flow, config, done) {

    var out_file = path.join(flow.project.path_output, flow.project.prepared.source.project.app.name);
    var min_code = fs.readFileSync(out_file + '.js', 'utf8');

        //minify step
    if(flow.flags.min) {

        var result = UglifyJS.minify(min_code, {fromString:true});
        min_code = result.code;

    } //flags.min

        //crush step
    if(flow.flags.crush) {
        min_code = jscrush(min_code);
    }

    if(min_code) {
        fs.writeFileSync(out_file+'.min.js', min_code, 'utf8');
    }

    done();
}

exports.post_haxe = function(flow, config, done) {
    done();
}
