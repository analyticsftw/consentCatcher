import functions_framework
import re
import os
import requests
import json
import logging

@functions_framework.http
def get_ot_websites(request):
    try:
        # OT_TOKEN = os.environ.get('OT_TOKEN')
        OT_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imp3dCJ9.eyJyb2xlIjoiQXBpIEtleSBVc2VyIiwidXNlcl9uYW1lIjoiYTlkNzE2NDBkM2M2NDliY2JkZmMzYjQwMWVmMjM4ZjJAYXBpLm9uZXRydXN0LmNvbSIsImxhbmd1YWdlSWQiOjEsInNlc3Npb25JZCI6ImRkYjJkYWE4LTllYWYtNDg2NC04NTk5LTUwZjUxMDk3OTZlMSIsInRlbmFudEd1aWQiOiJhOWQ3MTY0MC1kM2M2LTQ5YmMtYmRmYy0zYjQwMWVmMjM4ZjIiLCJjbGllbnRfaWQiOiJiNjQ1ODAwYTRhOGE0NzVkOGYxNWQzNjY3ZGQwMDFlNiIsIm9yZ0dyb3VwSWQiOiI2MjU3MjliNy1jNzZkLTQ1YTktODNlMS0wZTYzZTUwNjE2ZDMiLCJvcmdHcm91cEd1aWQiOiI2MjU3MjliNy1jNzZkLTQ1YTktODNlMS0wZTYzZTUwNjE2ZDMiLCJvdC1zY29wZXMiOiJDT09LSUUsQ09PS0lFX0ZSRUUsQ09PS0lFX1JFQUQiLCJzY29wZSI6W10sInRlbmFudElkIjoyMiwiZ3VpZCI6IjIyZGY0Mjg0LWI0M2QtNDE4NS04ODcwLWIzMjgxODg0MjdhMyIsImV4cCI6MTczMjM1NjcwNywiZXhwaXJlc19pbiI6MzE1MzYwMDAsImp0aSI6InN1WXRVVktLT1RkR2NyN2x6aE9wT1BfOTZ1OCIsImVtYWlsIjoiYTlkNzE2NDBkM2M2NDliY2JkZmMzYjQwMWVmMjM4ZjJAYXBpLm9uZXRydXN0LmNvbSJ9.LJMg2cedmVK2dYvQX_hg9vMSOw2vPxlUKCbNAQmH12OWtZT4EcjOo0wW1rXjE254drK1-NPgW7uW2EFTSbdRpj0XNawYMlXyV5vDSdR1cQo53_Ljpy4qTjHLAamuTkOUxNYPz6DWQm0VrKfEbjrtdOajxz5CJkIo57flmrreBobXiu6CTFe4hxoOAqA21slEnIqXA-gy-b6tyeLaKH0RH6si8ona6CeY5G5ziEIlN1Tl0SNtXbhI-tOO6ZZUxeDAAIk6wn5r1WMuAbTKob4LdqHD_9KhnGj_Xhqsmf7-4TK2E0E0wGvZ1S3n3Kw4d5rXrMeDgn5z2iKWVlu3I-7KOw"
        # OT_HOSTNAME = os.environ.get('OT_HOSTNAME')
        OT_HOSTNAME = 'app-uk.onetrust.com'
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
        # print(data)
        data = re.sub(r"\{domainName", r"\n\t{domainName", data)
        # print(data)
        website_data = json.loads(data)
        # for website in website_data['content']:
            # print(website['domainName'])
        json_string = json.dumps(website_data, indent=4)
    except requests.RequestException as e:
        logging.error(f"Error fetching data from OneTrust API: {e}")
        return "Error: Could not fetch websites from OneTrust.", 500
    except json.JSONDecodeError as e:
        logging.error(f"Error decoding JSON response from OneTrust API: {e}")
        return "Error: Invalid JSON response from OneTrust.", 500

    print(json_string)  # Print the formatted JSON for debugging
    with open('websites.json', 'w') as f:
        json.dump(data, f)
    return json_string

get_ot_websites('test')