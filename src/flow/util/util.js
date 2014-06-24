

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

exports.array_union = function(a,b) {
    var r = a.slice(0);
    b.forEach(function(i) { if (r.indexOf(i) < 0) r.push(i); });
    return r;
}

exports.array_diff = function(a,b) {
    return a.filter(function(i) {return b.indexOf(i) < 0;});
}

exports.deep_copy = function deep_copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

//sourced https://github.com/arturadib/shelljs
exports.random_file = function random_file() {

  function random_hash(count) {
    if (count === 1)
      return parseInt(16*Math.random(), 10).toString(16);
    else {
      var hash = '';
      for (var i=0; i<count; i++)
        hash += random_hash(1);
      return hash;
    }
  }

  return 'flow_'+random_hash(20);

} //random_file

exports.pad = function pad(width, string, padding) {
  return (width <= string.length) ? string : exports.pad(width, padding + string, padding)
}