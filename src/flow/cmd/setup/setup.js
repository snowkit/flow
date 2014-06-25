

var haxelib = require('../../util/haxelib');

exports.run = function run(flow, data) {

    flow.log(2, 'doing setup');

    var snow = haxelib.get(flow,'snow');
    flow.log(2, 'found snow', snow);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
} //verify

exports.error = function(flow, err) {

} //error