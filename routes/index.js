
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {
      title: 'Welcome to VTU Results Instant Notification',
      registered_user_count: req.registered_user_count,
      backup_user_count: req.backup_user_count
  });
};