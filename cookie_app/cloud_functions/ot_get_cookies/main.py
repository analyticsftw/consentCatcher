import functions_framework
import os
import requests
import json
import pandas as pd
from google.cloud import datastore
from datetime import datetime
import logging  # Import logging module


@functions_framework.http
def cookies_json(request):
    cookie_list = []

    try:
        websites = request.get_json(silent=True).get('websites')
        websites_json = json.loads(websites)
    except json.JSONDecodeError:
        logging.error("Invalid JSON format in the request.")
        return "Invalid JSON format", 400  # Bad Request
    
    OT_TOKEN = os.environ.get('OT_TOKEN')
    OT_HOSTNAME = os.environ.get('OT_HOSTNAME')

    if not OT_TOKEN or not OT_HOSTNAME:
        logging.error("Missing OneTrust environment variables.")
        return "Error: Missing required environment variables.", 500
    
    try:
        content = websites_json['content']  # Directly access 'content' assuming it exists
        for item in content:
            domain_name = item['domainName']
            try:
                # Fetch cookies for each domain and add them to the list
                cookie_list.extend(get_cookies_per_domain(domain_name, OT_TOKEN, OT_HOSTNAME))
            except requests.RequestException as e:
                logging.error(f"Error fetching cookies for domain '{domain_name}': {e}")
                # Consider adding a more specific error message here or continue to the next domain

        cookies_dataframe = pd.DataFrame(cookie_list)
        cookies_dataframe.to_csv('cookies.csv', index=False)
        upload_cookie_datastore_from_csv('cookies.csv')

        return 'The cookies database has been updated'
    except KeyError as e:
        logging.error(f"Missing key in websites JSON: {e}")
        return "Error: Missing key in websites JSON.", 400


def get_cookies_per_domain(domain, apiToken, hostname):
    domain_cookie_list = []
    datastore_client = datastore.Client()

    try:
        url = f"https://{hostname}/api/cookiemanager/v2/cookie-reports/search?language=en&countryCode=gb"
        payload = {"domains": [domain]}
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Bearer {apiToken}"
        }
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()  # Raise an exception for bad responses
        response_data = response.json().get('content', [])
        # print(response_data)
        for item in response_data:
            cookie_details = {
                'output_date': datetime.today().strftime('%Y-%m-%d'),
                'output_cookie_name': item.get('cookieName', ''),
                'output_lifespan': item.get('lifespan', ''),
                'output_host': item.get('host', ''),
                'output_default_category': item.get('defaultCategory', ''),
                'output_cookie_source': item.get('cookieSource', ''),
                'output_default_description': item.get('defaultDescription', '').replace("\n", "") if item.get('defaultDescription') else '',
                'output_default_third_party_description': item.get('defaultThirdPartyDescription', ''),
                'output_expiry': item.get('expiry', ''),
                'output_third_party': item.get('thirdParty', ''),
                'output_cookie_id': item['domainCookieInfoDtoList'][0]['cookieId'] if item.get('domainCookieInfoDtoList') else '',
                'output_domain_cookie_id': item['domainCookieInfoDtoList'][0]['domainCookieId'] if item.get('domainCookieInfoDtoList') else '',
                'output_domain_name': item['domainCookieInfoDtoList'][0]['domainName'] if item.get('domainCookieInfoDtoList') else '',
                'output_display_group_name': item['domainCookieInfoDtoList'][0]['displayGroupName'] if item.get('domainCookieInfoDtoList') else '',
                'output_cookie_category_id': item['domainCookieInfoDtoList'][0]['cookieCategoryID'] if item.get('domainCookieInfoDtoList') else '',
                'output_domain_third_party': item['domainCookieInfoDtoList'][0]['thirdParty'] if item.get('domainCookieInfoDtoList') else '',
                'output_description': item['domainCookieInfoDtoList'][0]['description'].replace("\n", "") if item.get('domainCookieInfoDtoList') and item['domainCookieInfoDtoList'][0].get('description') else ''
            }
    
            domain_cookie_list.append(cookie_details)
        entity_key = datastore_client.key('Cookies by domain', domain)
        domain_scanned = datastore.Entity(key=entity_key)
        domain_scanned.update(
            {   
                "domain_name": domain,
                "last_updated": datetime.now(),
            }
        )
        domain_cookies = []
        for cookie in domain_cookie_list:
            cookie_dict = {
                'cookie_name': cookie['output_cookie_name'],
                'cookie_category': cookie['output_default_category'],
                'host': cookie['output_host'],
                'cookie_id': cookie['output_cookie_id'],
                'cookie_description': cookie['output_default_description'],
                'third_party': cookie['output_third_party'],
                'expiry': cookie['output_expiry'],
                'lifespan': cookie['output_lifespan'],
                'source': cookie['output_cookie_source'],
                'third_party_description': cookie['output_default_third_party_description'],
                'domain_cookie_id': cookie['output_domain_cookie_id'],
                'domain_name': cookie['output_domain_name'],
                'display_group_name': cookie['output_display_group_name'],
                'cookie_category_id': cookie['output_cookie_category_id'],
                'domain_third_party': cookie['output_domain_third_party'],
                'description': cookie['output_description'],
                'date': cookie['output_date']
            }
            domain_cookies.append(cookie_dict)
        domain_scanned['cookies'] = domain_cookies
        datastore_client.put(domain_scanned)
        print(f'Domain {domain} with cookies stored successfully.')

        return domain_cookie_list
    
    except requests.RequestException as e:
        logging.error(f"Error fetching cookies for domain '{domain}': {e}")
        return []  # Return an empty list to indicate no cookies were fetched for this domain

    

def upload_cookie_datastore_from_csv(filename):
    datastore_client = datastore.Client()
    cookie_panda = pd.read_csv(filename).sort_values(by=["output_cookie_name"], ascending=True)
    distinct_cookies = cookie_panda["output_cookie_name"].unique()
    # We group the df by cookie_name
    grouped = cookie_panda.groupby("output_cookie_name")

    for name, group_df in grouped:
        cookie_dict = {}
        cookie_name = ''
        # GCP has reserved the kinds that begin with two underscores so we add * to the beginning and end of the name
        if name.startswith('__'):
            cookie_name = '*{}*'.format(name)
        else:
            cookie_name = name
        
        categories= len(group_df.output_default_category.unique())
        unknown = ''
        if 'Unknown' in group_df.output_default_category.unique():
            unknown = True
        else:
            unknown = False
        
        # cookie_dict["cookie_list"] = group_df[["output_cookie_name", "output_default_category", "output_host", "output_cookie_id"]].to_dict(orient='records')
        # cookie_dict["cookie_list"] = group_df[["output_cookie_name", "output_default_category", "output_domain_name", "output_cookie_id"]].to_dict(orient='records')
        
        entity_key = datastore_client.key('Cookies by name', cookie_name)
        cookie = datastore.Entity(key=entity_key)

        cookie.update(
            {   
                "cookie_name": cookie_name,
                "categories": len(group_df.output_default_category.unique()),
                "unknown_categories": unknown,
                "host_list": group_df[["output_cookie_name", "output_default_category", "output_domain_name", "output_host", "output_domain_third_party",  "output_cookie_id"]].to_dict(orient='records'),
                "last_updated": datetime.now()

            }
        )
        datastore_client.put(cookie)
        print('Cookie {} was uploaded succesfully uploaded to datastore'.format(cookie_name))

    return 'success'