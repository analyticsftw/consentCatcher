""" Retrieves all cookies identified by the OneTrust scanner on a website """

# Imports & includes
import json, requests, time
import pandas as pd
from consentCatcher.cookie_app.onetrust_module.ot_config import apiSettings
from datetime import datetime
import os

# Settings
hostname=apiSettings["hostname"]
client_id=apiSettings["client_id"]
client_secret=apiSettings["client_secret"]
apiToken=apiSettings["api_token"]



columns = ['date', 'host', 'cookieName', 'lifespan', 'defaultCategory', 'cookieSource', 'defaulDescription', 'defaultThirdPartyDescription', 'expiry', 'thirdParty', 'cookieId', 'domain_cookie_id', 'domainName', 'displayGroupName', 'cookieCategoryID', 'domain_thirdParty', 'description']
cookies_file_path = 'cookies.csv'
cookie_list = []


cookie_file_exists = os.path.isfile(cookies_file_path) and os.path.getsize(cookies_file_path) > 0


# def get_cookies_for_domain(domain="diageo.com", apiToken=apiToken, hostname=hostname):
def get_cookies_for_domain(domain, apiToken=apiToken, hostname=hostname):
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

    # print(cookies_list)

    return domain_cookie_list


def categorise_cookie_with_id(domain, cookiesIds, apiToken=apiToken, hostname=hostname):
    # url = f"https://{hostname}/api/cookiemanager/v2/categorizewithids"
    # url = f"https://{hostname}/api/cookiemanager/v2/categorize"
    # url = f"https://{hostname}/api/cookiemanager/v2/categorize"

    # # payload = {
    # #     "cookiesIds": ["7b153f1a-1e58-4b0e-9c0e-8f124e1429d0"],
    # #     "domain": "buchananswhisky.com"
    # # }
    # payload = {
    # "cookies": [
    #     {
    #         "host": "buchananswhisky.com",
    #         "name": "diageo-gateway"
    #     }
    # ],
    #     "domain": "buchananswhisky.com"
    # }
    # headers = {
    #     "accept": "application/json",
    #     "content-type": "application/json",
    #     "authorization": f"Bearer {apiToken}"
    # }
    # response = requests.post(url, json=payload, headers=headers)
    # print(response.text)
    url = f"https://{hostname}/api/cookiemanager/v1/cookies"

    payload = {
        "cookieId": "7b153f1a-1e58-4b0e-9c0e-8f124e1429d0",
        "cookieName": "diageo-gateway",
        "host": "buchananswhisky.com",
        "customCategoryName": "C0001"
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": f"Bearer {apiToken}"
    }

    response = requests.put(url, json=payload, headers=headers)

    print(response.text)

# categorise_cookie_with_id('buchananswhisky.com', '7b153f1a-1e58-4b0e-9c0e-8f124e1429d0')


# get_cookies_for_domain('johnniewalker.com')
# cookies_rows = get_cookies_for_domain('johnniewalker.com').split("\n")
# cookies_rows = get_cookies_for_domain('johnniewalker.com')


# cookies_dataframe = pd.DataFrame(columns=columns)
# cookies_dataframe = pd.DataFrame(get_cookies_for_domain('johnniewalker.com'))
# print(cookies_dataframe)

# for row in cookies_rows:
#     # print(len(item))
#     print(row)

# data = [row.split('" , "') for row in cookies_rows]

# for row in  data:
#     print(row)
#     print(len(row))


# cookies_dataframe = pd.DataFrame(columns=columns)
# cookies_dataframe = pd.concat([cookies_dataframe, cookies_rows], ignore_index=True)

# print(cookies_dataframe)

# print(cookies_list)


# def add_to_dataframe():
#     cookies_dataframe = pd.DataFrame(columns=columns)


# with open('websites.json') as json_file:
#     data = json.load(json_file)
#     content = data['content']
#     for item in content:
#         print(item['domainName'])
#         cookie_list.extend(get_cookies_for_domain(domain=item['domainName']))
#         print(cookie_list)
#         # print(item['domainName'])
#         # domain_cookies = get_cookies_for_domain(domain=item['domainName'])
#         # domain_cookies = get_cookies_for_domain(item['domainName'])

#         # with open('cookies.csv', 'a') as csv_file:

#             # csv_file.write(domain_cookies)

#     cookies_dataframe = pd.DataFrame(cookie_list)
#     cookies_dataframe.to_csv('cookies1.csv',index=False)
#     print(cookies_dataframe)



# data = [[value.strip().strip('\"') for value in row] for row in cookies_rows]
# print(data)
# cookies_dataframe = pd.DataFrame(data, columns=columns)

# print(cookies_dataframe)

# # Get all websites from API dump
# with open('websites.json') as json_file:
#     data = json.load(json_file)
#     content = data['content']
#     for item in content:
#         print(item['domainName'])
#         # domain_cookies = get_cookies_for_domain(domain=item['domainName'])
#         domain_cookies = get_cookies_for_domain(item['domainName'])
#         writer  =
#         with open('cookies.csv', 'a') as csv_file:

#             writer.writerow(header)
#             csv_file.write(domain_cookies)
