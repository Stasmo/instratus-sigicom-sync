Sigicom Sync
===

This lambda function searches for data from Sigicom API and pushes it to a FTP server as a CSV.
The lambda creates a search in the Sigicom API, waits for the search to complete, then pulls the data.
It creates a local CSV file with all the data in it, then pushes to the file to the FTP server.

# Environment Variables

| name                | purpose                                            |
|---------------------|----------------------------------------------------|
| FAILURE_TOPIC_ARN   | Message this SNS topic when the sync fails         |

# Function event parameters

By default, the lambda will search for the last hour of data. To extend that beyond an hour,
set the `searchOffsetSeconds` to something higher than 3600.

You can set `searchOffsetSeconds` to something lower than 3600, but the Sigicom API will
return the last hour of data at minimum.

To search a specific time period, use the `start` and `end` event parameters. When the
`start` parameter is used, `searchOffsetSeconds` is ignored.

If `end` is not set, the function will default to the current time as the upper bound for the data search.

| name                | purpose                                                          | default                     |
|---------------------|------------------------------------------------------------------|-----------------------------|
| apiToken            | The Sigicom API token                                            |                             |
| baseUrl             | The Sigicom base URL                                             |                             |
| devices             | A JSON array of objects containing a type:string and serial:int. |                             |
| ftpHost             | The hostname of the FTP server                                   |                             |
| ftpPass             | The password for FTP access                                      |                             |
| ftpPath             | The path within the FTP server to save the file.                 |                             |
| ftpUser             | The FTP user name.                                               |                             |
| username            | The Sigicom user name.                                           |                             |
| start               | (Optional) The start date of the search, as unix or ISO8601      | end - searchOffsetSeconds   |
| end                 | (Optional) The end date of the search, as unix or ISO8601        | now                         |
| searchOffsetSeconds | (Optional) How far back to search                                | 3600                        |


# Backfilling

For backfilling data, head over to the lambda function in AWS and to the test tab.

To pull data from a specific time period, use the start and end parameters.

```JSON
{
  "apiToken": "",
  "username": "user:30296",
  "baseUrl": "https://instratus.infralogin.com",
  "devices": [
    {
      "type": "A12",
      "serial": 34000
    }
  ],
  "ftpHost": "data.instratus.ca",
  "ftpUser": "dion",
  "ftpPass": "",
  "ftpPath": "/A12/34000",
  "start": "2023-01-29T00:00:00",
  "end": "2023-02-01T00:00:00"
}
```
