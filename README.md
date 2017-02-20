restful-mikrotik
---

A Restful API wrapper for [mikronode](https://github.com/Trakkasure/mikronode). 

usage: 

```
% npm install restful-mikrotik
```

```Javascript
var RestfulMikrotik = require('restful-mikrotik');
var api_server = new RestfulMikrotik({
  host: '10.0.0.1',
  user: 'admin',
  password: 'password',
  listen_port: 8080,
  listen_host: '127.0.0.1'
});

// api_server.stop(); // stop API server.
```
Constructor of `RestfulMikrotik` accept an object:

properties|type|default|required?|description
:--|:--|:--|:--|:--
host|str||true|Router address
user|str||true|Router username
password|str||ture|Router password
port|int|8728|false|Router API port
tls|bool/object|false|false|See [mikronode document](http://trakkasure.github.io/mikronode/mikronode.Connection.html) for more infomation.
listen_port|int|8080|false|REST API server listen port
listen_host|str|127.0.0.1|false|REST API server listen address


To query, send a `GET` request to API server:  

```
% curl http://127.0.0.1:8080/ip/firewall/nat/print
[{".id":"*1","chain":"srcnat","action":"masquerade","out-interface":"ether1" .... 
```

To use command with parameters, `POST` a JSON object:

```
% curl http://127.0.0.1:8080/ip/address/comment -H 'Content-Type: application/json' -X POST -d '{"=numbers": 5, "=comment": "VPN"}'
[] 
# equivalent to "/ip address comment numbers=5 comment=VPN"
```

To query with condition, `POST` a JSON object: 

```
% curl http://127.0.0.1:8080/ip/address/print -H 'Content-Type: application/json' -X POST -d '{"?interface": "ether1"}'
[{".id":"*2","address":"172.19.38.45/24","network":"172.19.38.0","interface":"ether1","actual-interface":"ether1","invalid":"false","dynamic":"true","disabled":"false"}]
# equivalent to "/ip address print where interface=ether1"
```

For more information about query/parameter, see [mikrotik wiki](http://wiki.mikrotik.com/wiki/Manual:API#API_attribute_word).
