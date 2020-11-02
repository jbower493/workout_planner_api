module.exports = {
  invalidExercise(exercise) {
    if(typeof exercise !== 'object') {
      return 'Exercise must be an object'
    }
    if(typeof exercise.name !== 'string' ||
      typeof exercise.description !== 'string' ||
      typeof exercise.muscleGroup !== 'string') {
      return 'All fields must be strings'
    }
    return false;
  },

  
};