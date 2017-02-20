var MikroNode = require('mikronode-ng'),
    http = require('http');

var logger = {
  debug: (issuer, msg) => console.log(Date.now() + ' [INFO] ' + issuer + ': ' + msg),
  info: (issuer, msg) => console.log(Date.now() + ' [INFO] ' + issuer + ': ' + msg),
  warn: (issuer, msg) => console.warn(Date.now() + ' [INFO] ' + issuer + ': ' + msg),
  error: (issuer, msg) => console.error(Date.now() + ' [INFO] ' + issuer + ': ' + msg)
}

var RestfulMikrotik = function ({host, user, password, port = 8728, tls = false, listen_port = 8080, listen_host = '127.0.0.1'}) {
  var connection = MikroNode.getConnection(host, user, password, {
    port, tls, closeOnDone: false
  });

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
            var str_error = JSON.stringify(error);
            console.log(error);
            logger.error('mikronode-cmd', 'got error: ' + str_error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(str_error);
          });
        })
      .catch(err => logger.error(err));
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

  httpd.listen(listen_port, listen_host);
  logger.info('httpd', 'listening on ' + listen_host + ':' + listen_port);
};

module.exports = RestfulMikrotik;
