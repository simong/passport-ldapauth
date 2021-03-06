# passport-ldapauth

[Passport](http://passportjs.org/) authentication strategy against LDAP server. This module is a Passport strategy wrapper for [node-ldapauth](https://github.com/trentm/node-ldapauth)

## Usage

```javascript
var LdapStrategy = require('passport-ldapauth').Strategy;

passport.use(new LdapStrategy({
    server: {
      url: 'ldap://localhost:389',
      ...
    }
  }));
```

If you wish to e.g. do some additional verification or initialize user data to local database you may supply a `verify` callback which accepts `user` object and then calls the `done` callback supplying a `user`, which should be set to `false` if user is not allowed to authenticate. If an exception occured, `err` should be set.

```javascript
var LdapStrategy = require('passport-ldapauth').Strategy;

passport.use(new LdapStrategy({
    server: {
      url: 'ldap://localhost:389',
      ...
    }
  },
  function(user, done) {
    ...
    return done(null, user);
  }
));
```

## Install

```
npm install passport-ldapauth
```

## Status

[![Build Status](https://travis-ci.org/vesse/passport-ldapauth.png)](https://travis-ci.org/vesse/passport-ldapauth)
[![Dependency Status](https://gemnasium.com/vesse/passport-ldapauth.png)](https://gemnasium.com/vesse/passport-ldapauth)

## Configuration options

* `server`: LDAP settings. These are passed directly to [node-ldapauth](https://github.com/trentm/node-ldapauth)
    * `url`: e.g. `ldap://localhost:389`
    * `adminDN`: e.g. `cn='root'`
    * `adminPassword`: Password for adminDN
    * `searchBase`: e.g. `o=users,o=example.com`
    * `searchFilter`:  LDAP search filter, e.g. `(uid={{username}})`. Use literal `{{username}}` to have the given username used in the search.
* `usernameField`: Field name where the username is found, defaults to _username_
* `passwordField`: Field name where the password is found, defaults to _password_
* `passReqToCallback`: When `true`, `req` is the first argument to the verify callback (default: `false`):

        passport.use(new LdapStrategy(..., function(req, user, done) {
            ...
            done(null, user);
          }
        ));

## Express example

```javascript
var express      = require('express'),
    passport     = require('passport'),
    LdapStrategy = require('passport-ldapauth').Strategy;

var OPTS = {
  server: {
    url: 'ldap://localhost:389',
    adminDn: 'cn=root',
    adminPassword: 'secret',
    searchBase: 'ou=passport-ldapauth',
    searchFilter: '(uid={{username}})'
  }
};

var app = express();

passport.serializeUser(function(user, cb) {
  return cb(null, user.dn.toString());
});

passport.use(new LdapStrategy(OPTS));

app.configure(function() {
  app.use(express.bodyParser());
  app.use(passport.initialize());
});

app.post('/login', passport.authenticate('ldapauth'), function(req, res) {
  res.send({status: 'ok'});
});
```

## License

MIT
