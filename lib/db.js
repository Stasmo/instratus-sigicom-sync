const region = 'ca-central-1';
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({ region });
const db = new AWS.DynamoDB.DocumentClient(
  { service: dynamodb, convertEmptyValues: true }
);

async function sendData(data, table) {
  console.debug(`Sending ${data.length} items.`);

  const formatted = data.map(item => ({
    PutRequest: { Item: item },
  }));

  while (formatted.length) {
    const chunk = formatted.splice(0, Math.min(25, formatted.length));

    const results = await db.batchWrite({
      RequestItems: {
        [table]: chunk
      }
    }).promise();
    if (results.UnprocessedItems && Object.values(results.UnprocessedItems).length) {
      console.log(`Unprocessed: ${results.UnprocessedItems}`);
      formatted.push(...results.UnprocessedItems);
    }
  }
}

module.exports = {
  sendData,
};
