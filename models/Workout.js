const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const WorkoutSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  exercises: [{ type: Schema.Types.ObjectId, ref: 'WorkoutExercise' }]
});

const Workout = mongoose.model('Workout', WorkoutSchema);

module.exports = Workout;