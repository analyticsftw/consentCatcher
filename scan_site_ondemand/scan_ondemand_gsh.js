/**
 * node.js script that opens a headless browser and scans for cookies dropped without any user interaction
 *
 * Usage:
 *  node scan.js %URL% %outputfile%
 *  e.g.
 *  node scan.js https://www.mightyhive.com mightyhive.json
 */

/* Dependencies */

// READ FIRST:
// THIS SCAN IS SPECIFIC FOR https://shop.guinness-storehouse.com/


fs = require("fs");
const sf = require("./support_functions.js");
const { chromium } = require("playwright");
const { firefox } = require("playwright");

const bodyParser = require('body-parser');
const express = require("express");
const app = express();
app.use(bodyParser.json());

// const port = parseInt(process.env.PORT) || 8080;

async function initiate_site_scan(myURL) {
  filename = "shop_guinness-storehouse_com.csv";
  errorsFilename = "site_cookies_errors.csv";

  let browser, page, context;

  // for (let myURL of urlsList) {
  try {
    const newscan = "";
    console.log("Starting scan for " + myURL);
    startTime = new Date();

    // const browser = await chromium.launch({
    //   headless: true,
    // });

    const browser = await firefox.launch({
      headless: false,
    });

    console.log('browser launched!')
    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      timeout: 100000,
    });
    const page = await context.newPage();

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
    // await page.goto(`https://${myURL}`, {waitUntil: 'domcontentloaded'});
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
      await page.selectOption("#age_select_country", "GB");

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
    } else {
      agegate_phase = "agegage_not_found";
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

  //TODO update scan time
  if (fs.existsSync(filename)) {
    sf.appendToBigQuery("cookie_scan", "cookies", filename);
  } else {
    console.log('File does not exist.');
  }

  if (fs.existsSync(errorsFilename)) {
    sf.appendToBigQuery("cookie_scan","cookie_scan_errors",errorsFilename);
  } else {
    console.log('Error File does not exist.');
  }

}

// app.post("/", (req, res) => {
//   const payload = req.body;
//   const siteurl = payload.siteurl;
//   console.log(payload);
//   initiate_site_scan(siteurl);

//   const name = process.env.NAME || "World";
//   res.send(`Hello ${name}!`);
// });

// app.listen(port, () => {
//   console.log(`helloworld: listening on port ${port}`);
// });

initiate_site_scan("stage.my.guinness.com/en-gb");
