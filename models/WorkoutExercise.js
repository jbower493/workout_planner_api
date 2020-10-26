const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const WorkoutExerciseSchema = new Schema({
  exercise: {
    type: Schema.Types.ObjectId,
    ref: 'Exercise'
  },
  reps: {
    type: Number,
    required: true
  },
  sets: {
    type: Number,
    required: true
  },
  weight: {
    type: String,
    required: true
  }
})


const WorkoutExercise = mongoose.model('WorkoutExercise', WorkoutExerciseSchema);

module.exports = WorkoutExercise;