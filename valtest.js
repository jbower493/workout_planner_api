import Exercise from './models/Exercise';
const { invalidExercise } = require('./validation/exercisesValidators');
//const Exercise = require('./models/Exercise');


const exercise = {
  name: 'some exercise',
  description: 'some exercise description',
  muscleGroup: 'chest',
  owner: 'sideshow bob'
};

console.log(exercise)
console.log(invalidExercise(exercise))