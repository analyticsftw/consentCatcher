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
filename = myArgs[1] ?  myArgs[1] : "onetrust.csv";

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
    if (rs != "undefined") {
      // List of identified server calls to monitor and log
      hitdomains = [
        // OneTrust
        "cookielaw",
        "onetrust"
      ];
      var j=0;
      lf = "Lib not found";
      for (var i=0;i<hitdomains.length;i++){
        // If request found in list, log the call
        if (rs.indexOf(hitdomains[i])!==-1){
          lf = "Lib found";
          j++;
          sf.hit2csv(rs,'ot_dump.csv',myURL);
        }
      }
      
    }
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
  try {
    var ot = await page.evaluate(() => OneTrust);
    var of = ot !== undefined ? "OT found" : "OT not found";
  } catch (e) {
    var of = "Error detecting OneTrust";
  }
  await browser.close();
  sf.hit2csv(of,filename,myURL); 
  
  // Time calculation for performance reasons
  endTime = new Date();
  scanTime =  endTime - startTime;
  console.log("Scanned " + myURL + " in " + scanTime+ "s");
  
  //TODO update scan time

})();