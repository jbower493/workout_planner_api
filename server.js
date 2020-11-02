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

// import helpers
const { invalidUsername, invalidPassword } = require('./validation/authValidators.js');
const { invalidExercise } = require('./validation/exercisesValidators.js');

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


// get user
app.get('/get-user', (req, res, next) => {
  if(!req.user) {
    return res.json({ success: false });
  }
  res.json({
    success: true,
    user: req.user
  });
});

// register
app.post('/register', async (req, res, next) => {
  if(invalidUsername(req.body.username)) {
    return res.json({
      success: false,
      error: invalidUsername(req.body.username)
    })
  }
  if(invalidPassword(req.body.password)) {
    return res.json({
      success: false,
      error: invalidPassword(req.body.password)
    })
  }
  try {
    const user = await User.findOne({ username: req.body.username });
    if(user) return res.json({
      success: false,
      error: 'User already exists'
    });
    const hash = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      password: hash
    });
    await newUser.save();
    res.json({
      success: true
    });
  } catch(e) {
    next(e);
  }
});

// login
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if(err) return next(err);
    if(!user) return res.json({
      success: false,
      error: 'Incorrect username and password combination'
    });
    req.login(user, err => {
      if(err) return next(err);
      res.json({
        success: true,
        user: req.user
      });
    });
  })(req, res, next);
});

// logout
app.get('/logout', (req, res, next) => {
  if(req.user) {
    req.logout();
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// get exercises
app.get('/get-exercises', (req, res, next) => {
  Exercise.find({ owner: req.user.id })
    .then(docs => res.json({
      success: true,
      exercises: docs
    }))
    .catch(e => next(e))
});

// new exercise
app.post('/new-exercise', (req, res, next) => {
  const pressUps = new Exercise({
    name: req.body.name,
    description: req.body.description,
    muscleGroup: req.body.muscleGroup,
    owner: req.user.id
  });

  const testObject = 'hello'

  if(invalidExercise(testObject)) {
    console.log('failed validation')
  } else {
    console.log('passed validation')
  }

  pressUps.save()
    .then(doc => {
      Exercise.find({ owner: req.user.id })
        .then(docs => res.json({
          success: true,
          exercises: docs
        }));
    })
    .catch(e => next(e));
});

// edit exercise
app.post('/edit-exercise/:exerciseId', (req, res, next) => {
  Exercise.findByIdAndUpdate(req.params.exerciseId, {
    name: req.body.name,
    description: req.body.description,
    muscleGroup: req.body.muscleGroup
  })
    .then(doc => {
      Exercise.find({ owner: req.user.id })
        .then(docs => res.json({
          success: true,
          exercises: docs
        }));
    })
    .catch(e => next(e))
});

// delete exercise
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
        .then(result => {
          Exercise.find({ owner: req.user.id })
            .then(docs => res.json({
              success: true,
              exercises: docs,
              workouts: req.user.workouts
            }));
        });
    })
    .catch(e => next(e));
});

// get workouts
app.get('/get-workouts', (req, res, next) => {
  User.findById(req.user.id)
    .populate({
      path: 'workouts.exercises.exercise',
      model: 'Exercise'
    })
    .then(doc => res.json({
      success: true,
      workouts: doc.workouts
    }))
    .catch(e => next(e))
});

// new workout
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
      User.findById(req.user.id)
        .populate({
          path: 'workouts.exercises.exercise',
          model: 'Exercise'
        })
        .then(doc => res.json({
          success: true,
          workouts: doc.workouts
        }))
    })
    .catch(e => next(e))
});

// edit workout
app.post('/edit-workout/:workoutId', (req, res, next) => {
  const workouts = req.user.workouts;
  const workout = workouts.find(item => item._id == req.params.workoutId);
  workout.name = req.body.name;
  workout.duration = req.body.duration;
  workout.type = req.body.type;
  User.findByIdAndUpdate(req.user._id, { workouts })
    .then(result => {
      User.findById(req.user.id)
        .populate({
          path: 'workouts.exercises.exercise',
          model: 'Exercise'
        })
        .then(doc => res.json({
          success: true,
          workouts: doc.workouts
        }))
    })
    .catch(e => next(e))
});

// delete workout
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
    .then(result => {
      User.findById(req.user.id)
        .populate({
          path: 'workouts.exercises.exercise',
          model: 'Exercise'
        })
        .then(doc => res.json({
          success: true,
          workouts: doc.workouts
        }))
    })
    .catch(e => next(e))
});

// add exercise to workout
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
    .then(result => {
      User.findById(req.user.id)
        .populate({
          path: 'workouts.exercises.exercise',
          model: 'Exercise'
        })
        .then(doc => res.json({
          success: true,
          workouts: doc.workouts
        }))
    })
    .catch(e => next(e))
});

// edit workout exercise
app.post('/edit-workout-exercise/:workoutId/:workoutExerciseId', (req, res, next) => {
  const workouts = req.user.workouts;
  const workout = workouts.find(item => item._id == req.params.workoutId);
  const workoutExercise = workout.exercises.find(item => item._id == req.params.workoutExerciseId);
  workoutExercise.reps = req.body.reps;
  workoutExercise.sets = req.body.sets;
  workoutExercise.weight = req.body.weight;
  User.findByIdAndUpdate(req.user._id, { workouts })
    .then(result => {
      User.findById(req.user.id)
        .populate({
          path: 'workouts.exercises.exercise',
          model: 'Exercise'
        })
        .then(doc => res.json({
          success: true,
          workouts: doc.workouts
        }))
    })
    .catch(e => next(e))
});

// remove exercise from workout
app.delete('/workout-exercise/:workoutExerciseId/:workoutId', (req, res, next) => {
  const workouts = req.user.workouts;
  const workout = workouts.find(item => item._id == req.params.workoutId);
  const workoutIndex = workouts.indexOf(workout);
  const workoutExercise = workout.exercises.find(item => item._id == req.params.workoutExerciseId);
  const exerciseIndex = workout.exercises.indexOf(workoutExercise);
  workouts[workoutIndex].exercises.splice(exerciseIndex, 1);
  User.findByIdAndUpdate(req.user.id, { workouts })
    .then(result => {
      User.findById(req.user.id)
        .populate({
          path: 'workouts.exercises.exercise',
          model: 'Exercise'
        })
        .then(doc => res.json({
          success: true,
          workouts: doc.workouts
        }))
    })
    .catch(e => next(e))
});

// error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.json({
    success: false,
    error: 'Server error, apologies.'
  });
});


app.listen(PORT, () => console.log('Server listening on port ' + PORT));