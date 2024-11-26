const { chromium } = require('playwright');

(async () => {
  // Launch browser
  const browser = await chromium.launch({
	headless: false,
  });

  const page = await browser.newPage();

  // Set of all visited URLs
  const visitedUrls = new Set();
  // Set of URLs to visit, starting with the initial URL
  const urlsToVisit = new Set(['https://www.guinness.com/en-gb']);

  // Function to collect and navigate URLs
  async function crawl(url) {
    if (visitedUrls.has(url)) {
      // If the URL has already been visited, skip it
      return;
    }

    // Mark the URL as visited
    visitedUrls.add(url);

    // Navigate to the URL
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Extract all URLs from the page
    const urlsOnPage = await page.$$eval('a', anchors => anchors.map(a => a.href));

    // Filter and add new URLs to the queue
    urlsOnPage.forEach(href => {
      if (href.includes('guinness.com/en-gb') && !visitedUrls.has(href)) {
        urlsToVisit.add(href);
      }
    });

    console.log(`Visited: ${url}`);
  }

  // Main loop to visit each URL in the queue
  while (urlsToVisit.size > 0) {
    const [url] = urlsToVisit; // Get the first URL from the set
    urlsToVisit.delete(url); // Remove the URL from the set to avoid revisiting
    await crawl(url);
  }

  await browser.close();
})();
