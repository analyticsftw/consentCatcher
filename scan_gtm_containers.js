/**
 * node.js script that opens a headless browser and scans for cookies dropped without any user interaction
 *
 * Usage:
 *  node scan.js %URL% %outputfile%
 *  e.g.
 *  node scan.js https://www.mightyhive.com mightyhive.json
 */

/* Dependencies */
fs = require("fs");
var sf = require("./support_functions.js");

// start URL
// var myArgs = process.argv.slice(2);
// myURL = myArgs[0] ? myArgs[0] : "https://mightyhive.com/";


const customSheet = process.argv[2];
const sheetRange = process.argv[3];
console.log('Third argument:', customSheet);
console.log('Fourth argument:', sheetRange);

// filename = myArgs[1] ?  myArgs[1] : "mightyhive_cookies.csv";
//TODO: add support for passing start URL via command line or query string

// define browser type
const { chromium } = require("playwright");

// const newscan = "";
// console.log("Starting scan for " + myURL);
// startTime = new Date();

// Launching browser, everything below this is async
(async () => {

  filename = "diageo_cookies.csv";
  errorsFilename = "diageo_cookies_errors.csv";
  //google_authentication authenticates to spreadsheet and returns payload:  google_sheets_read(sheet_id, range)
  let sheet_data;
  try {
    if(customSheet && sheetRange){
      sheet_data = await sf.google_sheets_read(
        customSheet,
        sheetRange
      )
    }else{
      sheet_data = await sf.google_sheets_read(
        "1VvSCITbbEWgFim0u75bzMydJh31bJxZDGkdyf7NPfTw",
        "allsites!A:A"
      )
    }
      }catch (error) {
        console.error("An error occurred:", error.message);
        sf.error2csv(errorsFilename, myURL, error.message);
    }

  // const rows = sheet_data.data.values;
  let urlsList = [];
  if (sheet_data.length) {
    // loop through column value skipping first row
    sheet_data.slice(1).forEach((row) => {
      urlsList.push(row[0]);
      console.log(row[0])
    });
  } else {
    console.log("No data found.");
  }

  // custom_scan_loop = ["www.seedlipdrinks.co.za"]

  // let browser, page, context;
  // for (let myURL of custom_scan_loop){

  for (let myURL of urlsList) {
    try {
      let cookieSource = []
      const newscan = "";
      console.log("Starting scan for " + myURL);
      startTime = new Date();

      browser = await chromium.launch({
        headless: true,
        // open devtools:
        // args: ['--auto-open-devtools-for-tabs']
      });

      context = await browser.newContext({
        ignoreHTTPSErrors: true,
        timeout: 10000,
      });
      page = await context.newPage();
    
      const navigationTimeout = 8000; // Adjust based on expected navigation time

      const redirectUrls = [];

      // Listen to response events
      page.on('response', response => {
        // Check if the response status code indicates a redirect
        if (response.status() >= 300 && response.status() <= 399) {
          // Get the 'location' header to find out the redirect target URL
          const location = response.headers()['location'];
          if (location) {
            redirectUrls.push(location);
            console.log('Redirected to:', location);
          }
        }
      });


      await page.goto(`http://${myURL}`);
      console.log(page.url())

      try{
        await page.waitForLoadState("networkidle");
      } catch (error) {
        console.error("An error occurred:", error.message);
        sf.error2csv(errorsFilename, myURL, error.message);
      }

      await page.waitForTimeout(3000);
      const navigationPromiseOT = page.waitForNavigation().catch(e => e);
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds timeout
      // check for OT consent:
      try{
        await page.click("#onetrust-accept-btn-handler");
        await Promise.race([navigationPromiseOT, timeoutPromise]);
      } catch (error) {
        console.error("An error occurred:", error.message);
      }

      await page.waitForTimeout(5000);
      const gtmKeys = await page.evaluate(() => {
        const keys = Object.keys(window.google_tag_manager || {});
        return keys.filter(key => key.startsWith('GTM-')).join(' | ');
      });
      
      console.log('printing containers')
      console.log(gtmKeys);
      sf.param2csv("gtm_containers.csv", myURL, page.url(), gtmKeys)

      await page.waitForTimeout(5000);

    } catch (error) {
      console.error("An error occurred:", error.message);
      sf.param2csv("gtm_containers.csv", myURL, page.url(), ["The site is not loading"])
      sf.error2csv(errorsFilename, myURL, error.message);
    } finally {
      if (browser) {
        await page.close();
        await context.close();
        await browser.close();
      }
    }
  }
})();
