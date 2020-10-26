const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const localStrategy = require('passport-local').Strategy;

const passportMain = (passport) => {
  passport.use(new localStrategy((username, password, done) => {
    User.findOne({ username }, (err, user) => {
      if(err) return done(err);
      if(!user) return done(null, false, { message: 'Incorrect username and password combination' });
      bcrypt.compare(password, user.password, (err, bool) => {
        if(err) throw err;
        if(!bool) return done(null, false, { message: 'Incorrect username and password combination' });
        return done(null, user);
      })
    })
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    })
  });
};

module.exports = passportMain;