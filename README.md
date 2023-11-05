Sigicom Sync
===

This lambda function pulls data from Sigicom API and pushes it to a FTP server as a CSV.

# Environment Variables

| name                | purpose                                            |
|---------------------|----------------------------------------------------|
| FAILURE_TOPIC_ARN   | Message this SNS topic when the sync fails         |

# Function event parameters

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
| start               | (Optional) The start date of the search, as unix or ISO8601      | end - searchOffsetInSeconds |
| end                 | (Optional) The end date of the search, as unix or ISO8601        | now                         |
| searchOffsetSeconds | (Optional) How far back to search                                | 3600                        |


# Backfilling

For backfilling data, head over to the lambda function in AWS and to the test tab.

To pull data from a specific time period, use the start and end parameters.

```
{
  "apiToken": "",
  "username": "user:30296",
  "baseUrl": "https://instratus.infralogin.com",
  "devices": [
    {
      "type": "A12"
      "serial": 34000
    }
  ],
  "ftpHost": "data.instratus.ca",
  "ftpUser": "dion",
  "ftpPass": "",
  "ftpPath": "/A12/34000"
  "start": "2023-01-29T00:00:00",
  "end": "2023-02-01T00:00:00"
}
```
