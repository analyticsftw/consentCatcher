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
  sheet_data = await sf.google_sheets_read(
    "1VvSCITbbEWgFim0u75bzMydJh31bJxZDGkdyf7NPfTw",
    "allsites!A:A"
  );
  // const rows = sheet_data.data.values;
  let urlsList = [];
  if (sheet_data.length) {
    // loop through column value skipping first row
    sheet_data.slice(1).forEach((row) => {
      urlsList.push(row[0]);
      // console.log(row[0])
    });
  } else {
    console.log("No data found.");
  }

  // test_loop = ["www.mortlach.com.tw"]

  let browser, page, context;
  // for (let myURL of test_loop){
  for (let myURL of urlsList) {
    try {
      const newscan = "";
      console.log("Starting scan for " + myURL);
      startTime = new Date();

      browser = await chromium.launch({
        headless: true,
      });

      context = await browser.newContext({
        ignoreHTTPSErrors: true,
        timeout: 10000,
      });
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
      // sf.logHit(filename,"\n");

      await page.goto(`https://${myURL}`, { timeout: 100000 });
      cookies = await context.cookies();
      var cl = 0;
      cl = cookies.length;
      for (i = 0; i < cl; i++) {
        // cookies[i].siteURL = myURL;
        cookies[i].siteURL = page.url();
      }

      // TODO: handle selectors for agegate and add form inputs and clicking/submitting

      if (cookies.length > 0) {
        sf.cookie2csv(cookies, filename, "pageload");
      }

      // check for OT consent:
      await page.click("#onetrust-accept-btn-handler");
      //await page.click('#accept-all-cookies');
      cookies = await context.cookies();
      var cl = 0;
      cl = cookies.length;
      for (i = 0; i < cl; i++) {
        // cookies[i].siteURL = myURL;
        cookies[i].siteURL = page.url();
      }

      //Increased timeout,  some pages that take longer
      await page.waitForLoadState("networkidle", { timeout: 150000 });

      if (cookies.length > 0) {
        sf.cookie2csv(cookies, filename, "consent");
      }

      // Age Gate

      let agegate_phase = "";
      if (await page.isVisible("#age_content")) {
        await page.selectOption("#age_select_country", "FR");

        // THis block is only to see console logs in the browser to be shown in the terminal
        page.on("console", (msg) => {
          for (let i = 0; i < msg.args().length; ++i)
            console.log(`${i}: ${msg.args()[i]}`);
        });

        let fields_visible = [];
        if (await page.isVisible("#age_age_group")) {
          const elements = [
            {
              selector: "#age_select_year_of_birth",
              value: "1970",
              displayValue: "year",
            },
            {
              selector: "#age_select_month_of_birth",
              value: "01",
              displayValue: "month",
            },
            {
              selector: "#age_select_day_of_birth",
              value: "01",
              displayValue: "day",
            },
          ];

          for (let element of elements) {
            if (await page.isVisible(element.selector)) {
              await page.fill(element.selector, element.value);
              fields_visible.push(element.displayValue);
            }
          }
          await page.click("#age_confirm_btn");
        } else {
          fields_visible.push("none");
        }

        const agegate_types = {
          year: "agegate_year_only",
          year_month_day: "agegate_all_fields",
          none: "agegate_blocked",
        };

        agegate_phase = fields_visible.join("_");
        agegate_phase = agegate_types[agegate_phase];
      }else{
        agegate_phase = 'agegage_not_found'
      }

      cookies = await context.cookies();
      for (i = 0; i < cookies.length; i++) {
        cookies[i].siteURL = page.url();
        // cookies[i].siteURL=url;
      }

      if (cookies.length > 0) {
        sf.cookie2csv(cookies, filename, agegate_phase);
      }

      endTime = new Date();
      scanTime = endTime - startTime;
      console.log("Scanned " + myURL + " in " + scanTime + "s");
    } catch (error) {
      console.error("An error occurred:", error.message);
      sf.error2csv(errorsFilename, myURL, error.message);
    } finally {
      if (browser) {
        await page.close();
        await context.close();
        await browser.close();
      }
    }
  }
  //TODO update scan time
  sf.appendToBigQuery("cookie_scan", "cookies", "diageo_cookies.csv");
  sf.appendToBigQuery(
    "cookie_scan",
    "cookie_scan_errors",
    "diageo_cookies_errors.csv"
  );
})();
