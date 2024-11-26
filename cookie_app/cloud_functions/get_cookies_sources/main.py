# import requests

# # OT_TOKEN = os.environ.get('OT_TOKEN')
OT_TOKEN =  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imp3dCJ9.eyJyb2xlIjoiQXBpIEtleSBVc2VyIiwidXNlcl9uYW1lIjoiYTlkNzE2NDBkM2M2NDliY2JkZmMzYjQwMWVmMjM4ZjJAYXBpLm9uZXRydXN0LmNvbSIsImxhbmd1YWdlSWQiOjEsInNlc3Npb25JZCI6ImRkYjJkYWE4LTllYWYtNDg2NC04NTk5LTUwZjUxMDk3OTZlMSIsInRlbmFudEd1aWQiOiJhOWQ3MTY0MC1kM2M2LTQ5YmMtYmRmYy0zYjQwMWVmMjM4ZjIiLCJjbGllbnRfaWQiOiJiNjQ1ODAwYTRhOGE0NzVkOGYxNWQzNjY3ZGQwMDFlNiIsIm9yZ0dyb3VwSWQiOiI2MjU3MjliNy1jNzZkLTQ1YTktODNlMS0wZTYzZTUwNjE2ZDMiLCJvcmdHcm91cEd1aWQiOiI2MjU3MjliNy1jNzZkLTQ1YTktODNlMS0wZTYzZTUwNjE2ZDMiLCJvdC1zY29wZXMiOiJDT09LSUUsQ09PS0lFX0ZSRUUsQ09PS0lFX1JFQUQiLCJzY29wZSI6W10sInRlbmFudElkIjoyMiwiZ3VpZCI6IjIyZGY0Mjg0LWI0M2QtNDE4NS04ODcwLWIzMjgxODg0MjdhMyIsImV4cCI6MTczMjM1NjcwNywiZXhwaXJlc19pbiI6MzE1MzYwMDAsImp0aSI6InN1WXRVVktLT1RkR2NyN2x6aE9wT1BfOTZ1OCIsImVtYWlsIjoiYTlkNzE2NDBkM2M2NDliY2JkZmMzYjQwMWVmMjM4ZjJAYXBpLm9uZXRydXN0LmNvbSJ9.LJMg2cedmVK2dYvQX_hg9vMSOw2vPxlUKCbNAQmH12OWtZT4EcjOo0wW1rXjE254drK1-NPgW7uW2EFTSbdRpj0XNawYMlXyV5vDSdR1cQo53_Ljpy4qTjHLAamuTkOUxNYPz6DWQm0VrKfEbjrtdOajxz5CJkIo57flmrreBobXiu6CTFe4hxoOAqA21slEnIqXA-gy-b6tyeLaKH0RH6si8ona6CeY5G5ziEIlN1Tl0SNtXbhI-tOO6ZZUxeDAAIk6wn5r1WMuAbTKob4LdqHD_9KhnGj_Xhqsmf7-4TK2E0E0wGvZ1S3n3Kw4d5rXrMeDgn5z2iKWVlu3I-7KOw"
# # OT_HOSTNAME = os.environ.get('OT_HOSTNAME')
OT_HOSTNAME = "app-uk.onetrust.com"
# # url = f"https://{OT_HOSTNAME}/api/cookiemanager/v1/script-integration/justerinis.com/downloadscriptv2"


# import requests

# url = f"https://{OT_HOSTNAME}/api/cookiemanager/v1/cookies"
# # payload = {
# #     "cookieName": "_ga_xxxxxxxxxx"
# # }
# headers = {
#     "accept": "application/json",
#     "content-type": "application/json",
#     "authorization": f"Bearer {OT_TOKEN}"
# }

# # print('categorising cookie: {} - {}'.format(cookie_name, site_domain))

# # response = requests.get(url, json=payload, headers=headers)
# response = requests.get(url, headers=headers)
# print(response.text)



# import requests

# # Replace these with your actual API credentials and endpoint
# endpoint = f'https://{OT_HOSTNAME}/v1/cookies'  # Example endpoint, check the documentation for the correct one

# headers = {
#     'Authorization': f'Bearer {OT_TOKEN}',
#     'Content-Type': 'application/json'
# }

# # Make the API request
# response = requests.get(endpoint, headers=headers)
# print(response.text)

# # if response.status_code == 200:
# #     cookies_data = response.json()
# #     cookie_source_urls = [cookie['sourceUrl'] for cookie in cookies_data['cookies']]
# #     print(cookie_source_urls)
# # else:
# #     print(f"Failed to fetch cookies data. Status code: {response.status_code}")


import requests
import json
url = f"https://{OT_HOSTNAME}/api/cookiemanager/v2/cookie-reports/search?language=en&countryCode=gb"

payload = { "domains": ["thebar.liquidcheckout.com"] }
headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": f"Bearer {OT_TOKEN}"
}

response = requests.post(url, json=payload, headers=headers)

print(json.loads(response.text))  

# import requests

# def get_onetrust_cookie_sources(api_key, data_domain):
#     """Retrieves cookie source URLs from OneTrust API.

#     Args:
#         api_key: Your OneTrust API key.
#         data_domain: Your OneTrust data domain (e.g., "companyname.onetrust.com").

#     Returns:
#         List of cookie source URLs, or None if an error occurred.
#     """

#     base_url = f"https://{data_domain}/api/v1"
#     headers = {
#         "Authorization": f"Bearer {api_key}",
#         "Content-Type": "application/json"
#     }

#     # 1. Get Scan IDs
#     scans_endpoint = f"{base_url}/scans"
#     scans_response = requests.get(scans_endpoint, headers=headers)
    
#     if scans_response.status_code != 200:
#         print(f"Error retrieving scans: {scans_response.status_code}")
#         return None

#     scan_ids = [scan["id"] for scan in scans_response.json()["data"]]

#     # 2. Fetch Cookie Details for Each Scan
#     cookie_sources = []
#     for scan_id in scan_ids:
#         cookies_endpoint = f"{base_url}/scans/{scan_id}/cookies"
#         cookies_response = requests.get(cookies_endpoint, headers=headers)
        
#         if cookies_response.status_code != 200:
#             print(f"Error retrieving cookies for scan {scan_id}: {cookies_response.status_code}")
#             continue

#         for cookie in cookies_response.json()["data"]:
#             cookie_sources.append(cookie["sourceURL"])

#     return cookie_sources


# # Example Usage (replace with your credentials)
# api_key = "your_api_key"
# data_domain = "your_data_domain.onetrust.com"

# cookie_sources = get_onetrust_cookie_sources(OT_TOKEN, OT_HOSTNAME)

# if cookie_sources:
#     print("Cookie Source URLs:")
#     for url in cookie_sources:
        # print(url)
    

# import requests


# # url = f"https://{OT_HOSTNAME}/api/discovery-scan-configuration/v2/scan-profiles?createdFrom=2024-07-01"
# # url = f"https://{OT_HOSTNAME}/api/discovery-scan-configuration/v3/system?createdFrom=2024-07-01"
# # url = "https://customer.my.onetrust.com/api/cookiemanager/v2/websites?sort=ScanStatus%2CASC"
# url = f"https://{OT_HOSTNAME}/api/cookiemanager/v2/websites?sort=ScanStatus%2CASC"


# headers = {
#     "accept": "application/json",
#     "content-type": "application/json",
#     "authorization": f"Bearer {OT_TOKEN}"
# }
# response = requests.get(url, headers=headers)

# print(response.text)

