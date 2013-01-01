
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Welcome to VTU Results Instant Notification' });
};