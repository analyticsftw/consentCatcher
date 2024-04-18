const express = require('express');
const bodyParser = require('body-parser');
const playwright = require('playwright');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage();


const app = express();
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

//Dependencies
fs = require("fs");
var sf = require("./support_functions.js");


// Upload cookie output file to bucket and return a Promise
async function uploadFileToBucket(bucketName, folderName, fileName) {

    console.log(`Uploading ${fileName} to Cloud Storage`)
    // Create a Storage client
    try {
        const options = {
            destination: `${folderName}\/${fileName}`,
            metadata: {
                contentType: "application/csv"
            }
        }
        // Upload the local file to GCS
        await storage.bucket(bucketName).upload(`./${fileName}`, options);
        console.log(`File ${fileName} uploaded to GCS as ${fileName}`);
        return 'success'
    } catch (error) {
        console.error(error);
        throw new Error('Error uploading file to GCS'); 
    }
}

async function scrollWithInterval(page, scrollAmount, scrollDuration = 5000) {
    await page.evaluate(({ distance, intervalDuration, scrollDuration }) => {
        return new Promise((resolve) => {
            let totalHeight = 0;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= document.body.scrollHeight) {
                    clearInterval(timer);
                    resolve();  // If you reach the bottom of the page, resolve the promise
                }
            }, 500);

            // Set a timeout to stop scrolling after 5 seconds
            setTimeout(() => {
                clearInterval(timer);
                resolve();  // This will resolve the promise after 5 seconds, stopping the scrolling
            }, scrollDuration);  // Stop after scrollDuration milliseconds
        });
    //  }, { distance: scrollAmount, intervalDuration: interval, scrollDuration :  scrollDuration});
}, { distance: scrollAmount, scrollDuration : scrollDuration});
}


async function pageInteraction(page, stepName, type, selector, input, inputOption){
    try {
        switch (type){
            case 'click':
                if (await page.isVisible(selector)){
                    page.click(selector)
                }
                break;
            case 'dropdown':
                // We define the dropdown options as it is normally built selector>option
                const options = await page.$$eval(`${selector}>option`, options => options.map(option => option.value));
                if (options.includes(input)) {
                    await page.selectOption(selector, input);
                } else if (options.includes(inputOption)) {
                    await page.selectOption(selector, inputOption);
                }
                break;
            case 'text':
                if (await page.isVisible(selector)) {
                    await page.fill(selector, input);
                }
                break;
            // Scrolls the defined distance by the user in pxs every 1000ms
            case 'scroll':
                await scrollWithInterval(page, input, inputOption);
        }
        await page.waitForTimeout(5000);
    } catch (error) {
        console.error(error);
        throw new Error(`Failed on page interaction ${stepName}`); 
    }   
}


async function runCollection(page, phase, step, params, startTime) {
    // step name
    const stepName = step.step_name;
    // GCS Bucket file parameters
    const bucketName = params.scan_parameters.bucket_name;
    const folderName = params.scan_parameters.folder_name;
    // Type of collection parameters
    const collectCookies = step.collect_cookies;
    const collectRequests = step.collect_cookies;
    // Waiitng time before collection
    const waitTime = step.wait ? step.wait : 0;
    // filenames
    const scanFilePrefix = params.scan_parameters.scan_file_prefix;
    const errorsFilePrefix = params.scan_parameters.errors_file_prefix;
    // Interaction parameters
    // const interaction = step.page_interaction;
    // const interactiontype = step.interaction_params.type;
    // const interactionSelector = step.interaction_params.selector;
    // const interactionInput = step.interaction_params.input;
    // const interactionInputOption = step.interaction_params.input_option;
    // if (!url) {
    //     throw new Error('Please provide a URL as a query parameter.');
    // }

    console.log(`Waiting for ${waitTime} before collection`)
    await page.waitForTimeout(waitTime);

    if(collectCookies){
        const fileName = `${scanFilePrefix}_${startTime}.csv`;

        // if(interaction){
        //     console.log("Interacting on page")
        //     await pageInteraction(page, stepName, interactiontype, interactionSelector, interactionInput, interactionInputOption)
        // }
        
        try {
            const cookies = await page.context().cookies();
            // Inlcudes the current URL in the cookies payload
            for (i = 0; i < cookies.length; i++) {
                cookies[i].siteURL = page.url();
            }
            console.log("Writing cookies in CSV")
            sf.cookie2csv(cookies, fileName, phase);
            console.log(cookies);
            await uploadFileToBucket(bucketName, folderName, fileName) 
            return cookies; // Return cookies directly
        } catch (error) {
            console.error(error);
            throw new Error('Failed to retrieve cookies.'); 
        }
    }

    if(collectRequests){
        const fileName = `requests_scan_${startTime}.csv`;
        // TODO: Add requests collection script
    }
}

async function stepDistribution(page, params, startTime) {
    const steps = params.scan_parameters.scan_steps;

    try {
        for (let i = 0; i < steps.length; i++) {
            console.log(`Running Step: ${steps[i].step_name}`)
            let stepType = steps[i].step_type;
            let stepName = steps[i].step_name;
            // let collectionType = steps[i].collection_type;
            // let collectCookies = collectionType ? collectionType.collect_cookies : null;
            // let collectRequests = collectionType ? collectionType.collect_requests : null;

            if(stepType == "collection"){
                await runCollection(page, stepName, steps[i], params, startTime)
            }else if(stepType == "interaction"){  
                const interactiontype = steps[i].type;
                const interactionSelector = steps[i].selector;
                const interactionFieldText = steps[i].input;
                const interactionFieldTextFbck = steps[i].input_fallback;
                await pageInteraction(page, stepName, interactiontype, interactionSelector, interactionFieldText, interactionFieldTextFbck)
            }
        }
    } catch (error) {
        console.error(error);
        throw new Error('Failed distributing steps'); 
    }
}

app.use(bodyParser.json());
app.post('/scan-site', async (req, res) => {
    const startTime = new Date().toISOString()
    const params = req.body;
    // const params = req.body.scan_parameters;
    const url = req.body.url;
    const projectId = params.project_id;
    const bucketRegion = params.bucket_region;
    const bucketName = params.bucket_name;
    const fodlerName = params.folder_name;
    const scanFilePrefix = params.scan_file_prefix;
    const errorsFilePrefix = params.errors_file_prefix;
    const scanSteps = params.scan_steps;


    console.log(`Scan started on ${url}`)
    const browser = await playwright.chromium.launch({headless: true});
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url);
    try {
        await page.waitForNavigation({
            timeout: 5000,
            waitUntil: 'networkidle'
        });
    }catch(error){
        console.error('Networkidle wait timed out, consider increasing waiting time:', error.message);
    }


    try {
        await stepDistribution(page, params, startTime)
        res.status(200).send({ success: 'Cookies successfully retrieved'});
    } catch (error) {
        console.error('Error in cookie collection:', error.message);
        res.status(500).send({ error: error.message });
    }finally {
        await browser.close();
    }
});



// const express = require('express');
// const playwright = require('playwright');
// const bodyParser = require('body-parser');

// const app = express();
// const PORT = process.env.PORT || 8080; // Cloud Run sets the PORT environment variable

// app.listen(PORT, () => {
//     console.log(`Server listening on port ${PORT}`);
// });

// app.use(bodyParser.json());
// app.post('/', async (req, res) => {
//     // const params = req.body.scan_parameters;
//     const url = req.body.url;
//     // const projectId = params.project_id;
//     // const bucketName = params.bucket_name;
//     // const scanFileName = params.scan_file_name;
//     // const errorsFileName = params.errors_file_name;
//     // const { url } = req.query;
//     if (!url) {
//         return res.status(400).send({ error: 'Please provide a URL as a query parameter.' });
//     }

//     try {
//         const browser = await playwright.chromium.launch();
//         const context = await browser.newContext();
//         const page = await context.newPage();
        
//         await page.goto(url);
//         const cookies = await page.context().cookies();

//         console.log(cookies)

//         await page.close();
//         await context.close();
//         await browser.close();
//         res.json({cookies})
//         // res.status(200).send({ success: 'Cookies succesfully retrieved' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send({ error: 'Failed to retrieve cookies.' });
//     }
// });


// async function siteScan (scanUrl,bucketName,scanFileName,errorsFileName){
//     let cookieScriptSource = []
//     const startTime = new Date();
  
//     console.log("Starting scan on " + scanUrl);
//     try {
//       const browser = await playwright.chromium.launch(({headless: true}))
//       console.log('browser created')
//       // context = await browser.newContext({ignoreHTTPSErrors: true});
//       const context = await browser.newContext();
//       console.log('context created')
//       const page = await context.newPage();
//       console.log('page created')
  
//       // Injects script to the page that replaces document.cookie method to record the scripts that set the cookies
//       // await page.addInitScript(() => {
//       //   let cookieObject = {};
//       //   const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
//       //   if (originalCookieDescriptor) {
//       //     const originalSet = originalCookieDescriptor.set;
  
//       //     Object.defineProperty(document, 'cookie', {
//       //       ...originalCookieDescriptor,
//       //       set: function(value) {
//       //         // Log the entire cookie string
//       //         const regex = /https?:\/\/[\w\-._~\/#]+(?<!:\d+)/g;
//       //         const cookieName = value.split('=')[0];
//       //         cookieObject['cookie_siteURL'] = document.location.href;              ;
//       //         cookieObject['cookie_name'] = cookieName;
  
//       //         // Capture the stack trace
//       //         const stackTrace = new Error().stack;
  
//       //         // Split the stack trace into an array of lines
//       //         const stackArray = stackTrace.split('\n').map(line => line.trim());
//       //         const matches = stackArray.flatMap(log => log.match(regex) || []);
//       //         const uniqueMatches = [...new Set(matches)];
  
//       //         cookieObject['cookie_sources'] = uniqueMatches;
//       //         // cookieSource.push(cookieObject)
  
//       //         //The cookie has to be log  in the console to then be captured
//       //         console.info('CookieSource:' + JSON.stringify(cookieObject));
  
//       //         // Log the stack array for
//       //         console.log(`Cookie set: ${cookieName}`);
//       //         console.log(uniqueMatches);
  
//       //         // Call the original setter
//       //         originalSet.call(this, value);
//       //       }
//       //     });
//       //   }
//       // });
  
//       // page.on('response', async response => {
//       //   const setCookieHeader = response.headers()['set-cookie'];
//       //   if (setCookieHeader) {
//       //     console.log(`HTTP Header Cookie set: ${setCookieHeader}`);
//       //   }
//       // });
  
//       // Set a reasonable timeout for waiting for potential redirection.
//       // This should be long enough to catch the redirection but not too long to cause unnecessary delays.
//       const navigationTimeout = 8000;
  
//       const navigationPromise = page.goto(`https://${scanUrl}`, { waitUntil: 'domcontentloaded' }).catch(e => e);
//       const waitForRedirect = page.waitForNavigation({
//         waitUntil: 'networkidle',
//         timeout: navigationTimeout
//       }).catch(e => {`error opening ${scanUrl}` });
  
//       // Wait for either the initial navigation or the redirection to complete.
//       // Using Promise.allSettled to ensure we wait for both promises but ignore rejections due to timeout.
//       // await Promise.allSettled([navigationPromise, waitForRedirect]);
//       // console.log('waited for redirections')
//       // try{
        
//       // } catch (error) {
//       //   console.error("An error occurred:", error.message);
//       //   sf.error2csv(errorsFileName, urlScan, error.message);
//       // }
//       await page.waitForLoadState("networkidle", { timeout: 10000 });
//       console.log('waited for networkidle')
//       await getCookies('pageLoad', scanFileName, context, page)
//       // try {
//       //   cookies = await context.cookies();
//       //   for (i = 0; i < cookies.length; i++) {
//       //     cookies[i].siteURL = page.url();
//       //   }
    
//       //   if (cookies.length > 0) {
//       //     sf.cookie2csv(cookies, scanFileName, "pageload");
//       //   }
//       //   console.log(cookies)
//       // } catch (error) {
//       //   console.error("Error reading cookie in phase pageload", error);
//       // }
  
//       await page.waitForTimeout(5000);
  
//       cookies = await context.cookies();
  
//       // console.log(cookies)
//       // var cl = 0;
//       // cl = cookies.length;
//       // for (i = 0; i < cl; i++) {
//       //   // cookies[i].siteURL = myURL;
//       //   cookies[i].siteURL = page.url();
//       // }
  
//       // if (cookies.length > 0) {
//       //   sf.cookie2csv(cookies, scanFileName, "pageload");
//       // }
//       console.log(cookies)
//       console.log("starting onetrust interaction")
//       // const navigationPromiseOT = page.waitForNavigation().catch(e => e);
//       // const timeoutPromise = new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds timeout
//       // check for OT consent:
//       await page.click("#onetrust-accept-btn-handler");
//       // await Promise.race([navigationPromiseOT, timeoutPromise]);
  
//       await page.waitForTimeout(5000);
//       //await page.click('#accept-all-cookies');
//       cookies = await context.cookies();
  
//       console.log(cookies)
//       // console.log(cookies)
//       // var cl = 0;
//       // cl = cookies.length;
//       // for (i = 0; i < cl; i++) {
//       //   // cookies[i].siteURL = myURL;
//       //   cookies[i].siteURL = page.url();
//       // }
  
//       // if (cookies.length > 0) {
//       //   sf.cookie2csv(cookies, scanFileName, "onetrust");
//       // }
  
//       await uploadFileToBucket(bucketName, scanFileName)
//       await page.close();
//       await context.close();
//       await browser.close();
//       return(cookies)
  
//       } catch (error) {
//         console.error("An error occurred:", error.message);
//       //   sf.error2csv(errorsFileName, urlScan, error.message);
//         res.status(500).send({ error: 'Failed to retrieve cookies.' });
//       } 
//       // finally {
//       //     if (browser) {
//       //     //   await uploadFileToBucket(bucketName, errorsFileName)
//       //       // console.log(cookieSource)
//       //       // const uniqueSources = Array.from(new Set(cookieSource.map(JSON.stringify))).map(JSON.parse);
//       //       // console.log('deduplicated sources')
//       //       // console.log(uniqueSources)
//       //       // console.log('merged sources')
  
//       //       // console.log(deduplicatedCookies)
//       //       await page.close();
//       //       await context.close();
//       //       await browser.close();
//       //       console.log("scan completed")
//       //     //   return "scan completed";
//       //       res.json({cookies})
//       //     }
//       //   }
//   }
  