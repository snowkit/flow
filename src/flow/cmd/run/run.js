
// > flow run web -options

exports.run = function run(data, flow) {
    console.log('flow / running %s', flow.target);
}

exports.verify = function verify(flow, done) {
    done(null,null);
}

exports.error = function(err, flow) {
    console.log('flow / run / error %s', err);
}