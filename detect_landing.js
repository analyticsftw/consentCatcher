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
    async function get_status(r){
      //console.log(JSON.stringify(request.headersArray()));
      const req = await r;
      console.log("Request: " + req);
      const r_status = await req.status();
      const r_headers = await req.request();
      //console.log(r_headers);
      http_status.push(r_status);
      http_headers.push(r_headers);
      return r_status;
    }
    http_headers=[];
    http_status=[];
    const current_page = await page.goto(myURL);
    sf.logHit(filename,"Current page: "+JSON.stringify(current_page));
    
    const page_info = await page.waitForResponse(myURL);
    sf.logHit(filename,"Page info: "+JSON.stringify(page_info));

    console.log(page_info);
    //current_page.on("response", get_status);
    const real_url = page.url();
    await page.waitForLoadState('networkidle');
    await browser.close();
    sf.logHit(filename,myURL+","+real_url + ","+http_status);
  } catch (error) {
    //console.log(JSON.stringify(error));
    sf.logHit(filename,myURL+",,",error);
    await page.waitForLoadState('networkidle');
    await browser.close();
  }
  
  endTime = new Date();
  scanTime =  endTime - startTime;
  console.log("Scanned " + myURL + " in " + scanTime+ "s");
  //TODO update scan time

})();