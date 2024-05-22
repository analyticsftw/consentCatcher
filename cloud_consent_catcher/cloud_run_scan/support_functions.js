/** Support functions for the gutentag project repository
 *
*/

// for when you have to reference imported function *within* the import
var internal = module.exports = {
  addQuotes,
  logHit,
  hit2csv
};

/* FUNCTION DEFINITION */


/** Add quotes to string, esp. for CSVs/text lines
 * @param  {} string : the string being passed
 * @param  {} quote : quote delimiter character, defaults to double quote '"'
 */
 function addQuotes(string, quote='"'){
  var msg = quote + string + quote;
  return msg;
}


/**
 * cookie2csv: function to write message to file
 * @param {*} cookie
 * @param {*} filename
 * @param {*} phase
 */
   function cookie2csv  (cookie,filename,phase="phase_undefined") {
    const { Parser } = require('json2csv');
    const fields = [
      'date',
      'siteURL',
      'phase',
      'sameSite',
      'name',
      'value',
      'domain',
      'path',
      'expires',
      'httpOnly',
      'secure',
    ];
    const opts = { fields };

    // Inject cookie timestamp
    // callTime = Date.now();
    const now = new Date();
    const callTime = now.toISOString();

    var cl = 0; 
    cl = cookie.length;
    for (i = 0; i < cl; i++) {
      cookie[i].date=callTime;
      cookie[i].phase=phase;
    }
    try {
      const parser = new Parser(opts);
      const csv = parser.parse(cookies)
      // remove headers, remove one line, starting at the first position, then join the array back into a single string
      var lines = csv.split('\n');
      lines.splice(0,1);
      var output = lines.join('\n');
      // Write to file
      internal.logHit(filename,output)
    } catch (err) {
      console.error(err);
    }
  }

  function param2csv (filename, orignalURL, siteURL, param){
    const { Parser } = require('json2csv');
    const fields = [
      'date',
      'initial_url',
      'redirected_url',
      'parameter'
    ]
    const opts = { fields };
    const now = new Date();
    const callTime = now.toISOString();
    message = [addQuotes(callTime), addQuotes(orignalURL), addQuotes(siteURL), addQuotes(param)]
    try {
      internal.logHit(filename,message);
    } catch (err) {
      console.error(err);
    }
  }


/** function to log each server call routed from playwright to CSV, assuming it matches the list of predefined tags
 * @param  {} hit : the server call payload
 * @param  {} filename : the output file
 * @param  {} site : the URL being analyzed
 */
 function hit2csv(hit,filename,site){
  addquotes = internal.addQuotes();
  // Create timestamp for each call
  callTime = Date.now();
  // Sanitize inputs
  message = [addQuotes(callTime),addQuotes(site),addQuotes(hit)];
  line = message.join(";");
  // Log each call to CSV
  try {
    internal.logHit(filename,line);
  } catch (err) {
    console.error(err);
  }
}


/** function to log each server call routed from playwright to CSV, assuming it matches the list of predefined tags
 * @param  {} hit : the server call payload
 * @param  {} filename : the output file
 * @param  {} site : the URL being analyzed
 */
function error2csv(filename,url, errorMessage){
  const now = new Date();
  const callTime = now.toISOString();
  try {
    //removes commas and quotes from error message
    cleanError = errorMessage.replace(/,|"/g, '');
    // console.log('cleanError: ' + cleanError)
    //splits up error into lines
    const errorLines = cleanError.split('\n');
    //selects most useful lines and removes any quotes and commas
    const errorLineOne = errorLines[0];
    //error line two is not always available
    const errorLineTwo = errorLines[2] ? errorLines[2] : '';
    // Add quotes to strings
    const errorData = [callTime, addQuotes(url), addQuotes(errorLineOne), addQuotes(errorLineTwo)];
    const errorLine = errorData.join(',') + '\n';
    fs.appendFile(filename, errorLine, (err) => {
      if(err) throw err;
      console.log('Line appended to ' + filename);
    });
 } catch (err) {
   console.error(err);
 }
}

function source2csv(filename, sources){
  const { Parser } = require('json2csv');
  const newLine = '\r\n';
  const fields = ['site_scanned', 'cookie_siteURL', 'cookie_name', 'cookie_sources'];

  // Add the additional parameter to each source object
  // const updatedSources = sources.map(source => ({
  //   ...source,
  //   cookie_siteURL: siteURL
  // }));

  const json2csvParser = new Parser({ fields, header: false });
  const csv = json2csvParser.parse(sources) + newLine;

  try {
    fs.appendFileSync(filename, csv);
    console.log('Data was appended to file!');
  } catch (error) {
    console.error('Error appending data to file:', error);
  }
}


/**
 * logHit: function to write message to file
 * @param {*} file
 * @param {*} message
 */
function logHit (file, message) {
  const fs = require('fs');
  fs.appendFile(file, message+"\n", function (err) {
  // fs.appendFile(file, message, function (err) {
    if (err) {throw err; console.log(err);};
  });
}


async function getSecret(secretName){
  const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
  const client = new SecretManagerServiceClient();

  const [secret] = await client.accessSecretVersion({
    name: secretName,
  });
  // Extract the secret payload as a string
  const payloadString = secret.payload.data.toString('utf8');
  // Parse the payload string into a JSON object
  const payloadJson = JSON.parse(payloadString);

  return payloadJson
}


async function google_sheets_read (sheetId, range){
  const { google } = require('googleapis');
  const { auth } = require('google-auth-library');


  const keys = await getSecret('projects/191126329179/secrets/consent_catcher/versions/1');
  const client = auth.fromJSON(keys);
  client.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

  const sheets = google.sheets({ version: 'v4', auth: client });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,  // Update this range based on your sheet.
  });

  const rows = response.data.values;

  return rows

}

async function appendToBigQuery(datasetId, tableId, filename){
  console.log("appending " + filename)
  const { BigQuery } = require('@google-cloud/bigquery');
  const bigquery = new BigQuery(await getSecret('projects/191126329179/secrets/consent_catcher/versions/1'), { projectId: 'your-project-id' });

  async function loadCSVData() {
    const metadata = {
      sourceFormat: 'CSV',
      skipLeadingRows: 0,
      autodetect: false,
      writeDisposition: 'WRITE_APPEND',  // Append data to existing table
    };

    // Load CSV file into BigQuery
    const [job] = await bigquery
      .dataset(datasetId)
      .table(tableId)
      .load(filename, metadata);

    // Check the job's status for errors
    const errors = job.status.errors;
    if (errors && errors.length > 0) {
      throw new Error('BigQuery job failed');
    }
    console.log(filename + ' loaded successfully.');
  }

  loadCSVData().catch(console.error);

}


/** Export functions
  * Make sure to reference in other scripts as:
  * `const sf = require('./support_functions.js');`

  * Then change references to functions as (for instance):
  `sf.cookie2csv($args)`
*/
module.exports = {
  addQuotes,
  cookie2csv,
  hit2csv,
  logHit,
  google_sheets_read,
  error2csv,
  source2csv,
  appendToBigQuery,
  param2csv
}

