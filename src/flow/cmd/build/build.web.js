    var   fs = require('graceful-fs')
        , path = require('path')
        , jscrush = require('jscrush')
        , UglifyJS = require('uglify-js')


exports.post_build = function(flow, config, done) {

    var out_file = path.join(flow.project.paths.output, flow.project.prepared.source.project.app.name);
    var minified = false;
    var min_code = fs.readFileSync(out_file + '.js', 'utf8');

        //minify step
    if(flow.flags.min) {

        flow.log(2, 'build - uglifying js output');

        var result = UglifyJS.minify(min_code, {fromString:true});
        min_code = result.code;
        minified = true;

        flow.log(2, 'build - uglifying - ok');

    } //flags.min

        //crush step
    if(flow.flags.crush) {

        flow.log(2, 'build - crushing js output');
        min_code = jscrush( min_code );
        flow.log(2, 'build - crushing - ok');
        minified = true;

    }

    if(minified) {
        flow.log(2, 'build - writing js min output %s', out_file+'.min.js');
        fs.writeFileSync(out_file+'.min.js', min_code, 'utf8');
    }

    done();
}

exports.post_haxe = function(flow, config, done) {
    done();
}
