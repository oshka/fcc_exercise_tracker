const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");

var ObjectId = require('mongodb').ObjectID;

mongoose.connect(process.env.MLAB_URI || "mongodb://localhost/exercise-track");

// mongoose connection
mongoose.connect(
  process.env.MONGOLAB_URI, 
    {useCreateIndex: true,useNewUrlParser: true,useUnifiedTopology: true },
   function(err, db) {  
  if (err) {
      console.log('Unable to connect to the server. Please start the server. Error1:', err);
  } else {
      console.log('Connected to Server successfully!');
  }
});

var User = new mongoose.Schema({
  // userId:{
  //   type: String,
  //   unique: true,
  //   required: true
  // },
  username:{
    type: String,
    unique: true,
    required: true
  },
   сreation_date: {
    type: Date,
    // `Date.now()` returns the current unix timestamp as a number
    default: Date.now
  }
}
);
var Exercise = new mongoose.Schema({
  userId:{
    type: String,
    required: true
  },
   description:{
    type: String,
     required: true
  },
   duration:{
    type: String,
    required: true
  },
   date:{
    type: String    
  },
   сreation_date: {
    type: Date,
    // `Date.now()` returns the current unix timestamp as a number
    default: Date.now
  }
}
);
 //var UrlShortenModel = mongoose.model('UrlShortenModel',UrlShortenSchema);
// mongoose connection

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Not found middleware
/*app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});*/


// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});


//add user
var UserModel = mongoose.model('User', User);

//1. I can create a user by posting form data username to /api/exercise/new-user
app.post("/api/exercise/new-user", function (req, res) {
  var username=req.body.username;
  if(username=="") res.send('Path `username` is required.');
  console.log('username '+username);
   UserModel.create({ username: username}, function (err, user) {
          if (err) return err;        
   res.json({"username":username,"_id":user._id});
   });     
});

//2. I can get an array of all users by getting api/exercise/users
app.get('/api/exercise/users', function(req, res){
  //res.json({"username":"username"});
  var result =[];
  UserModel.find({}, function (err, users) {
    for(var i=0;i<users.length;i++) {
      result.push({"_id":users[i]['id'],"username":users[i]['username']});
    }
    res.json(users);
  });
  
});

//3. I can add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add
var ExerciseModel = mongoose.model('Exercise', Exercise);
app.post("/api/exercise/add", function (req, res) {
  var user_id=req.body.userId,
      description = req.body.description, 
      duration = parseInt(req.body.duration), 
      date =  req.body.date!=='' ? req.body.date : (new Date().toISOString().slice(0,10));
  
  //correct date
  var regEx = '/^\d{4}-\d{2}-\d{2}$/';
    
  if(user_id=="") {
    res.send('Field `user_id` is required.');
  } else if(description=="") {
   res.send('Field `description` is required.');
  } else if(duration=="") {
   res.send('Field `duration` is required.');    
  } else if(Number.isInteger(duration)!=true) {
    res.send('Field `duration` must be integer');    
  } else if(date.match(regEx) != null) {
    res.send('Field `date` doesn`t match format `yyyy-mm-dd`');
  }
  console.log('Console.log: userId: '+user_id+', description: '+description+', duration:'+duration+'; date: '+date);
  const exercise = new ExerciseModel({userId: user_id,description:description,duration:duration,date:date});
        
    exercise.save(function(err){
        if(err) return console.log(err);
        res.json(exercise);
    });
  
  

});

//4. I can retrieve a full exercise log of any user by getting /api/exercise/log with a parameter of userId(_id)
//GET /api/exercise/log?{userId}[&amp;from][&amp;to][&amp;limit]
app.get("/api/exercise/log", function(req, res) {
    
  console.log('req.query:')
    console.log(req.query);
  
    if (JSON.stringify(req.query.userId) != undefined && JSON.stringify(req.query.userId) != "") {
        console.log(JSON.stringify(req.query.userId));

        var userId = req.query.userId, 
            object_user_id = new ObjectId(userId);

      var params = {};
      params.userId = userId ;
      
      //dates
      if ((JSON.stringify(req.query.from) != undefined && JSON.stringify(req.query.from) != "") && !(JSON.stringify(req.query.to) != undefined && JSON.stringify(req.query.to) != "")) {
         params.date = {"$gte":req.query.from};
        
      } else if ((JSON.stringify(req.query.to) != undefined && JSON.stringify(req.query.to) != "") && !(JSON.stringify(req.query.from) != undefined && JSON.stringify(req.query.from) != "")) {
          params.date = {"$lte":req.query.to};
      } else if((JSON.stringify(req.query.to) != undefined && JSON.stringify(req.query.to) != "") && (JSON.stringify(req.query.from) != undefined && JSON.stringify(req.query.from) != "")) {              
          params.date = {"$gte":req.query.from, "$lte":req.query.to};                 
      }
      
      //limit
      var limit = {};
      if(JSON.stringify(req.query.limit) != undefined && JSON.stringify(req.query.limit) != "") {
         limit = {limit: parseInt(req.query.limit)};
        console.log('limit');
        console.log(limit)
      }
      

      UserModel.find({_id : object_user_id}, function (err, user) {
        if(err) {
            res.send('unknown userId');
          } else {
            var result = {};
            result._id = userId;
            result.username = user.username;
            console.log('user');
            console.log(user);
            //ExerciseModel.find({ userId: userId}, function(err, exercises) { 
            ExerciseModel.find(params, function(err, exercises) {    
              console.log(params);
                if (err) return console.log(err);
                result.count = exercises.length;
                var result_log = [];
                for(var i=0;i<exercises.length;i++) {
                  result_log.push({"description":exercises[i]['description'],"duration":exercises[i]['duration'],"date":exercises[i]['date']});
                }
                result.log = result_log;
                res.json(result);
            }, limit);
          }
      });
      


    } else {
        res.send('unknown userId');
    }

});
  

