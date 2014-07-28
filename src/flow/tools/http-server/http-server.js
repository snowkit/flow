var fs = require('fs'),
    util = require('util'),
    union = require('union'),
    session = require('cookie-session'),
    uuid = require('node-uuid'),
    ecstatic = require('ecstatic');

var HTTPServer = exports.HTTPServer = function (options) {
  options = options || {};

  if (options.root) {
    this.root = options.root;
  }
  else {
    try {
      fs.lstatSync('./public');
      this.root = './public';
    }
    catch (err) {
      this.root = './';
    }
  }

  if (options.headers) {
    this.headers = options.headers;
  }

  this.cache = options.cache || 3600; // in seconds.
  this.showDir = options.showDir !== 'false';
  this.autoIndex = options.autoIndex !== 'false';

  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }

  var socket_list = {}
  this.socket_list = socket_list;

  this.server = union.createServer({
    before: (options.before || []).concat([
      session({secret:'notreallyasecretdevonly'}),
      function (req, res) {
        req.socket.setKeepAlive(false);
        req.socket.setTimeout(5000);
        if(!req.session.id) {
          req.session.id = uuid();
        }

        // console.log('request from session ' + req.session.id);

        if(!req.socket.__sid) {
            //tag the socket
          req.socket.__sid = uuid();
        } //socket __sid

          //add the list if not existing
        if(!socket_list[req.session.id]){
          socket_list[req.session.id] = [];
        }

          //add to the list
        socket_list[req.session.id].push(req.socket.__sid);

        req.socket.on('close', function(d){
          // console.log("closed ", this.__sid);
          var _list = socket_list[req.session.id];
          if(_list) {
            var ind = _list.indexOf(this.__sid);
            if(ind != -1) {
              _list.splice(ind,1);
            }
          }

          if(_list.length == 0) {
            process.exit();
          }
          // console.log(_list);

        });

        options.logFn && options.logFn(req, res);
        res.emit('next');
      },
      ecstatic({
        root: this.root,
        cache: this.cache,
        showDir : this.showDir,
        autoIndex: this.autoIndex,
        defaultExt: this.ext
      })
    ]),
    headers: this.headers || {}
  });

};

HTTPServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

HTTPServer.prototype.close = function () {
  return this.server.close();
};

exports.createServer = function (options) {
  return new HTTPServer(options);
};
