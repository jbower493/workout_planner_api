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
    if(exercise.name.length > 40) {
      return 'Name field must be 40 characters or less'
    }
    if(exercise.description.length > 500) {
      return 'Description field must be 500 characters or less'
    }
    if(exercise.muscleGroup.length > 30) {
      return 'Muscle Group field must be 30 characters or less'
    }
    return false;
  },

  invalidWorkout(workout) {
    if(typeof workout !== 'object') {
      return 'Workout must be an object'
    }
    if(typeof workout.name !== 'string') {
      return 'Name field must be a string'
    }
    if(workout.name.length > 40) {
      return 'Name field must be 40 characters or less'
    }
    if(typeof workout.duration !== 'number') {
      return 'Duration field must be a number, please enter the length of your workout in minutes'
    }
    if(typeof workout.type !== 'string') {
      return 'Type field must be a string'
    }
    if(workout.type !== 'Upper body' && workout.type !== 'Lower body' && workout.type !== 'Cardio' && workout.type !== 'Flexibility' && workout.type !== 'All round') {
      return 'Please select one of the options provided for workout type'
    }
    return false;
  },

  invalidWorkoutExercise(we) {
    if(typeof we !== 'object') {
      return 'Workout exercise must be an object'
    }
    if(typeof we.reps !== 'number') {
      return 'Please enter a number in the reps field'
    }
    if(typeof we.sets !== 'number') {
      return 'Please enter a number in the sets field'
    }
    if(typeof we.weight !== 'string') {
      return 'Weight field must be a string'
    }
    if(we.weight.length > 20) {
      return 'Weight field must be 20 characters or less'
    }
    return false;
  }
};