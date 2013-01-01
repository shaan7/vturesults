
/*
 * GET users listing.
 */

exports.list = function(req, res){
  require('../dbhelper.js').listUsers(function(err, users) {
    if (err) { console.log('Error listing users: ' + err); res.send('There was an error'); return; }
    res.send(users);
  });
};

exports.register = function(req, res){
  req.assert('name', 'required').notEmpty();
  req.assert('email', 'required').isEmail();
  req.assert('usn', 'required').regex('([0-9]+[a-zA-Z]+){2}[0-9]+');

  var errors = req.validationErrors(true);
  if (errors) {
    res.render('index', {
      title: 'Welcome to VTU Results Instant Notification',
    });
    return;
  }

  objectToInsert = { name: req.body.name, email: req.body.email,
                      usn: req.body.usn };
  require('../dbhelper.js').addUser(objectToInsert, function(err) {
    if (err) {
      res.send('There was an error registering you. Please try again');
      return;
    }
  });
  res.render('message', {
    title: 'Thank you for registering',
    message: 'Thanks for registering. You will get an email with your results as soon as they\'re out'
  });
};