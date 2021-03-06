var should       = require('chai').Should(),
    LdapStrategy = require('passport-ldapauth').Strategy,
    request      = require('supertest'),
    ldapserver   = require('./ldapserver'),
    appserver    = require('./appserver');

var LDAP_PORT = 1389;

var OPTS = {
  server: {
    url: 'ldap://localhost:' +  LDAP_PORT.toString(),
    adminDn: 'cn=root',
    adminPassword: 'secret',
    searchBase: 'ou=passport-ldapauth',
    searchFilter: '(uid={{username}})'
  }
},
TEST_OPTS = {
  no_callback: false
};

describe("LDAP authentication strategy", function() {
  var expressapp = null;

  before(function(cb) {
    ldapserver.start(LDAP_PORT, function() {
      appserver.start(OPTS, TEST_OPTS, function(app) {
        expressapp = app;
        cb();
      });
    });
  });

  after(function(cb) {
    appserver.close(function() {
      ldapserver.close(function() {
        cb();
      });
    });
  });

  it("should throw an error if no arguments not provided", function(cb) {
    (function() {
      new LdapStrategy();
    }).should.throw(Error);
    cb();
  });

  it("should throw an error if options are not provided", function(cb) {
    (function() {
      new LdapStrategy(function() {});
    }).should.throw(Error);
    cb();
  });

  it("should throw an error if options are not accepted by ldapauth", function(cb) {
    var s = new LdapStrategy({}, function() {});
    (function() {
      s.authenticate({body: {username: 'valid', password: 'valid'}});
    }).should.throw(Error);
    cb();
  });

  it("should initialize without a verify callback", function(cb) {
    (function() {
      new LdapStrategy(OPTS)
    }).should.not.throw(Error);
    cb();
  });

  it("should return unauthorized if credentials are not given", function(cb) {
    request(expressapp)
      .post('/login')
      .send({})
      .expect(401)
      .end(cb);
  });

  it("should allow access with valid credentials", function(cb) {
    request(expressapp)
      .post('/login')
      .send({username: 'valid', password: 'valid'})
      .expect(200)
      .end(cb);
  });

  it("should return unauthorized with invalid credentials", function(cb) {
    request(expressapp)
      .post('/login')
      .send({username: 'valid', password: 'invvalid'})
      .expect(401)
      .end(cb);
  });

  it("should return unauthorized with non-existing user", function(cb) {
    request(expressapp)
      .post('/login')
      .send({username: 'nonexisting', password: 'invvalid'})
      .expect(401)
      .end(cb);
  });

  it("should authenticate without a verify callback", function(cb) {
    TEST_OPTS.no_callback = true;
    appserver.start(OPTS, TEST_OPTS, function(app) {
      TEST_OPTS.no_callback = false
      request(expressapp)
        .post('/login')
        .send({username: 'valid', password: 'valid'})
        .expect(200)
        .end(cb);
    });
  });

  it("should reject invalid event without a verify callback", function(cb) {
    TEST_OPTS.no_callback = true;
    appserver.start(OPTS, TEST_OPTS, function(app) {
      TEST_OPTS.no_callback = false;
      request(expressapp)
        .post('/login')
        .send({username: 'valid', password: 'invalid'})
        .expect(401)
        .end(cb);
    });
  });

  it("should read given fields instead of defaults", function(cb) {
    OPTS.usernameField = 'ldapuname';
    OPTS.passwordField = 'ldappwd';
    OPTS.no_callback   = true;
    appserver.start(OPTS, TEST_OPTS, function(app) {
      OPTS.no_callback = false;
      request(expressapp)
        .post('/login')
        .send({ldapuname: 'valid', ldappwd: 'valid'})
        .expect(200)
        .end(function() {
          delete OPTS.usernameField;
          delete OPTS.passwordField;
          cb();
        });
    });
  });

  it("should pass request to verify callback if defined so", function(cb) {
    OPTS.passReqToCallback = true;
    var req = {body: {username: 'valid', password: 'valid', testkey: 1}},
        s   = new LdapStrategy(OPTS, function(req, user, done) {
          req.should.have.keys('body');
          req.body.should.have.keys(['username', 'password', 'testkey']);
          done(null, user);
        });

    s.success = function(user) {
      should.exist(user);
      user.uid.should.equal('valid');
      delete OPTS.passReqToCallback;
      cb();
    };

    s.authenticate(req);
  });

});
