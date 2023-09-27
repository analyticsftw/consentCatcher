/** 
 * 
 * 
*/

// Dependencies
var sf = require('./support_functions.js');
const { chromium } = require('playwright');

// start URL
var myArgs = process.argv.slice(2);

myURL = myArgs[0] ? myArgs[0] : "https://mightyhive.com/";
filename = "headers.csv";
filename = myArgs[1] ?  myArgs[1] : filename;
console.log("Starting scan for " + myURL);
startTime = new Date();

// Launching browser, everything below this is async
(async () => {
  // Starting headless browser
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Configure the navigation timeout
  await page.setDefaultNavigationTimeout(0);
  // Navigate to the specified URL
  const resp = await page.goto(myURL);
  var rrr = page.on('response');
  console.log(rrr);
  
  // Google Tag Manager: look for data layer
  
  // Close headless browser after traffic stops
  await page.waitForLoadState('networkidle');
  var headers = resp.allHeaders();
  console.log(resp.request());
  var string_to_log = myURL+";"+headers;
  sf.logHit(filename,string_to_log);
  await browser.close();
  
  // Time calculation for performance reasons
  endTime = new Date();
  scanTime =  endTime - startTime;
  console.log("Scanned " + myURL + " in " + scanTime+ "s");
  
  //TODO update scan time

})();