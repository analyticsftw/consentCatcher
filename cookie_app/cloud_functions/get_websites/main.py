import functions_framework
import re
import os
import requests
import json
import logging

@functions_framework.http
def get_ot_websites(request):
    try:
        OT_TOKEN = os.environ.get('OT_TOKEN')
        OT_HOSTNAME = os.environ.get('OT_HOSTNAME')
        if not OT_TOKEN or not OT_HOSTNAME:
            raise ValueError("OT_TOKEN or OT_HOSTNAME environment variable is not set.")
    except KeyError as e:
        logging.error(f"Missing environment variable: {e}")
        return "Error: Missing required environment variables.", 500
        
    url = f"https://{OT_HOSTNAME}/api/cookiemanager/v2/websites"
    headers = {
        "accept": "application/json",
        "authorization": f"Bearer {OT_TOKEN}"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception if the request is not successful
        data = response.text
        data = re.sub(r"\{domainName", r"\n\t{domainName", data)
        website_data = json.loads(data)
        json_string = json.dumps(website_data, indent=4)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from OneTrust API: {e}")
        return "Error: Could not fetch websites from OneTrust.", 500
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON response from OneTrust API: {e}")
        return "Error: Invalid JSON response from OneTrust.", 500

    print(json_string)  # Print the formatted JSON for debugging (if necessary)
    return json_string