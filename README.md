# consentCatcher
A fork of Gutentag (https://github.com/analyticsftw/gutentag)

A suite of node.js scripts to:

* audit cookie collection on websites, with our without user consent,
* trace digtal marketing tags and related server calls

Results can be logged to CSV files for further processing.

## Scripts
* `cookies.js` : tracks cookies being dropped at the page load level, without any user interaction.
* `cookies_count.js` : same principle as `cookies.js`, just returns a number of cookies dropped, higher usually meaning less compliant with misc. privacy regulations
* `detect_landing.js` : scans landing pages and returns a pair of starting URL and resulting URL; ideal for redirect detection
* `gtmgascan.js` : listens for Google tags being fired (Google Analytics, Tag Manager, and more) [work in progress]
* `scan.js` : looks for cookies dropped without consent (much like `cookies.js`) then clicks the consent banner to record cookies placed after consent is given
* `support_functions.js` : provides... support functions to the various scripts, mostly formatting and file output functions

## Custom Runs
scan.js by default reads and scan the urls present in the spreadsheet: https://docs.google.com/spreadsheets/d/1VvSCITbbEWgFim0u75bzMydJh31bJxZDGkdyf7NPfTw

In order to run a custom scan over a list of specific urls, the arguments SheetId and SheetRange can be passed when executing the scan e.g.:

``` node scan.js 'sheetId' 'sheetRange' ```

``` node scan.js '1234567890' 'Sheet1!A:A' ``` 

- Using single quotes 'Sheet1!A:A' ensures that the shell treats the argument as a literal string and does not attempt to process ! as a special character.
- Include a header row in the spreadsheet, the scan process ignores the first row.
- Do not include https:// in the urls to scan

- The process uses a Service Account credentials to retrieve the data from the Spreadsheet so View access has to be granted to the following Service Account in the Google Sheet:

```
sa-diageo-consent-catcher@diageo-cookiebase.iam.gserviceaccount.com
```
