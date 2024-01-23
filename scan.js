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

  // test_loop = ["www.guinness.com"]

  // let browser, page, context;
  // for (let myURL of test_loop){

  for (let myURL of urlsList) {
    try {
      let cookieSource = []
      const newscan = "";
      console.log("Starting scan for " + myURL);
      startTime = new Date();

      browser = await chromium.launch({
        headless: true,
        args: ['--auto-open-devtools-for-tabs']
      });

      context = await browser.newContext({
        ignoreHTTPSErrors: true,
        timeout: 10000,
      });
      page = await context.newPage();

      //     // Listen for console events and log them to the terminal
      // page.on('console', msg => {
      //   // Filter or format messages as needed
      //   console.log(`[Page Console ${msg.type()}]:`, msg.text());
      // });


      page.on('console', msg => {
        if (msg.type() === 'info' && msg.text().startsWith('CookieSource:')) {
            const cookieData = JSON.parse(msg.text().substring('CookieSource:'.length));
            cookieSource.push(cookieData);
        }
      });

      // Injects script to the page that replaces document.cookie method
      await page.addInitScript(() => {
        let cookieObject = {};
        const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
        if (originalCookieDescriptor) {
          const originalSet = originalCookieDescriptor.set;

          Object.defineProperty(document, 'cookie', {
            ...originalCookieDescriptor,
            set: function(value) {
              // Log the entire cookie string
              const regex = /https?:\/\/[\w\-._~\/#]+(?<!:\d+)/g;
              const cookieName = value.split('=')[0];
              cookieObject['cookie_siteURL'] = document.location.href;              ;
              cookieObject['cookie_name'] = cookieName;

              // Capture the stack trace
              const stackTrace = new Error().stack;

              // Split the stack trace into an array of lines
              const stackArray = stackTrace.split('\n').map(line => line.trim());
              const matches = stackArray.flatMap(log => log.match(regex) || []);
              const uniqueMatches = [...new Set(matches)];

              cookieObject['cookie_sources'] = uniqueMatches;
              // cookieSource.push(cookieObject)

              //The cookie has to be log  in the console to then be captured
              console.info('CookieSource:' + JSON.stringify(cookieObject));



              // Log the stack array for
              console.log(`Cookie set: ${cookieName}`);
              console.log(uniqueMatches);

              // Call the original setter
              originalSet.call(this, value);
            }
          });
        }
      });

      page.on('response', async response => {
        const setCookieHeader = response.headers()['set-cookie'];
        if (setCookieHeader) {
          console.log(`HTTP Header Cookie set: ${setCookieHeader}`);
        }
      });

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

      //  // Apply debugAccess to document.cookie
      // await page.evaluate(() => {
      //   debugAccess(document, 'cookie');
      // });

      await page.waitForLoadState("networkidle", { timeout: 200000 });

      cookies = await context.cookies();

      console.log(cookies)
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



      if (cookies.length > 0) {
        sf.cookie2csv(cookies, filename, "consent");
      }

      // Age Gate

      let agegate_phase = "";
      if (await page.isVisible("#age_content")) {
        const options = await page.$$eval('#age_select_country > option', options => options.map(option => option.value));
        if (options.includes('GB')) {
          await page.selectOption('#age_select_country', 'GB');
        } else if (options.includes('UK')) {
          await page.selectOption('#age_select_country', 'UK');
        }


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
              type: 'fill'
            },
            {
              selector: "#age_select_month_of_birth",
              value: "01",
              displayValue: "month",
              type: 'fill'
            },
            {
              selector: "#age_select_day_of_birth",
              value: "01",
              displayValue: "day",
              type: 'fill'
            },
            {
              selector: "#age_select_year",
              value: "1970",
              displayValue: "year",
              type: 'select'
            },
            {
              selector: "#age_select_month",
              value: "January",
              displayValue: "month",
              type: 'select'
            },
            {
              selector: "#age_select_day",
              value: "1",
              displayValue: "day",
              type: 'select'
            },
          ];

          for (let element of elements) {
            if (await page.isVisible(element.selector) && element.type == 'fill') {
              await page.fill(element.selector, element.value);
              fields_visible.push(element.displayValue);
            }else if (await page.isVisible(element.selector) && element.type == 'select') {
              await page.selectOption(element.selector, element.value);
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

      //Increased timeout,  some pages that take longer
      await page.waitForLoadState("networkidle", { timeout: 100000 });

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
      await page.waitForTimeout(5000);


      const deduplicatedCookies = Object.values(cookieSource.reduce((acc, { cookie_siteURL, cookie_name, cookie_sources}) => {
        if (!acc[cookie_name]) {
            acc[cookie_name] = {cookie_siteURL, cookie_name, cookie_sources: new Set(cookie_sources)};
        } else {
            cookie_sources.forEach(source => acc[cookie_name].cookie_sources.add(source));
        }
        return acc;
      }, {})).map(({cookie_siteURL, cookie_name, cookie_sources}) => ({
        site_scanned : myURL,
        cookie_siteURL,
        cookie_name,
        cookie_sources: Array.from(cookie_sources).join(' | '),
      }));

      console.log(deduplicatedCookies)




      sf.source2csv('diageo_cookies_sources.csv',deduplicatedCookies)


    } catch (error) {
      console.error("An error occurred:", error.message);
      sf.error2csv(errorsFilename, myURL, error.message);
    } finally {
      if (browser) {
        // console.log(cookieSource)
        // const uniqueSources = Array.from(new Set(cookieSource.map(JSON.stringify))).map(JSON.parse);
        // console.log('deduplicated sources')
        // console.log(uniqueSources)
        // console.log('merged sources')

        // console.log(deduplicatedCookies)
        await page.close();
        await context.close();
        await browser.close();
      }
    }
  }
  //TODO update scan time
  sf.appendToBigQuery("cookie_scan", "cookies", "diageo_cookies.csv");
  sf.appendToBigQuery("cookie_scan","cookie_scan_errors","diageo_cookies_errors.csv");
  sf.appendToBigQuery("cookie_scan","cookie_scan_sources", "diageo_cookies_sources.csv")
})();
