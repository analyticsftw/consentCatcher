/**
 * node.js script that opens a headless browser and scans for cookies dropped without any user interaction
 *
 * Usage:
 *  node scan.js %URL% %outputfile%
 *  e.g.
 *  node scan.js https://www.mightyhive.com mightyhive.json
*/





/* Dependencies */
fs = require('fs')
var sf = require('./support_functions.js');





// async function readGoogleSheet() {


//   //google_authentication authenticates to spreadsheet and returns payload:  google_sheets_read(sheet_id, range)
//   sheet_data =  await sf.google_sheets_read('1VvSCITbbEWgFim0u75bzMydJh31bJxZDGkdyf7NPfTw', 'allsites!A:A');
//   // const rows = sheet_data.data.values;
//   let urls_list = []
//   if (sheet_data.length) {

//     // loop through column value skipping first row
//     sheet_data.slice(1).forEach((row) => {
//       urls_list.push(row[0])
//       console.log(row[0])
//     });
//     // console.log('Data read from sheet:');
//     // rows.map((row) => {
//     //   console.log(`${row.join(', ')}`);
//     // });˚
//   } else {
//     console.log('No data found.');
//   }
//   console.log(urls_list)

//   return urls_list

// }

// console.log(readGoogleSheet())

// readGoogleSheet().catch(console.error);


// start URL
// var myArgs = process.argv.slice(2);
// myURL = myArgs[0] ? myArgs[0] : "https://mightyhive.com/";
// filename = myArgs[1] ?  myArgs[1] : "mightyhive_cookies.csv";
//TODO: add support for passing start URL via command line or query string

// define browser type
const { chromium } = require('playwright');

// const newscan = "";
// console.log("Starting scan for " + myURL);
// startTime = new Date();

// Launching browser, everything below this is async
(async () => {
  filename = "diageo_cookies.csv";
  errors_filename = "diageo_cookies_errors.csv";

    //google_authentication authenticates to spreadsheet and returns payload:  google_sheets_read(sheet_id, range)
    sheet_data =  await sf.google_sheets_read('1VvSCITbbEWgFim0u75bzMydJh31bJxZDGkdyf7NPfTw', 'allsites!A:A');
    // const rows = sheet_data.data.values;
    let urls_list = []
    if (sheet_data.length) {
      // loop through column value skipping first row
      sheet_data.slice(1).forEach((row) => {
        urls_list.push(row[0])
        console.log(row[0])
      });
      // console.log('Data read from sheet:');
      // rows.map((row) => {
      //   console.log(`${row.join(', ')}`);
      // });˚
    } else {
      console.log('No data found.');
    }
    // let urls_list_test = ['www.where-to-buy.com']
    console.log(urls_list)
    let browser, page, context;

  for (let myURL of urls_list){

    try{
      const newscan = "";
      console.log("Starting scan for " + myURL);
      startTime = new Date();


      browser = await chromium.launch({
        headless: true
      });

      context = await browser.newContext({ignoreHTTPSErrors:true, timeout: 10000});
      page = await context.newPage();

      /*
      // Log and continue all network requests
      page.route('**', route => {
        const request = route.request();

        if (request.url() != "undefined") {
          //rec = logCall(newscan, request.url(), JSON.stringify(request.headers()));
        }
        return route.continue();
      });
      */
      sf.logHit(filename,"\n");
      await page.goto(`https://${myURL}`);
      cookies = await context.cookies();
      var cl = 0; cl = cookies.length;
      for (i = 0; i < cl; i++) {
        cookies[i].siteURL = myURL;
      }

    // TODO: handle selectors for agegate and add form inputs and clicking/submitting

      sf.cookie2csv(cookies,filename,"before");
      await page.click('#onetrust-accept-btn-handler');
      //await page.click('#accept-all-cookies');
      cookies = await context.cookies();
      var cl = 0; cl = cookies.length;
      for (i = 0; i < cl; i++) {
        cookies[i].siteURL = myURL;
      }

      console.log('waiting for networkidle')
      //Increased timeout,  some pages that take longer
      await page.waitForLoadState('networkidle', {timeout: 100000});
      console.log('networkidle completed')
      sf.cookie2csv(cookies,filename,"after");
      endTime = new Date();
      scanTime =  endTime - startTime;
      console.log("Scanned " + myURL + " in " + scanTime+ "s");
    }catch(error){
      console.error("An error occurred:", error.message);
      sf.error2csv(errors_filename,myURL,error.message);
    }finally{
      if(browser){
        await page.close();
        await context.close();
        await browser.close();
      }
    }

  }
    //TODO update scan time

})();