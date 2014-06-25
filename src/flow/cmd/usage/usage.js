
exports.run = function run(flow, err) {

    if(err && err.length > 0) {
        console.error('\n> Error');
        console.error('> %s', err);
    }

    flow.log(1, '\nflow options : ');
    flow.log(1, '> blah');
    flow.log(1, '');

}

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function error(flow, err) {

}