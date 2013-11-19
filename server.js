#!/usr/bin/env node

var express = require('express'),
  fs = require('fs'),
  completecdnfinder = require("./lib/cdnfinder.js").completecdnfinder,
  hostnamefinder = require("./lib/hostnamefinder.js").hostnamefinder;


var app = express(); 

//app.use(express.bodyParser()); 
//bodyParser will be removed by the following 2 lines
app.use(express.json());
app.use(express.urlencoded());

app.post('/', function(req, res){
  console.log(new Date(), req.connection.remoteAddress)
  console.log(new Date(), req.body.url)
  completecdnfinder(req.body.url, function(err, results){
    if(results){
      res.send(results);
    } else {
      res.send({"status": "FAILURE"});
    }
  });
});


app.post('/hostname/', function(req, res){
  console.log(new Date(), req.connection.remoteAddress)
  console.log(new Date(), req.body.hostname);
  hostnamefinder(req.body.hostname, function(response){
    res.send(response);
  })
});


app.get('/', function(req, res){
  console.log(new Date(), req.connection.remoteAddress)
  fs.readFile(__dirname + '/lib/cdnfinder.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading cdnfinder.html');
    }
    res.writeHead(200);
    res.end(data);
  });
});


var url = require("url");
var js2xmlparser = require("js2xmlparser");

app.get('/export', function(req, res){
	console.log(new Date(), req.connection.remoteAddress)
  
	var pathname = url.parse(req.url, true).query["domain"];
	var format = url.parse(req.url, true).query["format"];

	completecdnfinder(pathname, function(err, results){
		if(results){
			results["domain"] = pathname;
			if(format == 'xml' || format == 'XML'){
		  		console.log(js2xmlparser("resources", results));
				res.send(js2xmlparser("resources", results));
			} else {
				res.send(results);
			}
		} else {
		  res.send({"status": "FAILURE"});
		}
	});

});

app.get('/links', function(req, res){
	console.log(new Date(), req.connection.remoteAddress)
  
	var pathname = url.parse(req.url, true).query["domain"];
	var format = url.parse(req.url, true).query["format"];

	completecdnfinder(pathname, function(err, results){
		if(results){
			results["domain"] = pathname;
			for(var i = 0, l = results.resource.length; i < l; i++) {
				delete results.resource[i].headers;
			}
			if(format == 'xml' || format == 'XML'){
		  		console.log(js2xmlparser("resources", results));
				res.send(js2xmlparser("resources", results));
			} else {
				res.send(results);
			}
		} else {
			res.send({"status": "FAILURE"});
		}
	});

});




var port = 1337;
console.log('CDNFinder listening in http://yourdomain:'+port);
app.listen(port);

//completecdnfinder("http://www.msnbc.com/", function(err, results){
//  console.dir(results);
//});
