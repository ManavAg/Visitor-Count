var express = require('express'),
	app = express(),
	connect = require('connect'),
	http = require('http'),
	MongoClient = require('mongodb').MongoClient,
	Server = require('mongodb').Server,
	swig = require('swig'),
	data,io,
	tpl = swig.compileFile(__dirname+'/views/Show.html'),
	comment='',
	collections,
	Collection="grades",
	showndata,
	MDB;
app.use(connect.json());
app.use(connect.urlencoded());
app.use('/public', express.static(__dirname + '/public'));
app.engine('html',swig.renderFile) //gives the app rendering engine a consolidate swig
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.get('/', function(req,res){
	if (MDB){
		MongoClient.connect(MDB,function(err,db){
			if(err) throw err;
			db.collectionNames(function(err,collections){
				res.render('main',{
						MDB:MDB, 
						Collection: Collection, 
						data1:showndata,
						collections: collections}); //doc
			});
		});
	} else {
		res.render('main',{comment: comment, data1:{}}); //doc
	}
	
});

app.post('/', function(req, res, next) {
		MDB = req.body.MDB;
		Collection = String(req.body.collection);
		Collection = Collection.substr(1+Collection.indexOf("."));
		showndata = '';
		if(req.body.action=="Show"){
			comment = "Collection data: \nName: " + req.body.name;
			showdata(function(data) {
					showndata = data;
					res.redirect(req.url);
				});
		}
		else if(req.body.action=="Insert"){
			console.log(req.body.dataset);
			insertdata(req.body.name,req.body.value,req.body.dataset,
				function(data) {
					showndata = data;
					res.redirect(req.url);
				});
		}
		else if(req.body.action=="Remove"){
			deletedata(req.body.dataset,function(data) {
					showndata = data;
					res.redirect(req.url);
				});
		}
		else if(req.body.action=="Search"){
			comment = "Find data: \nName: " + req.body.name;
			finddata(req.body.name,req.body.value,function(data) {
					showndata = data;
					res.redirect(req.url);
				});
		}
		else
		{
			res.redirect(req.url);
		}
});

app.get('*', function(req,res){	res.send("Page not found", 404);})

http.createServer(app).listen(8080, function(){
  console.log('Express server running');
});


function insertdata(dbname,dbvalue,dbindex,callback){
	MongoClient.connect(MDB,function(err,db){
		if(err) throw err;
		var query={};
		if(dbindex=="new")
			{
			var operator = {};//'name':dbname, 'age':dbage, sex:dbsex};
			operator[dbname] = dbvalue;
			var options = {'upsert':true};
			db.collection(Collection).update({temp:"1234"},operator,options,
				function(err,upserted){
					if(err) throw err;
					showdata(function(data) {
						callback(data);
						return db.close();
					});
			});
			}
		else{
			finddocument(dbindex,function (que){
				var operator = que;
				operator[dbname] = dbvalue;
				var query = {"_id":que["_id"]};
				db.collection(Collection).update(query,operator,options,
					function(err,upserted){
						if(err) throw err;
						showdata(function(data) {
							callback(data);
							return db.close();
						});
				});
			});
		}
	});
}

function deletedata(dbindex,callback){
	MongoClient.connect(MDB,function(err,db){
		if(err) throw err;
		finddocument(dbindex,function (que){
				var query = {"_id":que["_id"]};
				db.collection(Collection).remove(query,function(err,upserted){
					if(err) throw err;
					showdata(function(data) {
						callback(data);
					});
					return db.close();
				});
		});
	});
}
function finddata(dbname,dbvalue,callback) {
	MongoClient.connect(MDB,function(err,db){
		if(err) throw err;
		var query = {};
		query[dbname]=dbvalue;
		db.collection(Collection).find(query).toArray(function(err, results) {
			callback(results);
			return db.close();
		});
	});
}   

function finddocument(dbindex,callback) {
	MongoClient.connect(MDB,function(err,db){
		if(err) throw err;
		var query = {};
		db.collection(Collection).find(query).toArray(function(err, results) {
			callback(results[dbindex]);
			return db.close();
		});
	});
}   


function showdata(callback) {
	MongoClient.connect(MDB,function(err,db){
		if(err) throw err;
		var query = {};
		db.collection(Collection).find().toArray(function(err, results) {
			callback(results);
			return db.close();
		});
	});
}    
