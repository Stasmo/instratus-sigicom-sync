const format = require('./utils/format');
const csv = require('./lib/csv');
const path = require('path');
const ftp = require('./lib/ftp');
const fs = require('fs');
const buildClient = require('./lib/sigicom');
const snsFailureSnsTopic = process.env.FAILURE_TOPIC_ARN;
const AWS = require('aws-sdk');

// Push raw data for troubleshooting
const s3 = new AWS.S3();

exports.c50Handler = async (event) => {
  const rawDataBucket = process.env.RAW_DATA_BUCKET_NAME;
  const {
    baseUrl,
    username,
    apiToken,
    devices,
    ftpHost,
    ftpPass,
    ftpPath,
    ftpUser,
    searchOffsetSeconds = 3600,
    start,
    end,
    pushRawData,
  } = event;

  try {
    const sigicomClient = buildClient({
      baseURL: baseUrl,
      apiUser: username,
      apiToken: apiToken,
    });

    const ftpConfig = {
      host: ftpHost,
      password: ftpPass,
      user: ftpUser,
    };

    const to = end || Date.now();
    const from = start || (to - (searchOffsetSeconds * 1000));
    const deviceSerials = devices.map(d => d.serial)

    console.log(`Getting data for C50 devices ${deviceSerials.join(', ')} from ${new Date(from)} to ${new Date(to)}`);

    const searchData = await sigicomClient.getDataForDevices(
      new Date(from),
      new Date(to),
      devices,
      ["interval", "transient"]
    );

    const pushDate = Date.now();

    if (pushRawData) {
      if (!rawDataBucket) {
        console.error('Tried to push raw data but no bucket configured.');
      } else {
        console.log('Pushing raw data to s3.')
        await s3.putObject({
          Bucket: rawDataBucket,
          Key: `c50/${deviceSerials.join('_')}/raw-${pushDate}.json`,
          Body: JSON.stringify(searchData)
        }).promise();
      }
    }

    const data = format.formatData(searchData, true);
    const { intervals, transients } = data;

    if (!intervals.length) {
      console.error(`No interval data retrieved`)
      return;
    }

    const timestamp = new Date().toISOString();
    const outfile = `/tmp/out-${timestamp}.csv`;
    const remotePath = path.join(ftpPath, `intervals-${pushDate}.csv`);

    const headers = ['datetime', 'serial', 'label', 'max'].map(i => ({ id: i, title: i }));

    await csv.writeCsv(
      outfile,
      headers,
      intervals,
    );

    console.log('Pushing to', remotePath);
    await ftp.push(outfile, remotePath, ftpConfig);

    fs.unlinkSync(outfile);

  } catch(e) {
    if (snsFailureSnsTopic) {
      const params = {
        Message: `Sigicom to instratus FTP sync failed for devices ${deviceSerials.join(', ')}: ${e}`,
        TopicArn: snsFailureSnsTopic,
      };
      await new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
    }
    throw e;
  }
}

exports.handler = async (event) => {
  const {
    baseUrl,
    username,
    apiToken,
    devices,
    ftpHost,
    ftpPass,
    ftpPath,
    ftpUser,
    searchOffsetSeconds = 3600,
    start,
    end,
  } = event;

  try {
    const sigicomClient = buildClient({
      baseURL: baseUrl,
      apiUser: username,
      apiToken: apiToken,
    });

    const ftpConfig = {
      host: ftpHost,
      password: ftpPass,
      user: ftpUser,
    };

    const to = end || Date.now();
    const from = start || (to - (searchOffsetSeconds * 1000));

    console.log(`Getting data for devices ${devices} from ${new Date(from)} to ${new Date(to)}`);

    const searchData = await sigicomClient.getDataForDevices(
      new Date(from),
      new Date(to),
      devices,
      ["interval", "transient"]
    );

    const data = format.formatData(searchData);
    const { intervals, transients } = data;

    if (!intervals.length) {
      console.error(`No interval data retrieved`)
    }

    const timestamp = new Date().toISOString();
    const outfile = `/tmp/out-${timestamp}.csv`;
    const remotePath = path.join(ftpPath, `intervals-${Date.now()}.csv`);

    await csv.writeCsv(
      outfile,
      Object.keys(intervals[0]).map(k => ({ id: k, title: k })),
      intervals,
    );

    console.log('Pushing to', remotePath);
    await ftp.push(outfile, remotePath, ftpConfig);

    fs.unlinkSync(outfile);

  } catch(e) {
    if (snsFailureSnsTopic) {
      const params = {
        Message: `Sigicom to instratus FTP sync failed for devices ${devices.map(d => d.serial).join(',')}: ${e}`,
        TopicArn: snsFailureSnsTopic,
      };
      await new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();
    }
    throw e;
  }
}

if (process.env.LOCAL_DEV) {
  process.env.ENVIRONMENT_NAME = 'dev';
  process.env.RAW_DATA_BUCKET_NAME = 'raw-sigicom-data';
  exports.c50Handler({
    devices: [
      {
        type: 'C50',
        serial: 116788,
      },
    ],
    apiToken: process.env.SIGICOM_API_TOKEN,
    baseUrl: process.env.SIGICOM_BASE_URL,
    username: process.env.SIGICOM_API_USER,
    ftpHost: process.env.DATAGLANCE_FTP_HOST,
    ftpPass: process.env.DATAGLANCE_FTP_PASS,
    ftpPath: '/test',
    ftpUser: process.env.DATAGLANCE_FTP_USER,
    pushRawData: true,
  });
}
