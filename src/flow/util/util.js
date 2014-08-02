
var   fs = require('graceful-fs')
    , path = require('path')
    , wrench = require('wrench')
    , fse = require('fs-extra')
    , cmd = require('./process')


exports.object_size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

exports.random_int = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

exports.to_hex = function(value) {
   return (value+0x10000).toString(16).substr(-4).toUpperCase();
}


exports.system_arch = function(flow) {
    if(process.arch == 'x64') {
        return '64';
    } else if(process.arch == 'ia32') {
        return '32';
    }
} //system_arch

exports.ios_uniqueid = function(flow) {

    return ''+
      exports.to_hex( exports.random_int(0, 32767) ) +
      exports.to_hex( exports.random_int(0, 32767) ) +
      exports.to_hex( exports.random_int(0, 32767) ) +
      exports.to_hex( exports.random_int(0, 32767) ) +
      exports.to_hex( exports.random_int(0, 32767) ) +
      exports.to_hex( exports.random_int(0, 32767) );

}

exports.array_union = function(a,b) {
    var r = a.slice(0);
    b.forEach(function(i) { if (r.indexOf(i) < 0) r.push(i); });
    return r;
}

exports.find_home_path = function(flow) {

    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

} //find_home_path

exports.array_diff = function(a,b) {

    return a.filter(function(i) {return b.indexOf(i) < 0;});

} //array_diff

  //takes a 'object' and 'object.property.sub.value' and returns the value or undefined
exports.find_property = function(flow, obj, property) {

  var parts = property.split('.');
  var current = obj;

  for(index in parts) {

    var part = parts[index];

    if(!current) {
        break;
    }

    current = current[part];

  } //index in parts

  return current;

} //find_property


    //takes a 'object' and 'object.property.sub.value' and 'value', and sets the value returning the object
exports.set_property = function(flow, obj, property, value) {

    var parts = property.split('.');
    var parent = obj;
    var current = obj;
    var is_last = false;

    for(index in parts) {

        is_last = (index == String(parts.length-1));

        var part = parts[index];
        current = current[part];

        if(!current && !is_last) {
            current = {}
            parent[part] = current;
        } else {
            if(is_last) {
                current = value;
                parent[part] = current;
            }
        }

        parent = current;

    } //index in parts

  return obj;

} //set_property

exports.deep_copy = function deep_copy(obj) {

  return JSON.parse(JSON.stringify(obj));

} //deep_copy

exports.normalize = function(_path, _folder) {
    //normalize removes .. . // \\ and such
  var n = path.normalize(_path);
    //swap \ for /
  n = n.replace(/\\/gi,'/')

  if(_folder) {
      //then ensure trailing slash
    n = n.replace(/\/?$/, '/');
  }

  return n;
}

  //copy all of obj_src onto obj_dest overriding existing values
exports.merge_combine = function merge_combine(obj_src, obj_dest) {
  if(!obj_src) return obj_dest;
  for (var p in obj_src) {
    if(obj_dest[p] !== undefined) {
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
    if(obj_dest[p] !== undefined) {
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


exports.openurl = function(flow, url) {

    if(flow.system == 'windows') {
      cmd.exec(flow, 'explorer', [ url ]);
    } else if(flow.system == 'mac') {
      cmd.exec(flow, 'open', [ url ]);
    } else {
      cmd.exec(flow, 'xdg-open', [ url ]);
    }

} //openurl

exports.launch_server = function(flow, port, serve_path, silent, directories) {

    var node = flow.bin_path;
    var args = [ flow.server_path, "-c-1", "-p", port ];

    if(silent) {
        args.push('-s');
    }

    if(directories) {
        args.push('-d');
        args.push('true');
    }

    cmd.exec(flow, node, args, { cwd: serve_path });

} //launch_server

//file stuff

exports.copy_path = function(flow, source, dest) {

    if(fs.statSync(source).isDirectory()) {
        flow.log(5, '     util - copying folder from %s to %s', source, dest);
        return exports.copy_folder_recursively(flow, source, dest);
    } else {
        flow.log(5, '     util - copying file from %s to %s', source, dest);
        wrench.mkdirSyncRecursive(path.dirname(dest), 0755);
        fse.copySync(source, dest);
        return [ dest ];
    }
}


exports.copy_folder_recursively = function(flow, _source, _dest, _overwrite) {

    var copied_list = [];

    if(_overwrite == undefined) _overwrite = true;

    _dest = util.normalize(_dest, true);

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
        var _dest_file = util.normalize(path.join(_dest,_source_file_list[i]));
        fse.ensureFileSync(_dest_file);
        var source_path = util.normalize(path.join(_source, _source_file_list[i]));
        flow.log(3,'        - copying ' + source_path + ' to ' + _dest_file );
        fse.copySync( source_path, _dest_file );
        copied_list.push( _dest_file );
    }

    return copied_list;

} //copy_folder_recursively
