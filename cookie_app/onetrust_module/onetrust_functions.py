import csv
import pandas as pd
import json, requests, time
import os
import math


from onetrust_module.ot_config import apiSettings
from google.cloud import datastore
from google.cloud.datastore.query import PropertyFilter
from datetime import datetime

from google.cloud import secretmanager
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2 import service_account



# Settings
hostname=apiSettings["hostname"]
client_id=apiSettings["client_id"]
client_secret=apiSettings["client_secret"]
apiToken=apiSettings["api_token"]

datastore_client = datastore.Client()


columns = ['date', 'host', 'cookieName', 'lifespan', 'defaultCategory', 'cookieSource', 'defaulDescription', 'defaultThirdPartyDescription', 'expiry', 'thirdParty', 'cookieId', 'domain_cookie_id', 'domainName', 'displayGroupName', 'cookieCategoryID', 'domain_thirdParty', 'description']
cookies_file_path = 'cookies.csv'
cookie_list = []


cookie_file_exists = os.path.isfile(cookies_file_path) and os.path.getsize(cookies_file_path) > 0


# def get_cookies_for_domain(domain="diageo.com", apiToken=apiToken, hostname=hostname):
def get_cookies_per_domain(domain, apiToken=apiToken, hostname=hostname):
    # declaration of empty list for cookies
    domain_cookie_list = []

    # get cookies for specified domain
    url = f"https://{hostname}/api/cookiemanager/v2/cookie-reports/search?language=en&countryCode=gb"
    payload={ "domains": [domain]}
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": f"Bearer {apiToken}"
    }
    response = requests.post(url, json=payload, headers=headers)
    response_text = json.loads(response.text)
    response_data = response_text['content']
    for item in response_data:
        domain_cookie_list.append({
                'output_date': datetime.today().strftime('%Y-%m-%d'),
                'output_cookie_name': item.get('cookieName', ''),
                'output_lifespan': item.get('lifespan', ''),
                'output_host': item.get('host', ''),
                'output_default_category': item.get('defaultCategory', ''),
                'output_cookie_source': item.get('cookieSource', ''),
                'output_default_description': item.get('defaultDescription', '').replace("\n", "") if item.get('defaultDescription')else'',
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
        })

    print(domain_cookie_list)

    return domain_cookie_list



def save_cookies_csv(filename):
    with open('websites.json') as json_file:
        data = json.load(json_file)
        content = data['content']
        for item in content:
            print(item['domainName'])
            cookie_list.extend(get_cookies_per_domain(domain=item['domainName']))
            print(cookie_list)
            # print(item['domainName'])
            # domain_cookies = get_cookies_for_domain(domain=item['domainName'])
            # domain_cookies = get_cookies_for_domain(item['domainName'])

            # with open('cookies.csv', 'a') as csv_file:

                # csv_file.write(domain_cookies)

        cookies_dataframe = pd.DataFrame(cookie_list)
        cookies_dataframe.to_csv(filename,index=False)
        print(cookies_dataframe)


# Every group is the uploaded to datastore as an entity, each entity is a cookie
def upload_cookie_datastore_from_csv():
    cookie_panda = pd.read_csv("cookies_13052024.csv").sort_values(by=["output_cookie_name"], ascending=True)
    distinct_cookies = cookie_panda["output_cookie_name"].unique()
    # We group the df by cookie_name
    grouped = cookie_panda.groupby("output_cookie_name")

    for name, group_df in grouped:
        cookie_dict = {}
        cookie_name = ''

        # GCP has reserved the kinds that begin with two underscores so we add * to the beginning and end of the name
        if name.startswith('__'):
        #  /in ['__ca_test__', '__sharethis_cookie_test__', '__tld__', '__tld_test__']:
            cookie_name = '*{}*'.format(name)
        else:
            cookie_name = name

        categories= len(group_df.output_default_category.unique())
        unknown = ''
        if 'Unknown' in group_df.output_default_category.unique():
            unknown = True
        else:
            unknown = False
        
        cookie_dict["cookie_list"] = group_df[["output_cookie_name", "output_default_category", "output_host", "output_cookie_id"]].to_dict(orient='records')
        
        entity_key = datastore_client.key('Cookie', cookie_name)
        cookie = datastore.Entity(key=entity_key)

        cookie.update(
            {   
                "cookie_name": cookie_name,
                "categories": len(group_df.output_default_category.unique()),
                "unknown_categories": unknown,
                "host_list": group_df[["output_cookie_name", "output_default_category", "output_host", "output_cookie_id"]].to_dict(orient='records'),
            }
        )
        datastore_client.put(cookie)
        print('Cookie {} was uploaded succesfully uploaded to datastore'.format(cookie_name))

def entity_to_dict(entity):
    # for cookie in results:
        # print(type(cookie))
    # print(cookie)
        result = {}
        for key, value in entity.items():
            

            # print(f"{key}: {value}")
            if isinstance(value, list):
            # if value is datastore.Entity:
                # print(value)
                result[key] = [entity_to_dict(entity) for entity in value]
            else:
                result[key] = value
                # print("not entity")
            #     # print(f"{key}: {value}")
            # print(type(value))
        # print(result)
        return(result)

def get_datastore_data(kind):
    query = datastore_client.query(kind=kind)
    # query.add_filter(filter=PropertyFilter("unknown_categories", "=", True))
    # query.add_filter(filter=PropertyFilter("priority", ">=", 4))
    # query.order = ["cookie_name"]

    results = list(query.fetch())
    entities_as_dicts = [entity_to_dict(entity) for entity in results]
    # print(entities_as_dicts)
    # json_output = json.dumps(entities_as_dicts, ensure_ascii=False)
    # print(json_output)

    return entities_as_dicts

def read_diageo_categories():
    PROJECT_ID = "diageo-cookiebase"
    SECRET_NAME = "consent_catcher"

    # Replace with your spreadsheet ID
    SPREADSHEET_ID = "1C-AKv7Nml4ZHHtHY4pqsjW0WgQvKli7C"
    # SPREADSHEET_ID = "1vSTC-2Smw8wgXKFeex88yMwFDGyqQ9sseppL_i6RYUY"

    # Sheet name containing the data (replace if needed)
    SHEET_NAME = "Collated Cookie Categories"
    # SHEET_NAME = "URL List"
    # Range of cells to read (replace if needed)
    RANGE_NAME = "A2:A10"  # Reads from cell A1 to B5 (inclusive)
    SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]

    # Get credentials from Secret Manager
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{SECRET_NAME}/versions/latest"
    response = client.access_secret_version(name=name)
    print(response)
    credentials = response.payload.data.decode("UTF-8")
    credentials = json.loads(credentials)
    # credentials = service_accountCredentials.from_service_account_info(credentials)
    credentials = service_account.Credentials.from_service_account_info(
        credentials,
        scopes=SCOPES
    )
    
    try:
        service = build("sheets", "v4", credentials=credentials)

        # Call the Sheets API
        sheet = service.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID, range=f"{SHEET_NAME}!{RANGE_NAME}").execute()
        values = sheet.get("values", [])

        if not values:
            print("No data found.")
            return
        # print("Name, Major:")
        # for row in values:
        # # Print columns A and E, which correspond to indices 0 and 4.
        #     print(f"{row[0]}, {row[1]}")

        print(values)
    except HttpError as err:
        print(err)  

    # Return the data (you can modify this to fit your needs)
    # return {"data": values}
    print('done')

# read_diageo_categories()


import tempfile
import io
from googleapiclient.http import MediaIoBaseDownload


# The sheet is in XLSX format in drive so we have to first download the file, convert it to CSV and get the values
def download_xlsx_file_from_drive():
    PROJECT_ID = "diageo-cookiebase"
    SECRET_NAME = "consent_catcher"
    # Replace with your service account credentials path
    CREDENTIALS_FILE_PATH = "/path/to/your/credentials.json"

    # Replace with the file ID
    FILE_ID = "1C-AKv7Nml4ZHHtHY4pqsjW0WgQvKli7C"

    # Authenticate with Drive API
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{PROJECT_ID}/secrets/{SECRET_NAME}/versions/latest"
    response = client.access_secret_version(name=name)
    print(response)
    credentials = response.payload.data.decode("UTF-8")
    credentials = json.loads(credentials)
    credentials = service_account.Credentials.from_service_account_info(credentials)
    service = build("drive", "v3", credentials=credentials)

    try:
        request = service.files().get_media(fileId=FILE_ID)
        file = io.BytesIO()
        downloader = MediaIoBaseDownload(file, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}.")
        
        file.seek(0)

        with open('categories.xlsx', 'wb') as f:
            f.write(file.read())
            f.close()

        df = pd.DataFrame(pd.read_excel("categories.xlsx", sheet_name='Collated Cookie Categories')) 
        print(df)

    except HttpError as error:
        print(f"An error occurred: {error}")
        file = None

    return file.getvalue()


## The following functions reomves NaN and inf values from the data so JSON serialization can be done
def sanitise_data(data):
    if isinstance(data, dict):
        return {k: sanitise_data(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitise_data(v) for v in data]
    elif isinstance(data, float) and (math.isnan(data) or math.isinf(data)):
        return None
    else:
        return data


    
# download_xlsx_file_from_drive()
# get_datastore_data('Diageo Category')
# save_cookies_csv('cookies_13052024-2')
# upload_cookie_datastore_from_csv()



def save_cookies_json(website_data):
    """
    Retrieves cookies from each website in the provided JSON object and returns a JSON object containing all cookies.

    Args:
        website_data (dict): A JSON object containing website information,
                             including a 'content' key with website details.

    Returns:
        dict: A JSON object containing all retrieved cookies.
    """

    content = website_data.get('content', [])  # Handle potential missing 'content' key
    all_cookies = []  # List to store all cookies

    for item in content:
        domain_name = item.get('domainName')
        if domain_name:
            print(f"Processing domain: {domain_name}")
            cookie_list = get_cookies_per_domain(domain=domain_name)
            print(cookie_list)
            all_cookies.extend(cookie_list)  # Add cookies to the main list

    return all_cookies

# save_cookies_json({'content': [{'domainName': 'johnniewalker.com'}, {'domainName': 'donpaparum.com'}]})

def json_to_df():
    # content = [{'domainName': 'johnniewalker.com'}, {'domainName': 'donpaparum.com'}]
    content = [{
            "domainName": "justerinis.com",
            "domainId": "9addce0c-94f2-4065-a7f0-95dbc446d34e",
            "status": "COMPLETED",
            "lastScannedDate": "2024-05-03T14:17:29.960+00:00",
            "lastScannedTotalCookies": 31,
            "lastScannedTotalPages": 10694,
            "scheduledDateOfNextScan": "2024-06-02T00:12:24.147+00:00",
            "consentPolicyName": "Justerinis Policy",
            "scanError": "",
            "orgName": "Diageo",
            "externalOrgId": 'null',
            "overPageLimit": 'false'
        },
        {
            "domainName": "seagrams7.com",
            "domainId": "9b0f4ca2-d76e-4667-a627-cd0ecaab5be4",
            "status": "COMPLETED",
            "lastScannedDate": "2024-04-24T02:46:38.997+00:00",
            "lastScannedTotalCookies": 5,
            "lastScannedTotalPages": 2,
            "scheduledDateOfNextScan": "2024-05-24T02:46:25.637+00:00",
            "consentPolicyName": "Default Consent Policy",
            "scanError": "",
            "orgName": "Diageo",
            "externalOrgId": 'null',
            "overPageLimit": 'false'
        }]
    content_json = json.dumps(content)
    dataFrame = pd.read_json(content_json)
    print(dataFrame)    

json_to_df()