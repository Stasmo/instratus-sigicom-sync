const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csv = require('csv-parser');
const fs = require('fs');

exports.writeCsv = function(path, header, data) {

  const csvWriter = createCsvWriter({
    path,
    header,
    recordDelimiter: '\r\n',
  });

  return csvWriter.writeRecords(data);
};

exports.transformCsv = (path) => {
  const readStream = fs.createReadStream(path);
  const results = [];

  return new Promise((res, rej) => {
    readStream
    .pipe(csv())
    .on('data', (data) => {
      results.push({
        meastime: data['[Date]'],
        pointName: data['[Name]'],
        x: data['[Delta Easting][mm]'],
        y: data['[Delta Northing][mm]'],
        z: data['[Delta Elevation][mm]'],
      });
    })
    .on('end', () => {
      res(results);
    })
    .on('error', rej);
  });
}
