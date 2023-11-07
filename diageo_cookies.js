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
        {headless: true}
    );
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(0);


    var url = 'https://www.guinness.com/'; // default URL to scan
    url = myArgs[0] ? myArgs[0] : url; // use command line argument  #1 if provided
    filename = myArgs[1] ?  myArgs[1] : "diageo_agegate_cookies.csv";

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

    await page.selectOption("#age_select_country","FR");


    page.on('console', msg => {
        for (let i = 0; i < msg.args().length; ++i)
          console.log(`${i}: ${msg.args()[i]}`);
      });

    let agegate_fields = await page.evaluate(async () => {
        let fields_display = [];
        const age_form = document.getElementById("age_inputs");
        for (const child of age_form.children) {
            let field_value = '';
            let child_id = child.getAttribute('id')
            let child_display = window.getComputedStyle(child)['display']

            if(child_display != 'none'){
                let field_label = child.querySelector('label').getAttribute('data-lang')
                console.log(field_label)
                if(field_label == 'year'){
                    fields_display.push('y')
                }else if(field_label == 'month'){
                    fields_display.push('m')
                }else if(field_label == 'day'){
                    fields_display.push('d')
                }else{
                    field_value = 'none'
                }
            }
        }

        let fields_joined = fields_display.join('')

        return fields_joined
    })

    console.log(agegate_fields)


    await page.fill("#age_select_year_of_birth","1970");

    await page.isVisible('#age_select_month_of_birth', await page.fill("#age_select_month_of_birth","01"));

    await page.isVisible('#age_select_day_of_birth', await page.fill("#age_select_day_of_birth","01"));

    // await page.fill("#age_select_month_of_birth","01");
    // await page.fill("#age_select_day_of_birth","01");
    await page.click("#age_confirm_btn");

    cookies = await context.cookies();
    for (i=0;i<cookies.length;i++){
        cookies[i].siteURL=page.url();
        // cookies[i].siteURL=url;
    }
    sf.cookie2csv(cookies,filename,"agegate"+ "_"+agegate_fields);
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