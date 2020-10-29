module.exports = {
  invalidUsername(username) {
    if(typeof username !== 'string') {
      return 'Username must be a string'
    }
    if(username.length === 0) {
      return 'Username cannot be empty'
    }
    return false;
  },

  invalidPassword(password) {
    if(typeof password !== 'string') {
      return 'Password must be a string'
    }
    if(password.length === 0) {
      return 'Password cannot be empty'
    }
    if(password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    return false;
  }
};