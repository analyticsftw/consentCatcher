""" Retrieves a list of websites handled by a OneTrust account """

import re
import requests
from ot_config import apiSettings
import json

# Settings
hostname=apiSettings["hostname"]
client_id=apiSettings["client_id"]
client_secret=apiSettings["client_secret"]
apiToken=apiSettings["api_token"]

# see list_websites.py

# we have a token, now let's pull a list of all domains for which we have cookies in OneTrust
url = f"https://{hostname}/api/cookiemanager/v2/websites"
headers = {
    "accept": "application/json",
    "authorization": f"Bearer {apiToken}"
}
response = requests.get(url, headers=headers)

# Output formatted JSON to file
# with open('websites.json','w') as json_file:
#     data = response.text
#     data = re.sub(
#         r"\{domainName", 
#         r"\n\t{domainName", 
#         data
#     )
#     json_file.write(data)\

data = response.text
data = re.sub(r"\{domainName", r"\n\t{domainName", data)

# Convert data to a dictionary (assuming the data is parsable JSON)
website_data = json.loads(data)

# Transform the dictionary to JSON string
json_string = json.dumps(website_data, indent=4)  # Add indentation for readability

# Print the JSON string
print(json_string)