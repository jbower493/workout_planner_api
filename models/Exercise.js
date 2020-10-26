const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ExerciseSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  muscleGroup: {
    type: String,
    required: true
  },
  owner: { type: Schema.Types.ObjectId, ref: 'User' }
});

const Exercise = mongoose.model('Exercise', ExerciseSchema);

module.exports = Exercise;