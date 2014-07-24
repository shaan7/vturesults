/**
 * Module dependencies.
 */

var vtuHiddenFormParam = '';
var vtuHiddenFormValue = '';

var emailResultToUser = function(user, result) {
  var mailer=require('./mailer.js');
  mailer.sendMailToUser(user, "VTU Results", result, result, function(err, user) {
    if (err) { console.log('Could not send email to ' + user.email); return; }
    require('./dbhelper.js').disableUser(user, function(err) {
      if (err) console.log('WARNING: Could not disable user ' + user.email);
    });
  });
}

var userString = function(user) {
    return user.name + ' ' + user.usn + ' ' + user.email;
}

var fetchVtuHiddenFormParam = function() {
    console.log('Attempting to get hidden params');
    require('request').get('http://results.vtu.ac.in', function (error, response, body) {
      if (!error && response.statusCode == 200) {
          var regex = /<input type="hidden.*name="(.*)".*value="(.*)">/g,
              match;
          while ((match = regex.exec(body)) != null) {
            console.log('Matched ' + match[1] + ' ' + match[2]);
            vtuHiddenFormParam = match[1];
            vtuHiddenFormValue = match[2];
          }
      } else {
        console.log("Error when trying to get hidden params");
      }
    });
}

var getResultForUser = function(user) {
  var formData = {
    'rid': user.usn,
    'submit': 'SUBMIT',
  };
  formData[vtuHiddenFormParam] = vtuHiddenFormValue;

  require('request').post(
    {
      uri: 'http://results.vtu.ac.in/vitavi.php',
      form: formData
    }, function(err, res, body) {
      if (err) {
          console.log('Error when checking results for ' + userString(user));
          console.dir(err);
      } else if (res.statusCode == 200) {
        if (body.indexOf('Subject') != -1) {
          console.log('Got the results for ' + userString(user));
          emailResultToUser(user, body);
        } else {
          console.log('No results for ' + userString(user));
        }
      } else if (res.statusCode == 400) {
          console.log('VTU Hidden form param seems to be invalid, fetching again...');
          fetchVtuHiddenFormParam();
      } else {
          console.log('Unknown statusCode when checking results for ' + userString(user));
          console.dir(err);
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
  app.set('ipaddress', process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1');
  app.set('port', process.env.OPENSHIFT_NODEJS_PORT || 8000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(expressValidator());
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
  fetchVtuHiddenFormParam();
  setInterval(checkForResults, 60000);
  console.log("Express server listening on " + app.get('ipaddress') + ":" + app.get('port'));
});
