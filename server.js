const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
//const MongoStore = require('connect-mongo')(session);
const cors = require('cors');
const bcrypt = require('bcrypt');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
require('dotenv').config();

const Exercise = require('./models/Exercise.js');
const WorkoutExercise = require('./models/WorkoutExercise');
const Workout = require('./models/Workout.js');
const User = require('./models/User.js');

const app = express();

const PORT = process.env.PORT;

// db connection
const db = process.env.MONGO_URI;

mongoose.connect(db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));


//const maxAge = 1000 * 60 * 60 * 2;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  /*cookie: {
    maxAge: maxAge,
    sameSite: true
  },*/
  //store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

app.use(cors({
  origin: 'http://localhost:3000',
  //origin: 'https://jbwebsites.work',
  credentials: true
}));
app.use(express.json());
//app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());
app.use(passport.session());
require('./config/passportConfig.js')(passport);


app.post('/new-exercise', (req, res, next) => {
  const pressUps = new Exercise({
    name: req.body.name,
    description: req.body.description,
    muscleGroup: req.body.muscleGroup,
    owner: req.user.id
  });

  pressUps.save()
    .then(doc => {
      console.log(doc)
      res.send({
        success: true,
        exercise: doc
      });
    })
    .catch(e => res.send({ success: false }));
});

app.post('/edit-exercise/:exerciseId', (req, res, next) => {
  Exercise.findByIdAndUpdate(req.params.exerciseId, {
    name: req.body.name,
    description: req.body.description,
    muscleGroup: req.body.muscleGroup
  })
    .then(doc => res.send({ success: true }))
    .catch(e => {
      console.log(e);
      res.send({ success: false });
    })
});

app.post('/new-workout', (req, res, next) => {
  const currentUser = req.user;

  const workout = new Workout({
    name: req.body.name,
    duration: req.body.duration,
    type: req.body.type
  });

  currentUser.workouts.push(workout);
  currentUser.save()
    .then(doc => {
      console.log(doc)
      res.send({ success: true });
    })
    .catch(e => res.send({ success: false }));
});

app.get('/get-workouts', (req, res, next) => {
  //res.send({ workouts: req.user.workouts });
  User.findById(req.user.id)
    .populate({
      path: 'workouts.exercises.exercise',
      model: 'Exercise'
    })
    .then(doc => {
      res.send({ workouts: doc.workouts })
    })
    .catch(e => res.send({ success: false }))
});

app.get('/get-exercises', (req, res, next) => {
  Exercise.find({ owner: req.user.id })
    .then(docs => {
      res.send({ exercises: docs });
    })
});

app.post('/add-to-workout/:workoutId', (req, res, next) => {
  // get the workout to be added to
  const currentWorkout = req.user.workouts.find(workout => workout._id == req.params.workoutId);
  // create a new workout exercise
  const nWE = new WorkoutExercise(req.body);
  // push the new exercise onto that workout's exercises array
  currentWorkout.exercises.push(nWE);
  // get the index in the users workouts array of the current workout
  const index = req.user.workouts.indexOf(currentWorkout);
  // get a copy of the workouts array for the logged in user
  const workoutsArr = req.user.workouts;
  // update that workout in the copy of the workouts array, to include the new exercise
  workoutsArr[index] = currentWorkout;
  // update user, set workouts as updated workouts array
  User.findByIdAndUpdate(req.user.id, { workouts: workoutsArr })
    .then(doc => {
      res.send({ success: true });
      console.log(doc)
    })
    .catch(e => res.send({ success: false }))
});

app.delete('/workout/:workoutId', (req, res, next) => {
  // get the workout to be removed
  const deadWorkout = req.user.workouts.find(workout => workout._id == req.params.workoutId);
  // get the index in the users workouts array of the workout to be removed
  const index = req.user.workouts.indexOf(deadWorkout);
  // get a copy of the workouts array for the logged in user
  const workoutsArr = req.user.workouts;
  // remove the workout
  workoutsArr.splice(index, 1);
  // update user, set workouts as updated workouts array
  User.findByIdAndUpdate(req.user.id, { workouts: workoutsArr })
    .then(doc => {
      res.send({ success: true });
      console.log(doc)
    })
    .catch(e => res.send({ success: false }))
});

app.delete('/workout-exercise/:workoutExerciseId/:workoutId', (req, res, next) => {
  const workouts = req.user.workouts;
  const workout = workouts.find(item => item._id == req.params.workoutId);
  const workoutIndex = workouts.indexOf(workout);
  const workoutExercise = workout.exercises.find(item => item._id == req.params.workoutExerciseId);
  const exerciseIndex = workout.exercises.indexOf(workoutExercise);
  workouts[workoutIndex].exercises.splice(exerciseIndex, 1);
  User.findByIdAndUpdate(req.user.id, { workouts })
    .then(doc => {
      res.send({ success: true });
      console.log(doc)
    })
    .catch(e => res.send({ success: false }))
});

app.delete('/exercise/:exerciseId', (req, res, next) => {
  Exercise.findByIdAndDelete(req.params.exerciseId)
    .then(doc => {
      const workouts = req.user.workouts;
      workouts.forEach(workout => {
        for(let i = 0; i < workout.exercises.length; i++) {
          if(workout.exercises[i].exercise == req.params.exerciseId) {
            workout.exercises.splice(i, 1);
          }
        }
      })
      User.findByIdAndUpdate(req.user.id, { workouts })
        .then(result => res.send({ success: true }));
    })
    .catch(e => res.send({ success: false }));
});

app.post('/edit-workout-exercise/:workoutId/:workoutExerciseId', (req, res, next) => {
  const workouts = req.user.workouts;
  const workout = workouts.find(item => item._id == req.params.workoutId);
  const workoutExercise = workout.exercises.find(item => item._id == req.params.workoutExerciseId);
  workoutExercise.reps = req.body.reps;
  workoutExercise.sets = req.body.sets;
  workoutExercise.weight = req.body.weight;
  User.findByIdAndUpdate(req.user._id, { workouts })
    .then(doc => res.send({ success: true }))
    .catch(e => {
      res.send({ success: false });
      console.log(e)
    });
});

app.post('/edit-workout/:workoutId', (req, res, next) => {
  const workouts = req.user.workouts;
  const workout = workouts.find(item => item._id == req.params.workoutId);
  workout.name = req.body.name;
  workout.duration = req.body.duration;
  workout.type = req.body.type;
  User.findByIdAndUpdate(req.user._id, { workouts })
    .then(doc => res.send({ success: true }))
    .catch(e => {
      res.send({ success: false });
      console.log(e)
    });
});

app.post('/register', (req, res, next) => {
  User.findOne({ username: req.body.username }, async (err, doc) => {
    if(err) throw err;
    if(doc) return res.send({ message: 'User already exists' });
    const hash = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      password: hash
    });
    await newUser.save();
    res.send({ message: 'New user created' });
  });
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if(err) throw err;
    if(!user) return res.send({ message: 'No user exists' });
    req.login(user, err => {
      if(err) throw err;
      res.send({
        message: 'Successfully authenticated',
        user: req.user
      });
      console.log(req.user);
    });
  })(req, res, next);
});

app.get('/logout', (req, res, next) => {
  if(req.user) {
    req.logout();
    console.log(req.user);
    res.send({ message: 'Successfully logged out' });
  } else {
    res.send({ message: 'Couldn\'t logout, no logged in user' });
  }
});

app.get('/get-user', (req, res, next) => {
  if(!req.user) {
    return res.send({ message: 'No user logged in' })
  }
  console.log(req.user);
  res.send({ user: req.user });
});


app.listen(PORT, () => console.log('Server listening on port ' + PORT));