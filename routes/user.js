
/*
 * GET users listing.
 */

exports.list = function(req, res){
  require('../dbhelper.js').listUsers(function(err, users) {
    if (err) { console.log('Error listing users: ' + err); res.send('There was an error'); return; }
    res.send(users);
  });
};

var welcomeMailToUser = function(user, message) {
  var mailer=require('../mailer.js');
  mailer.sendMailToUser(user, "Thank you for registering", message, message, function(err, user) {
    if (err) { console.log('Could not send email to ' + user.email); return; }
  });
};

exports.register = function(req, res){
  req.assert('name', 'is required').notEmpty();
  req.assert('email', 'is invalid').isEmail();
  req.assert('email', 'is required').notEmpty();
  req.assert('usn', 'is invalid').regex('([0-9]+[a-zA-Z]+){2}[0-9]+');
  req.assert('usn', 'is required').notEmpty();
  var errors = req.validationErrors(true);
  if (errors) {
      console.log(errors);
    res.render('index', {
      title: 'Welcome to VTU Results Instant Notification',
      err: errors
    });
    return;
  }

 var user = { name: req.body.name, email: req.body.email,
                      usn: req.body.usn };
  require('../dbhelper.js').addUser(user, function(err) {
    if (err) {
      res.send('There was an error registering you. Please try again');
      return;
    }
  });

  welcomeMailToUser(user, 'Thanks for registering. You will receive an email with your results when they\'re out.');

  res.render('message', {
    title: 'Thank you for registering',
    message: 'Thanks for registering. You will get an email with your results as soon as they\'re out'
  });
};
