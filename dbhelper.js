var mongourl = process.env.OPENSHIFT_MONGODB_DB_URL + process.env.OPENSHIFT_APP_NAME;
//var mongourl = "mongodb://mongodb:@localhost/test";
var usersCollection = 'users';
var usersHistoryCollection = 'usershistory';
var db = require('mongojs').connect(mongourl, [usersCollection, usersHistoryCollection]);

var errorHandler = function(err, callback) {
  if (err) { if (typeof callback == "function") callback(err); return; }
};

exports.addRecord = function(user, collection, callback) {
  var objectToInsert = { name: user.name, email: user.email,
                      usn: user.usn };
  db.users.insert( objectToInsert, function(err) { errorHandler(err, callback) });
};

exports.removeRecord = function(user, collection, callback) {
  var objectToRemove = { name: user.name, email: user.email,
                      usn: user.usn };
  db.users.remove( objectToRemove, function(err) { errorHandler(err, callback) });
};

exports.listRecords = function(collection, callback) {
  db.users.find().toArray(function(err, results) {
    callback(err, results);
  });
};

exports.listUsers = function(callback) {
  exports.listRecords(usersCollection, callback);
};

exports.addUser = function(user, callback) {
  exports.addRecord(user, usersCollection, callback);
};

exports.removeUser = function(user, callback) {
  exports.removeRecord(user, usersCollection, callback);
};

exports.backupUser = function(user, callback) {
  var objectToInsert = { name: user.name, email: user.email,
                      usn: user.usn };
  db.usershistory.insert( objectToInsert, function(err) { errorHandler(err, callback) });
};

exports.disableUser = function(user, callback) {
  exports.backupUser(user);
  exports.removeUser(user, function(err) { errorHandler(err, callback) });
};
