const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const cors = require("cors");

const mongoose = require("mongoose");
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

//I can create a user by posting form data username to /api/exercise/new-user
app.post("/api/exercise/new-user", function (req, res) {
  var username=req.body.username;
  if(username=="") res.send('Path `username` is required.');
  console.log('username '+username);
   UserModel.create({ username: username}, function (err, user) {
          if (err) return err;        
   res.json({"username":username,"_id":user._id});
   });     
});
//I can get an array of all users by getting api/exercise/users
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

//I can add an exercise to any user by posting form data userId(_id), description, duration, and optionally date to /api/exercise/add
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
  
  
  /*UExerciseModel.save({ userId: user_id,description:description,duration:duration,date:date}, function (err, user) {
          if (err) return err;        
   //res.json({"username":username,"_id":user._id});
     
     serModel.findOne({_id: user_id}, function(err, user){          
        if(err) return console.log(err);
        user.push({"description":description,"duration":duration,date:date});
        res.json(user);
    });
     
   });  */
});
  

