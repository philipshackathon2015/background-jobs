var MongoClient = require('mongodb').MongoClient;
var moment = require("moment");
var Pusher = require('pusher');
var env = require('node-env-file');
var crontab = require('node-crontab');


var pusher = new Pusher({
  appId: '110215',
  key: '178160f97893ca18c3d2',
  secret: '388480ad57e7de314634'
});
 
env('./.env');
var mongodb;
var id = 0;

var main = function() {
	env('./.env');
	//check if user has responded to a survey in the last day, if yes quit
	getLastUserCheckin(function(checkin_moment) {
		/*var now = moment();
		//if now - 1 day is before checkin_moment, exit else proceed
		if(now.subtract(1,'days').isBefore(checkin_moment,"day")) {
			finish();
		} else {
			proceedToSentimentAnalysis();
		}*/
		proceedToSentimentAnalysis();
	});
}

var proceedToSentimentAnalysis = function() {
	getLastPostActivity(function(post) {
		var now = moment();
		console.log(moment(post.created_at));
		//if now - SOCIAL_DAYS_THRESHOLD days is before created_at or last post is not negative, proceed else trigger
		if(now.subtract(process.env.SOCIAL_DAYS_THRESHOLD,'days').isAfter(moment(post.created_at),"day") || post.sentiment.aggregate.sentiment === "negative") {
			sendTrigger("social");
		} else {
			proceedToFHIRDataAnalysis();
		}
		
		
	});
}

var proceedToFHIRDataAnalysis = function() {
	getLastFHIRInput(function(movement, sleep) {
		if(movement < parseInt(process.env.MOVEMENT_STEPS_THRESHOLD)) {
			sendTrigger("movement");
		} else if(sleep < parseInt(process.env.SLEEP_TIME_THRESHOLD)) {
			sendTrigger("sleep");
		} else {
			finish("donotsend");
		}
	});
}





var getLastUserCheckin = function(callback) {
	var collection = mongodb.collection("mood-response");
	collection.findOne({},{"sort":{"_id":-1}},function(err,item) {
		console.log(item);
		callback(moment(item._id.toString().substring(0,8)));

	});
}

var getLastFHIRInput = function(callback) {
	var collection = mongodb.collection("filtered_observations");
	var today = moment().hour(0).minute(0).second(0).millisecond(0);
	var yesterday = moment().subtract(2,"days");

	collection.find({"timestamp":{"$gte":yesterday.toDate(),"$lt": today.toDate()}}).toArray(function(err,items) {
		var movement;
		var sleep;
		for(var x in items) {
			var item = items[x];
			if(item.unit === "MDC_HF_ACT_SLEEP") {
				sleep = parseInt(item.value);
			}
			if(item.unit === "MDC_HF_DISTANCE") {
				movement = parseInt(item.value);
			}
			if(sleep && movement) {
				break;
			}
		}
		console.log("movement:"+movement+" sleep:"+sleep);
		callback(movement,sleep);
	});

};

var getLastPostActivity = function(callback) {
	var collection = mongodb.collection("sentiment");
	collection.findOne({},{"sort":{"created_at":-1}},function(err,item) {
		console.log(item);
		callback(item);

	});
}

var sendTrigger = function(type) {
	console.log("sending push:"+type);
	pusher.trigger('HealthSweet', 'newSurvey', {
	  "message": "ahoy there!",
	  "type":type,
	  "id":id
	});
	finish("send");
}

var finish = function(type) {
	console.log("finished");
	if(type !== "send") {
		id += 1;
	}
	//mongodb.close();
	//process.exit(1);
}

MongoClient.connect(process.env.MONGO_URL, function(err, db) {
	if(err) {
		console.error("connect to mongodb failed",err);
	} else {
		console.log("connected to mongo!")
		//entry point
		mongodb = db;
		var jobId = setInterval(main,10000);
	}
	
});
