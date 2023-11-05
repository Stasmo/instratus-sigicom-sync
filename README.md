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
