

var haxelib = require('../../util/haxelib');

exports.run = function run(flow, data) {

    console.log('flow / doing setup');

    var snow = haxelib.get(flow,'snow');
    console.log('found snow', snow);

} //run

exports.verify = function verify(flow, done) {
    done(null,null);
} //verify

exports.error = function(flow, err) {

} //error