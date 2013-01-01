
/**
 * Module dependencies.
 */

var ipaddress = ''
var port = 0

setupVariables = function() {
    //  Set the environment variables we need.
    ipaddress = process.env.OPENSHIFT_INTERNAL_IP;
    port      = process.env.OPENSHIFT_INTERNAL_PORT || 8080;

    if (typeof ipaddress === "undefined") {
        //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
        //  allows us to run/test the app locally.
        console.warn('No OPENSHIFT_INTERNAL_IP var, using 127.0.0.1');
        ipaddress = "127.0.0.1";
    };
};

var emailResultToUser = function(user, result) {
  var mailer=require('./mailer.js');
  mailer.sendMailToUser(user, "VTU Results", result, result, function(err, user) {
    if (err) { console.log('Could not send email to ' + user.email); return; }
    require('./dbhelper.js').disableUser(user, function(err) {
      if (err) console.log('WARNING: Could not disable user ' + user.email);
    });
  });
}

var getResultForUser = function(user) {
  require('request').post(
    {
      uri: 'http://results.vtu.ac.in/vitavi.php',
      form: {
        rid: user.usn,
        submit: 'SUBMIT'
      }
    }, function(err, res, body) {
      if (!err && res.statusCode == 200) {
        if (body.indexOf('Total Marks') != -1) {
          console.log('YES ' + user.name);
          emailResultToUser(user, body);
        } else {
          console.log('NO ' + user.name);
        }
      }
    }
  );
};

var checkForResults = function() {
  require('./dbhelper.js').listUsers(function(err, users) {
    if (err) { console.log('Could not list users: ' + err); return; }
    require('async').forEach(users, function(user, callbackOnFinish) {
      getResultForUser(user);
      callbackOnFinish();
    });
  });
};

var express = require('express')
  , expressValidator = require('express-validator')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('ipaddress', process.env.OPENSHIFT_INTERNAL_IP || '127.0.0.1');
  app.set('port', process.env.OPENSHIFT_INTERNAL_PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(expressValidator);
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/register', user.register);
app.all('/*', function(req, res){
    res.redirect('/');
});

http.createServer(app).listen(app.get('port'), app.get('ipaddress'), function(){
  setInterval(checkForResults, 60000);
  console.log("Express server listening on port " + app.get('port'));
});
