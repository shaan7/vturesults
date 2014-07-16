exports.sendMail = function(sendTo, messageSubject, messageText, messageHtml, callback) {
  var nodemailer = require('nodemailer');
  var config = require('./data/config.js');

  // Create a Sendmail transport object
  var transport = nodemailer.createTransport("Mailgun", {
    auth: {
      user: config.sendgrid.username,
      pass: config.sendgrid.password
    }
  });

  // Message object
  var message = {
      from: config.sendgrid.from,
      cc: config.sendgrid.cc,
      // Comma separated list of recipients
      to: sendTo,
      // Subject of the message
      subject: messageSubject,
      // plaintext body
      text: messageText,
      // HTML body
      html: messageHtml
  };

  transport.sendMail(message, function(error){
      if(error){
          if (typeof callback == "function") {
            callback(error, sendTo);
          } else {
            console.log('Error occured while sending email ' + error.message);
          }
          return;
      }
      console.log('Email sent to ' + sendTo + ' successfully');
      callback(false, sendTo);
  });
};

exports.sendMailToUser = function(user, messageSubject, messageText, messageHtml, callback) {
  exports.sendMail(user.email, messageSubject, messageText, messageHtml, function(error, email) {
    callback(error, user);
  });
}
