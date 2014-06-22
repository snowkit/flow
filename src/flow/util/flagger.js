
var minimist = require('minimist');

module.exports = {
    parse : function parse(args) {

        var flags = minimist(args, {string:['-version']});

        flags._has = function has(flag) {
            return this._.indexOf(flag) != -1;
        }

        flags._at = function at(index) {
            return this._[index];
        }

        flags._next = function next(flag) {
            return this._at(this._index(flag)+1);
        }

        flags._index = function index(flag) {
            return this._.indexOf(flag);
        }

        return flags;

    } //parse
}; //exports
