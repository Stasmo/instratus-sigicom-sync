const Client = require('ftp');
const path = require('path');

exports.push = function(local, remote, ftpConfig) {
  return new Promise((res, rej) => {
    var c = new Client();
    c.on('ready', function() {
      c.mkdir(path.dirname(remote), true, (err) => {
        c.put(local, remote, function(err) {
          if (err) return rej(err);
          c.end();
        });
      });
    });
    c.on('error', rej);
    c.on('end', res);
    c.connect(ftpConfig);
  });
};
