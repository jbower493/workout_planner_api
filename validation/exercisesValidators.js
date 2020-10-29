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

  invalidWorkoutExercise(wo) {
    if(this.invalidExercise(wo.exercise)) {
      return 'Please select an exercise'
    }
    if(typeof wo !== 'object') {
      return 'Workout exercise must be an object'
    }
    if(typeof wo.reps !== 'number') {
      return 'Please enter a number in the reps field'
    }
    if(typeof wo.sets !== 'number') {
      return 'Please enter a number in the sets field'
    }
    if(typeof wo.weight !== 'string') {
      return 'Weight field must be a string'
    }
    return false;
  }
};