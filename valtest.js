const { invalidExercise } = require('./validation/exercisesValidators');


const exercise = {
  name: 'sjdhf jfkdleis ejdhcifj rnc',
  description: 'head',
  muscleGroup: 'hello my'
};

console.log(exercise.description.length)
console.log(invalidExercise(exercise))