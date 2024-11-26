const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // This array will store URLs of redirected pages
  const redirectUrls = [];

  // Listen to response events
  page.on('response', response => {
    // Check if the response status code indicates a redirect
    if (response.status() >= 300 && response.status() <= 399) {
      // Get the 'location' header to find out the redirect target URL
      const location = response.headers()['location'];
      if (location) {
        redirectUrls.push(location);
        console.log('Redirected to:', location);
      }
    }
  });

  // Navigate to the initial URL
  await page.goto('http://dba20.diageobaracademy.com');



  console.log(page.url())

  const gtmKeys = await page.evaluate(() => {
    const keys = Object.keys(window.google_tag_manager || {});
    return keys.filter(key => key.startsWith('GTM-')).join(' | ');
  });

  console.log(gtmKeys)
  // Optionally, use the redirectUrls array as needed
  // e.g., console.log(redirectUrls);

  await browser.close();
})();
