/** 
 * 
 * 
*/

// Dependencies
var sf = require('./support_functions.js');
const { chromium } = require('playwright');

// start URL
var myArgs = process.argv.slice(2);
myURL = myArgs[0] ? myArgs[0] : "https://juliencoquet.com/";
filename = myArgs[1] ?  myArgs[1] : "routes.csv";

console.log("Starting scan for " + myURL);
startTime = new Date();

// Launching browser, everything below this is async
(async () => {
  // Starting headless browser
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log and continue all network requests
  var lf="";
  page.route('**', route => {
    const request = route.request();
    var rs = request.url();
    sf.hit2csv(rs,filename,myURL);
    return route.continue();
  });

  // Navigate to the specified URL
  try{
    await page.goto(myURL);
  } catch (e) {
    sf.hit2csv("Error: "+e.name,filename,myURL); 
  }
  

  // Close headless browser after traffic stops
  await page.waitForLoadState('networkidle');
  await browser.close();
  
  // Time calculation for performance reasons
  endTime = new Date();
  scanTime =  endTime - startTime;
  console.log("Scanned " + myURL + " in " + scanTime+ "s");
  
  //TODO update scan time

})();