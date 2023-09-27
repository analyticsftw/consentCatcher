  const {BigQuery} = require('@google-cloud/bigquery');
  const bigquery = new BigQuery();
  const fields = [
    'date', 
    'siteURL', 
    'phase',
    'sameSite', 
    'name', 
    'value', 
    'domain', 
    'path', 
    'expires', 
    'httpOnly', 
    'secure'
  ];
  const opts = { fields };
  
  const datasetId = 'cookie_scan';
  const tableId = 'cookies';
  const rows = [
    {cookie_date: 'today'}
  ];

  // Insert data into a table
  bigquery.dataset(datasetId).table(tableId).insert(rows);
  console.log(`Inserted ${rows.length} rows`);