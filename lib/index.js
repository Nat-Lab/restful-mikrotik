var MikroNode = require('mikronode-ng'),
    http = require('http');

var logger = {
  debug: (issuer, msg) => console.log(Date.now() + ' [DEBUG] ' + issuer + ': ' + msg),
  info: (issuer, msg) => console.log(Date.now() + ' [INFO] ' + issuer + ': ' + msg),
  warn: (issuer, msg) => console.warn(Date.now() + ' [WARN] ' + issuer + ': ' + msg),
  error: (issuer, msg) => console.error(Date.now() + ' [ERROR] ' + issuer + ': ' + msg)
};

var RestfulMikrotik = function ({host, user, password, port = 8728, tls = false, listen_port = 8080, listen_host = '127.0.0.1'}) {
  var getConn = () => MikroNode.getConnection(host, user, password, {
    port, tls
  });

  var connection = getConn();

  var conn_evnt = (type, err) => {
    logger.error('mikronode-conn', 'Connection ' + type + ' error: ' + err + ', rebuild connection.');
    connection = getConn();
  }

  connection.on('error', err => conn_evnt('error', err));
  connection.on('timeout', err => conn_evnt('timeout', err));

  var conn_exec = (res, path, postdata) => {
    connection.getConnectPromise()
      .then(conn => {
        var cp = postdata ?
         conn.getCommandPromise(path, JSON.parse(postdata)) :
         conn.getCommandPromise(path);
        cp
          .then(values => {
            var str_values = JSON.stringify(values);
            logger.info('mikronode-cmd', 'got respond: ' + str_values);
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(str_values);
          })
          .catch(error => {
            var str_error = JSON.stringify({error: error.toString()});
            console.log(error);
            logger.error('mikronode-cmd', 'got error: ' + error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(str_error);
          });
        })
      .catch(err => {
        logger.error(err);
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: err.toString()}));
      });
  };

  var httpd = http.createServer((req, res) => {
    var path = req.url;
    switch (req.method) {
      case 'POST':
        var postdata = '';
        req.on('data', data => {
          postdata += data;
          logger.debug('httpd', 'partial POST data: ' + data);
        });
        req.on('end', () => {
          logger.info('httpd', 'got POST on ' + path + ', data: ' + postdata);
          conn_exec(res, path, postdata);
        });
        break;
      case 'GET':
        logger.info('httpd', 'got GET on ' + path);
        conn_exec(res, path);
        break;
      default: logger.warn('httpd', 'invalid http request method: ' + req.method);

    }
  });

  connection.getConnectPromise().then(conn => conn.getCommandPromise('/').then().catch(err => {})); // no idea at all, but required.
  httpd.listen(listen_port, listen_host);
  logger.info('httpd', 'listening on ' + listen_host + ':' + listen_port);

  return {
    stop: function() {
      connection.close();
      httpd.close();
    }
  };
};

module.exports = RestfulMikrotik;
