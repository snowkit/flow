

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