/**
 * node.js script that opens a headless browser and scans for cookies dropped without any user interaction
 * 
 * Usage:
 *  node cookies.js %URL% %outputfile%
 *  e.g.
 *  node cookies.js https://www.mightyhive.com mightyhive.json
*/


/* Dependencies */

var sf = require('./support_functions.js');
const playwright = require('playwright');

/* Handle command line arguments */
var myArgs = process.argv.slice(2);

/* Instantiate headless browser and scan elements in requested page */
(async () => { 
    const browser = await playwright['chromium'].launch(
        //{executablePath: '/usr/bin/chromium-browser', headless: true}
        {headless: false}
    );
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(0); 
    

    var url = 'https://www.mightyhive.com/'; // default URL to scan
    url = myArgs[0] ? myArgs[0] : url; // use command line argument  #1 if provided
    filename = myArgs[1] ?  myArgs[1] : "cookies_diageo.csv";

    /* Visit URL from command line or variable */
    await page.goto(url);

    /* Wait for cookies to be set*/
    cookies = await context.cookies();
    for (i=0;i<cookies.length;i++){
        cookies[i].siteURL=url;
    }
    sf.cookie2csv(cookies,filename,"pageload");

    // OneTrust
    await page.click('#onetrust-accept-btn-handler');
    cookies = await context.cookies();
    for (i=0;i<cookies.length;i++){
        cookies[i].siteURL=url;
    }
    sf.cookie2csv(cookies,filename,"consent");

    // Age Gate

    
    await page.selectOption("#age_select_country","US");
    await page.fill("#age_select_year_of_birth","1970");
    await page.fill("#age_select_month_of_birth","01");
    await page.fill("#age_select_day_of_birth","01");
    await page.click("#age_confirm_btn");
    
    cookies = await context.cookies();
    for (i=0;i<cookies.length;i++){
        cookies[i].siteURL=url;
    }
    sf.cookie2csv(cookies,filename,"agegate");
    /*
    it('Fills in the age gate', () => {
        // Age gate ; uses both sets of selectors
          cy.get("#age_select_country").select("US");
          cy.get("#age_select_year").select("1970");
          cy.get("#age_select_month").select("1");
          cy.get("#age_select_day").select("1");
          cy.get("#age_confirm_btn").click();
    
          cy.get("#age_select_country").select("US");
          cy.get("#age_select_year_of_birth").type("1970");
          cy.get("#age_select_month_of_birth").type("01");
          cy.get("#age_select_day_of_birth").type("01");
          cy.get("#age_confirm_btn").click();
      });
    */

    /* Wait for the browser to stop receive network requests (page is loaded) before closing it*/
    await page.waitForLoadState('networkidle');
    await browser.close();

    /* Log cookies JSON to file */
   
    
})();