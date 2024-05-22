const express = require('express');
const bodyParser = require('body-parser');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();


const app = express();
const PORT = process.env.PORT || 8080;

//Dependencies
fs = require("fs");
var sf = require("./support_functions.js");

app.use(bodyParser.json());
app.post('/', (req, res) => {
  const params = req.body.scan_parameters;
  const url = req.body.url;
  const projectId = params.project_id;
  const bucketName = params.bucket_name;
  const scanFileName = params.scan_file_name;
  const errorsFileName = params.errors_file_name;

  const storage = new Storage({projectId});


  // filename = "diageo_cookies.csv";
  // errorsFilename = "diageo_cookies_errors.csv";

  console.log(url);
  res.send(siteScan(url,bucketName,scanFileName,errorsFileName))

});


async function siteScan (urlScan,bucketName,scanFileName,errorsFileName){
    
  // Import Playwright only if it's installed; otherwise, run the installation command.
  // try {
  //   require('playwright');
  // } catch (error) {
  //   console.log('Playwright is not installed. Installing it now...');
  //   const { execSync } = require('child_process');
  //   execSync('npx playwright install', { stdio: 'inherit' });
  // }

  // Now you can safely require Playwright.
  const playwright = require('playwright');
  const { chromium } = require('playwright');

  let cookieSource = []
  const newscan = "";
  console.log("Starting scan for " + urlScan);
  const startTime = new Date();
  let browser, context, page;

  try {
    browser = await playwright.chromium.launch({
      headless: true, 
      // args: [
      //   '--disable-gpu',
      //   '--disable-dev-shm-usage',
      //   '--disable-setuid-sandbox',
      //   '--no-first-run',
      //   '--no-sandbox',
      //   '--no-zygote',
      //   '--single-process',
      //   "--proxy-server='direct://'",
      //   '--proxy-bypass-list=*',
      //   '--deterministic-fetch',
      // ], 
      timeout: 300000
    });

    console.log('browser created')
    // context = await browser.newContext({ignoreHTTPSErrors: true});
    context = await browser.newContext();
    console.log('context created')
    page = await context.newPage();
    console.log('PAGE created')
    // page.on('console', msg => {
    //   if (msg.type() === 'info' && msg.text().startsWith('CookieSource:')) {
    //       const cookieData = JSON.parse(msg.text().substring('CookieSource:'.length));
    //       cookieSource.push(cookieData);
    //   }
    // });
    console.log('dont know this created')

      // Injects script to the page that replaces document.cookie method to record the scripts that set the cookies
    // await page.addInitScript(() => {
    //   let cookieObject = {};
    //   const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    //   if (originalCookieDescriptor) {
    //     const originalSet = originalCookieDescriptor.set;

    //     Object.defineProperty(document, 'cookie', {
    //       ...originalCookieDescriptor,
    //       set: function(value) {
    //         // Log the entire cookie string
    //         const regex = /https?:\/\/[\w\-._~\/#]+(?<!:\d+)/g;
    //         const cookieName = value.split('=')[0];
    //         cookieObject['cookie_siteURL'] = document.location.href;              ;
    //         cookieObject['cookie_name'] = cookieName;

    //         // Capture the stack trace
    //         const stackTrace = new Error().stack;

    //         // Split the stack trace into an array of lines
    //         const stackArray = stackTrace.split('\n').map(line => line.trim());
    //         const matches = stackArray.flatMap(log => log.match(regex) || []);
    //         const uniqueMatches = [...new Set(matches)];

    //         cookieObject['cookie_sources'] = uniqueMatches;
    //         // cookieSource.push(cookieObject)

    //         //The cookie has to be log  in the console to then be captured
    //         console.info('CookieSource:' + JSON.stringify(cookieObject));

    //         // Log the stack array for
    //         console.log(`Cookie set: ${cookieName}`);
    //         console.log(uniqueMatches);

    //         // Call the original setter
    //         originalSet.call(this, value);
    //       }
    //     });
    //   }
    // });

    // page.on('response', async response => {
    //   const setCookieHeader = response.headers()['set-cookie'];
    //   if (setCookieHeader) {
    //     console.log(`HTTP Header Cookie set: ${setCookieHeader}`);
    //   }
    // });

    // Set a reasonable timeout for waiting for potential redirection.
    // This should be long enough to catch the redirection but not too long to cause unnecessary delays.
    const navigationTimeout = 8000;

    // const navigationPromise = page.goto(`https://${urlScan}`, { waitUntil: 'domcontentloaded' }).catch(e => e);
    // const waitForRedirect = page.waitForNavigation({
    //   waitUntil: 'networkidle',
    //   timeout: navigationTimeout
    // }).catch(e => {`error opening ${urlScan}` });

    // Wait for either the initial navigation or the redirection to complete.
    // Using Promise.allSettled to ensure we wait for both promises but ignore rejections due to timeout.
    // await Promise.allSettled([navigationPromise, waitForRedirect]);
    console.log('waited for redirections')
    try{
      await page.waitForLoadState("networkidle", { timeout: 10000 });
    } catch (error) {
      console.error("An error occurred:", error.message);
      sf.error2csv(errorsFileName, urlScan, error.message);
    }

    console.log('waited for networkidle')
    // getCookies('pageLoad', scanFileName)
    // try {
    //   cookies = await context.cookies();
    //   for (i = 0; i < cookies.length; i++) {
    //     cookies[i].siteURL = page.url();
    //   }
  
    //   if (cookies.length > 0) {
    //     sf.cookie2csv(cookies, scanFileName, "pageload");
    //   }
    //   console.log(cookies)
    // } catch (error) {
    //   console.error("Error reading cookie in phase pageload", error);
    // }

    await page.waitForTimeout(5000);

    cookies = await context.cookies();

    console.log(cookies)
    var cl = 0;
    cl = cookies.length;
    for (i = 0; i < cl; i++) {
      // cookies[i].siteURL = myURL;
      cookies[i].siteURL = page.url();
    }

    if (cookies.length > 0) {
      sf.cookie2csv(cookies, scanFileName, "pageload");
    }

    console.log("starting onetrust interaction")
    // const navigationPromiseOT = page.waitForNavigation().catch(e => e);
    // const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds timeout
    // check for OT consent:
    await page.click("#onetrust-accept-btn-handler");
    // await Promise.race([navigationPromiseOT, timeoutPromise]);

    await page.waitForTimeout(5000);
    //await page.click('#accept-all-cookies');
    cookies = await context.cookies();
    console.log(cookies)
    var cl = 0;
    cl = cookies.length;
    for (i = 0; i < cl; i++) {
      // cookies[i].siteURL = myURL;
      cookies[i].siteURL = page.url();
    }

    if (cookies.length > 0) {
      sf.cookie2csv(cookies, scanFileName, "onetrust");
    }

    await uploadFileToBucket(bucketName, scanFileName)
    } catch (error) {
      console.error("An error occurred:", error.message);
      sf.error2csv(errorsFileName, urlScan, error.message);
    } finally {
    if (browser) {
      await uploadFileToBucket(bucketName, errorsFileName)
      // console.log(cookieSource)
      // const uniqueSources = Array.from(new Set(cookieSource.map(JSON.stringify))).map(JSON.parse);
      // console.log('deduplicated sources')
      // console.log(uniqueSources)
      // console.log('merged sources')

      // console.log(deduplicatedCookies)
      await page.close();
      await context.close();
      await browser.close();
      console.log("scan completed")
      return "scan completed";
    }
  }
}

// Upload cookie output file to bucket and return a Promise
async function uploadFileToBucket(bucketName, fileName) {
  console.log(fileName)
  // Create a Storage client
  try {
    const options = {
      metadata: {
        contentType: "application/csv"
      }
    }
    // Upload the local file to GCS
    await storage.bucket(bucketName).upload(`./${fileName}`, options);

    console.log(`File ${fileName} uploaded to GCS as ${fileName}`);
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

// async function getCookies(phase, scanFileName){
//   try {
//     cookies = await context.cookies();
//     for (i = 0; i < cookies.length; i++) {
//       cookies[i].siteURL = page.url();
//     }

//     if (cookies.length > 0) {
//       sf.cookie2csv(cookies, scanFileName, phase);
//     }
//     console.log(cookies)
//   } catch (error) {
//     console.error(`Error reading cookie in phase  ${phase}`, error);
//   }
// }


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});



// define browser type




// const startScan = async (url) => {
//   await scanSite(url)
// }


// startScan()
// initiateScan()
