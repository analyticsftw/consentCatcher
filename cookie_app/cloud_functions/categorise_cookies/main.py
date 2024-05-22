import functions_framework
import os
import requests
import datetime
import logging
from google.cloud import datastore

datastore_client = datastore.Client()

@functions_framework.http
def read_diageo_categories(request):
    try:
        OT_TOKEN = os.environ.get('OT_TOKEN', 'OT_TOKEN is not defined')
        OT_HOSTNAME = os.environ.get('OT_HOSTNAME', 'OT_HOSTNAME is not defined')
    except KeyError as e:
        logging.error(f"Missing environment variable: {e}")
        return "Error: Missing required environment variables.", 500

    categorised_cookies = []
    diageo_categories_obj = {}  # Dictionary for faster lookups

    try:
        diageo_categories = get_datastore_data('Diageo Category')
        for category in diageo_categories:
            diageo_categories_obj[category['cookie_name']] = category

        diageo_cookies = get_datastore_data('Cookie')
        for cookie in diageo_cookies:
            if cookie.get('unknown_categories'):
                for host in cookie['host_list']:
                    if host['output_default_category'] == 'Unknown':
                        cookie_name = host['output_cookie_name']
                        if cookie_name in diageo_categories_obj:
                            try:
                                categorise_cookie(
                                    host['output_host'], cookie_name, host['output_cookie_id'],
                                    diageo_categories_obj[cookie_name]['category_id'], OT_TOKEN, OT_HOSTNAME
                                )
                                categorised_cookies.append({
                                    'cookie_name': cookie_name,
                                    'cookie_host': host['output_host'],
                                    'cookie_id': host['output_cookie_id'],
                                    'category_id': diageo_categories_obj[cookie_name]['category_id']
                                })
                            except requests.RequestException as e:
                                logging.error(f"Error categorizing cookie {cookie_name}: {e}")
                        else:
                            logging.info(f'Cookie not in Diageo list: {cookie_name}')
        update_categorised_cookies_ds(categorised_cookies)
    except Exception as e:  # Catch any unexpected errors
        logging.error(f"An unexpected error occurred: {e}")
        return "Error: An unexpected error occurred.", 500

    return 'success'

def entity_to_dict(entity):
    result = {}
    for key, value in entity.items():
        if isinstance(value, list):
            result[key] = [entity_to_dict(entity) for entity in value]
        else:
            result[key] = value
    return(result)

def get_datastore_data(kind):
    query = datastore_client.query(kind=kind)
    results = list(query.fetch())  
    entities_as_dicts = [entity_to_dict(entity) for entity in results]
    return entities_as_dicts

def categorise_cookie(site_domain, cookie_name, cookie_id, category_id,  ot_api_token, ot_hostname):
    url = f"https://{ot_hostname}/api/cookiemanager/v1/cookies"
    payload = {
        "cookieId": cookie_id,
        "cookieName": cookie_name,
        "host": site_domain,
        "customCategoryName": category_id
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "authorization": f"Bearer {ot_api_token}"
    }

    print('categorising cookie: ', cookie_name)
    
    response = requests.put(url, json=payload, headers=headers)
    print(response.text)
    return {'status': 'success'}


def update_categorised_cookies_ds(categorised_array):

    date = datetime.datetime.now().strftime("%d-%m-%Y")
    hour = datetime.datetime.now().strftime("%H:%M:%S")
    print(date, hour)

    entity_key = datastore_client.key('Categorised Cookies', date)
    categorised = datastore.Entity(key=entity_key)

    categorised.update(
        {   
            "date": date,
            "time": hour,
            "cookies_categorised": len(categorised_array),
            "categorised_list": categorised_array
        }
    )
    
    print('Updating categorised cookies in datastore')
    datastore_client.put(categorised)

    return categorised_array