

var   haxelib = require('../../util/haxelib')
    , util = require('../../util/util')

exports.run = function run(flow, data) {

    flow.log(2, 'setup - setup will exist in a different form in future. For setup instructions:\n');
    flow.log(2, 'http://snowkit.org/2014/10/29/quick-setup-guides-and-help/\n');

} //run

exports.verify = function verify(flow, done) {

    done(null, null);

} //verify

exports.error = function(flow, err) {

    if(err && err.length > 0) {
        flow.log(1, 'setup / error %s\n', err);
    }

} //error