
exports.run = function run(flow, err) {

    if(err && err.length > 0) {
        console.error('\n> Error');
        console.error('> %s', err);
    }

    console.log('\nflow options : ');
    console.log('> blah');
    console.log('');

}

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function error(flow, err) {

}