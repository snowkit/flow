
var minimist = require('minimist');

module.exports = {
    parse : function parse(args) {

        var flags = minimist(args, {
        });

        flags._aliases = { 'try':'try_' };

        flags._has = function _has(flag) {
            return this._.indexOf(flag) != -1;
        }

        flags._at = function _at(index) {
            return this._[index];
        }

        flags._next = function _next(flag) {
            var ind = this._index(flag);
            return (ind == -1) ? null : this._at(ind+1);
        }

        flags._index = function _index(flag) {
            return this._.indexOf(flag);
        }

        flags._alias = function _alias(flag) {
            return this._aliases[flag] || flag;
        }

        return flags;

    } //parse
}; //exports
