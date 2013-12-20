#!/usr/bin/env node

var express = require('express'),
  fs = require('fs'),
  completecdnfinder = require("./lib/cdnfinder.js").completecdnfinder,
  hostnamefinder = require("./lib/hostnamefinder.js").hostnamefinder;
  
var formidable = require('formidable'),
    http = require('http'),
    util = require('util');

//Path is required to navigate throw directories	
var path = require('path');	
	
var app = express(); 
//This line is to access the directory of the assets
app.use(express.static(path.join(__dirname, 'assets')));

//app.use(express.bodyParser()); 
//bodyParser will be removed by the following 2 lines
app.use(express.json());
app.use(express.urlencoded());


app.get('/', function(req, res){
  console.log(new Date(), req.connection.remoteAddress)
  fs.readFile(__dirname + '/assets/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
});

app.post('/cdnfinder', function(req, res){
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

var async = require('async');

app.get('/bulk', function(req, res){
	console.log(new Date(), req.connection.remoteAddress)
  
  	req.connection.setTimeout(timeOut);
	var pathnames = url.parse(req.url, true).query["domain"];
	if(pathnames.constructor.toString().indexOf("Array") == -1){
		pathnames =[pathnames];
	}
	console.log(pathnames);
	var format = url.parse(req.url, true).query["format"];
	
	var bulk = { "bulkmode":true, "domains":[]};
	
	async.forEachLimit(pathnames, parallelProc, function(pathname, callback) {
			completecdnfinder(pathname, function(err, results){
				if(results){
					results["domain"] = pathname;
					for(var i = 0, l = results.resource.length; i < l; i++) {
						delete results.resource[i].headers;
					}
					bulk.domains.push(results);
				} else {
					console.log("ERROR");
					bulk.domains.push({"domain": pathname, "status": "FAILURE"});
				}
				callback();
			});
    }, function(err) {
        if (err) res.send({"status": "FAILURE--> "+err});
		else {
			//is called after all the iterator functions have finished
			if(format == 'xml' || format == 'XML'){
				//console.log(js2xmlparser("bulk", bulk));
				res.send(js2xmlparser("bulk", bulk));
			} else {
				res.send(bulk);
			}
		}
    });	

});



app.post('/bulkUpload', function(req, res){
	console.log(new Date(), req.connection.remoteAddress)
  
  	req.connection.setTimeout(timeOut);
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (err) res.send({"status": "Something went wrong with your request"+err});
		else {
			fs.readFile(files.file.path, 'utf8', function (err, data) {

				var pathnames = data.split(/\r\n|\r|\n/g);
				var format = fields.format;
				
				var bulk = { "bulkmode":true, "domains":[]};
				
				async.forEachLimit(pathnames, parallelProc, function(pathname, callback) {
						completecdnfinder(pathname, function(err, results){
							if(results){
								results["domain"] = pathname;
								for(var i = 0, l = results.resource.length; i < l; i++) {
									delete results.resource[i].headers;
								}
								bulk.domains.push(results);
							} else {
								console.log("ERROR: "+err);
								bulk.domains.push({"domain": pathname, "status": "FAILURE"});
							}
							callback();
						});
				}, function(err) {
					if (err) res.send({"status": "FAILURE--> "+err});
					else{
						//is called after all the iterator functions have finished
						if(format == 'xml' || format == 'XML'){
							//console.log(js2xmlparser("bulk", bulk));
							res.send(js2xmlparser("bulk", bulk));
						} else {
							res.send(bulk);
						}
					}
				});			
			});
		
		}
    });

});


app.post('/bulk', function(req, res){
	console.log(new Date(), req.connection.remoteAddress)
	req.connection.setTimeout(timeOut);
	
	var pathnames = req.body.domain;
	if(pathnames.constructor.toString().indexOf("Array") == -1){
		pathnames =[pathnames];
	}
		
	var format = req.body.format;
		
	var bulk = { "bulkmode":true, "domains":[]};
		
	async.forEachLimit(pathnames, parallelProc, function(pathname, callback) {
			completecdnfinder(pathname, function(err, results){
				if(results){
					results["domain"] = pathname;
					for(var i = 0, l = results.resource.length; i < l; i++) {
						delete results.resource[i].headers;
					}
					bulk.domains.push(results);
				} else {
					console.log("ERROR: "+err);
					bulk.domains.push({"domain": pathname, "status": "FAILURE"});
				}
				callback();
			});
	}, function(err) {
		if (err) res.send({"status": "FAILURE--> "+err});
		else {
			//is called after all the iterator functions have finished
			if(format == 'xml' || format == 'XML'){
				//console.log(js2xmlparser("bulk", bulk));
				res.send(js2xmlparser("bulk", bulk));
			} else {
				res.send(bulk);
			}
		}
	});			
  
});


app.post('/urlsUpload', function(req, res){
	console.log(new Date(), req.connection.remoteAddress)
  
  	req.connection.setTimeout(timeOut);
	var form = new formidable.IncomingForm();
	form.parse(req, function(err, fields, files) {
		if (err) res.send({"status": "Something went wrong with your request"+err});
		else {
		
			var countryCode = fields.countryCode;
			var sessionId = '{ "sessionId":"'+fields.sessionId+'"}';
			fs.readFile(files.file.path, 'utf8', function (err, data) {
				
				if(err) { 
					console.log(err);
					res.send({"upload":"fail"});
				}else {
					fs.writeFile(__dirname + '/tmp/latest_'+countryCode, data, function(err) {
						if(err) {
							console.log(err);
							res.send({"upload":"fail"});
						} else {
							console.log("The file was saved!");
						}
					});
					
					fs.writeFile(__dirname + '/tmp/latest_sessionId', sessionId, function(err) {
						if(err) {
							console.log(err);
							res.send({"upload":"fail"});
						} else {
							console.log("The file was saved!");
						}
					});
				}				
			});
			res.send({"upload":"ok"});
		
		}
    });
});

app.get('/getUrls', function(req, res){

  var countryCode = url.parse(req.url, true).query["countryCode"];
  console.log(new Date(), req.connection.remoteAddress);
  
  var directory = '';
  if (path.existsSync(__dirname + '/tmp/latest_'+countryCode)) {
	directory = '/tmp/latest_'+countryCode;
  } else{
	directory = '/tmp/latest_GLOBAL';
  }
  
  fs.readFile(__dirname + directory,
  function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading getUrls');
		}
		res.writeHead(200);
		res.end(data);
  });
  
});

app.get('/getSessionId', function(req, res){

  console.log(new Date(), req.connection.remoteAddress);
  fs.readFile(__dirname + '/tmp/latest_sessionId',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading getUrls');
    }
    res.writeHead(200);
    res.end(data);
  });
});


var timeOut = 1800000; //30 min
var parallelProc = 5; 
var port = 80;
console.log('CDNFinder listening in http://yourdomain:'+port);
app.listen(port);

//completecdnfinder("http://www.msnbc.com/", function(err, results){
//  console.dir(results);
//});

//Test function
app.get('/test', function(req, res){

	req.connection.setTimeout(timeOut);
	console.log(new Date(), req.connection.remoteAddress)
	
	var start = new Date();
	var pathnames = top10;

	console.log(pathnames);
	var format = url.parse(req.url, true).query["format"];
	
	var bulk = { "bulkmode":true, "domains":[]};
	
	async.forEachLimit(pathnames, parallelProc, function(pathname, callback) {
			completecdnfinder(pathname, function(err, results){
				if(results){
					results["domain"] = pathname;
					for(var i = 0, l = results.resource.length; i < l; i++) {
						delete results.resource[i].headers;
					}
					bulk.domains.push(results);
				} else {
					console.log("ERROR: "+err);
					bulk.domains.push({"domain": pathname, "status": "FAILURE"});
				}
				callback();
			});
    }, function(err) {
        if (err) res.send({"status": "FAILURE--> "+err});;
		
		//is called after all the iterator functions have finished
		var end = new Date();
		console.log("Start at "+start+"\n End at "+end)
		if(format == 'xml' || format == 'XML'){
			//console.log(js2xmlparser("bulk", bulk));
			res.send(js2xmlparser("bulk", bulk));
		} else {
			res.send(bulk);
		}
    });	

});




var top10 = ["http://google.com"
,"http://www.facebook.com"
,"http://youtube.com"
,"http://yahoo.com"
,"http://baidu.com"
,"http://wikipedia.org"
,"http://qq.com"
,"http://linkedin.com"
,"http://live.com"
,"http://twitter.com"
]


var top100 = ["http://google.com"
,"http://www.facebook.com"
,"http://youtube.com"
,"http://yahoo.com"
,"http://baidu.com"
,"http://wikipedia.org"
,"http://qq.com"
,"http://linkedin.com"
,"http://live.com"
,"http://twitter.com"
,"http://amazon.com"
,"http://taobao.com"
,"http://blogspot.com"
,"http://google.co.in"
,"http://sina.com.cn"
,"http://wordpress.com"
,"http://yahoo.co.jp"
,"http://yandex.ru"
,"http://bing.com"
,"http://ebay.com"
,"http://hao123.com"
,"http://vk.com"
,"http://google.de"
,"http://163.com"
,"http://tumblr.com"
,"http://pinterest.com"
,"http://google.co.uk"
,"http://google.fr"
,"http://ask.com"
,"http://msn.com"
,"http://google.co.jp"
,"http://microsoft.com"
,"http://googleusercontent.com"
,"http://mail.ru"
,"http://weibo.com"
,"http://google.com.br"
,"http://apple.com"
,"http://paypal.com"
,"http://tmall.com"
,"http://google.ru"
,"http://instagram.com"
,"http://xvideos.com"
,"http://google.com.hk"
,"http://google.it"
,"http://blogger.com"
,"http://google.es"
,"http://imdb.com"
,"http://sohu.com"
,"http://craigslist.org"
,"http://360.cn"
,"http://soso.com"
,"http://amazon.co.jp"
,"http://go.com"
,"http://xhamster.com"
,"http://bbc.co.uk"
,"http://google.com.mx"
,"http://stackoverflow.com"
,"http://neobux.com"
,"http://google.ca"
,"http://fc2.com"
,"http://imgur.com"
,"http://alibaba.com"
,"http://cnn.com"
,"http://adcash.com"
,"http://wordpress.org"
,"http://espn.go.com"
,"http://flickr.com"
,"http://thepiratebay.sx"
,"http://huffingtonpost.com"
,"http://odnoklassniki.ru"
,"http://t.co"
,"http://vube.com"
,"http://conduit.com"
,"http://akamaihd.net"
,"http://adobe.com"
,"http://gmw.cn"
,"http://amazon.de"
,"http://aliexpress.com"
,"http://reddit.com"
,"http://google.com.tr"
,"http://pornhub.com"
,"http://ebay.de"
,"http://about.com"
,"http://youku.com"
,"http://godaddy.com"
,"http://bp.blogspot.com"
,"http://google.com.au"
,"http://rakuten.co.jp"
,"http://google.pl"
,"http://xinhuanet.com"
,"http://ku6.com"
,"http://ebay.co.uk"
,"http://dailymotion.com"
,"http://ifeng.com"
,"http://cnet.com"
,"http://netflix.com"
,"http://vimeo.com"
,"http://uol.com.br"
,"http://amazon.co.uk"
,"http://dailymail.co.uk"]
