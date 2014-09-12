var express = require('express'),
	app = express(),
	http = require('http'),
	connect = require('connect'),
	MongoClient = require('mongodb').MongoClient,
	Server = require('mongodb').Server,
	Collection="counters",
	MDB="mongodb://nodejitsu_manavagarwal1:kjreid5d2tvb090dbb6cv1eodi@ds029960.mongolab.com:29960/nodejitsu_manavagarwal1_nodejitsudb8311835222",
	useragent = require('express-useragent'),
	nodemailer = require("nodemailer"),
	count=0,
	Submitted=0;
app.use(connect.json());
app.use(connect.urlencoded());
app.use('/public', express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.get('*', function(req,res){
	if(Submitted==0)
	{
		MongoClient.connect(MDB,function(err,db){
			if(err) throw err;
			var source = req.headers['user-agent'],
				ua = useragent.parse(source);
			var query = {};
			query["_id"]="VisitorCount";
			var operator = {$inc: {Count:1}};
			db.collection(Collection).update(query,operator,{upsert:true},function(err,upserted){
					if(err) throw err;
					//db.collection("counters").insert({_id: "VisitorCount", Count: 0}, function(err,results){
						db.collection(Collection).find({_id: "VisitorCount"}).toArray(function(err,results){
							var VisitQuery={};
							VisitQuery["_id"] = results[0].Count;
							VisitQuery["Timestamp"] = Date();
							VisitQuery["IP"] = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
							VisitQuery["headers"] = ua;
							for (var name in ua)
								{
								 if(ua[name])
									{
									VisitQuery[name] = ua[name];
									}
								}
							db.collection(Collection).insert(VisitQuery, function(err,result){
								//console.dir(result);
								res.render("getip.html",{Count : results[0].Count, Submitted:Submitted});
								Submitted=0;
							});
						});
					//});
			});
		});
	}
	else
		{
		res.render("getip.html",{Count : 0, Submitted:Submitted});
		Submitted=0;
	}
});

// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "manavagarwalnet@gmail.com",
        pass: "project124"
    }
});
app.post('/', function(req, res, next) {

	// setup e-mail data with unicode symbols
	var mailOptions = {
		from: req.body.Name + " <" + req.body.Email, // sender address
		to: "manav.agarwal4@gmail.com", // list of receivers
		subject: "Message from "+req.body.Email, // Subject line
		html: req.body.Message, // plaintext body
	}

	// send mail with defined transport object
	smtpTransport.sendMail(mailOptions, function(error, response){
		if(error){
			console.log(error);
		}else{
			console.log("Message sent: " + response.message);
		}

		// if you don't want to use this transport object anymore, uncomment following line
		//smtpTransport.close(); // shut down the connection pool, no more messages
	});
	Submitted=1;
	res.redirect(req.url);
});


http.createServer(app).listen(8080, function(){
  console.log('Express server listening on port 8080');
});