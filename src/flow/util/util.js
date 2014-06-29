
var   fs = require('graceful-fs')
    , path = require('path')
    , wrench = require('wrench')
    , fse = require('fs-extra')


exports.object_size = function(obj) {
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

  //copy all of obj_src onto obj_dest overriding existing values
exports.merge_combine = function merge_combine(obj_src, obj_dest) {
  if(!obj_src) return obj_dest;
  for (var p in obj_src) {
    if(obj_dest[p]) {
      if ( obj_src[p].constructor == Object ) {
        obj_dest[p] = merge_combine(obj_src[p], obj_dest[p]);
      } else {
        obj_dest[p] = obj_src[p];
      }
    } else {
      obj_dest[p] = obj_src[p];
    }
  } //each value
  return obj_dest;
} //merge_combine

  //copy all of obj_src onto obj_dest only if the value doesn't exist already
exports.merge_unique = function merge_unique(obj_src, obj_dest) {
  if(!obj_src) return obj_dest;
  for (var p in obj_src) {
    if(obj_dest[p]) {
      if ( obj_src[p].constructor == Object ) {
        obj_dest[p] = merge_unique(obj_src[p], obj_dest[p]);
      }
    } else {
      obj_dest[p] = obj_src[p];
    }
  } //each value
  return obj_dest;
} //merge_unique

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

//file stuff

exports.copy_path = function(flow, source, dest) {

    if(fs.statSync(source).isDirectory()) {
        flow.log(5, '     util - copying folder from %s to %s', source, dest);
        exports.copy_folder_recursively(flow, source, dest);
    } else {
        flow.log(5, '     util - copying file from %s to %s', source, dest);
        wrench.mkdirSyncRecursive(path.dirname(dest), 0755);
        fse.copySync(source, dest);
    }
}


exports.copy_folder_recursively = function(flow, _source, _dest, _overwrite) {

    if(_overwrite == undefined) _overwrite = true;

        //make sure the destination exists
        //before copying any files to the location
    wrench.mkdirSyncRecursive(_dest, 0755);

        //obtain a list of items from the source
    var _source_list = wrench.readdirSyncRecursive(path.resolve(flow.run_path, _source));

        //for each source item, check if it's a directory
    var _source_file_list = [];

    for(var i = 0; i < _source_list.length; ++i) {
        var _is_dir = fs.statSync( path.join(_source, _source_list[i]) ).isDirectory();
        if(!_is_dir) {
            var allow = _source_list[i].charAt(0) != '.' || !flow.config.build.files_ignore_dotfiles;
            if(allow) {
              _source_file_list.push(_source_list[i]);
            }
        }
    }

        //for each file only, copy it across
    for(var i = 0; i < _source_file_list.length; ++i) {
        var _dest_file = path.join(_dest,_source_file_list[i]);
        fse.ensureFileSync(_dest_file);
        var source_path = path.join(_source, _source_file_list[i]);
        flow.log(3,'        - copying ' + source_path + ' to ' + _dest_file );
        fse.copySync( source_path, _dest_file );
    }

} //copy_folder_recursively
