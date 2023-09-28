/**
 * node.js script that opens a headless browser and scans for cookies dropped without any user interaction
 * 
 * Usage:
 *  node scan.js %URL% %outputfile%
 *  e.g.
 *  node scan.js https://www.mightyhive.com mightyhive.json
*/


/* Dependencies */
const fs = require('fs')
const sf = require('./support_functions.js');

// start URL
var myArgs = process.argv.slice(2);
myURL = myArgs[0] ? myArgs[0] : "https://mightyhive.com/";
filename = myArgs[1] ?  myArgs[1] : "outputs/diageo_allsites.csv";
//TODO: add support for passing start URL via command line or query string

//define browser type 
const {chromium} = require('playwright');

const newscan = "";
console.log("Starting scan for " + myURL);
startTime = new Date();

// Launching browser, everything below this is async
(async () => {
  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({ignoreHTTPSErrors:true});
  const page = await context.newPage();

  try{
    await page.goto(myURL);
    function get_status(response){
      return response.status;
    }
    http_status = page.on("response", get_status);
    const real_url = page.url();
    await page.waitForLoadState('networkidle');
    await browser.close();
    sf.logHit(filename,myURL+","+real_url + ","+http_status);
  } catch (error) {
    console.log('***********');
    console.log(error);
    
    if (error instanceof chromium.errors.TimeoutError){
      sf.logHit(filename,myURL+",,timeout");
    }
    
  }
  
  endTime = new Date();
  scanTime =  endTime - startTime;
  console.log("Scanned " + myURL + " in " + scanTime+ "s");
  //TODO update scan time

})();