const functions = require('@google-cloud/functions-framework');
const {ExecutionsClient} = require('@google-cloud/workflows');

functions.http('start_scan', async (req, res) => {
  const client = new ExecutionsClient();
  const cloudEvent = req.body;

  if(cloudEvent.data.key == "-psAW@By}!aJ$ZTaG^Aa"){
    if (cloudEvent.type === "sheet.scan.start") {
      console.log(cloudEvent.type);
      console.log(cloudEvent.data.url_list);
      console.log(cloudEvent.data.scan_parameters);
      try {
        await client.createExecution({
          parent: client.workflowPath("diageo-cookiebase", "europe-west4", "coookie_scan"),
          execution: { 
            argument: JSON.stringify({
              "scan_urls":cloudEvent.data.url_list,
              "scan_parameters": cloudEvent.data.scan_parameters
            }),
          },
        });
      } catch(e) {}
    } else {
      console.warn(`Unknown CloudEvent type: ${cloudEvent.type}`);
    }
  }else{
    console.warn('Access denied, invalid key');
  }
  res.status(200).send("Success");
});

