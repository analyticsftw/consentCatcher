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
        OT_TOKEN = os.environ.get('OT_TOKEN')
        OT_HOSTNAME = os.environ.get('OT_HOSTNAME')
    except KeyError as e:
        logging.error(f"Missing environment variable: {e}")
        return "Error: Missing required environment variables.", 500

    categorised_cookies = []
    categorised_ids = []
    diageo_categories_obj = {}  # Dictionary for faster lookups

    try:
        diageo_categories = get_datastore_data('Diageo Category')
        # print(diageo_categories)
        for category in diageo_categories:
            diageo_categories_obj[category['cookie_name']] = category

        diageo_cookies = get_datastore_data('Cookies by name')
        for cookie in diageo_cookies:
            if cookie.get('unknown_categories'):
                for host in cookie['host_list']:
                    if host['output_default_category'] == 'Unknown':
                        cookie_name = host['output_cookie_name']
                        if host['output_cookie_id'] not in categorised_ids:
                            if cookie_name in diageo_categories_obj:
                                try:
                                    print('categorising cookie {}'.format(cookie_name))
                                    categorise_cookie(
                                        # host['output_host'], cookie_name, host['output_cookie_id'],
                                        host['output_domain_name'], cookie_name, host['output_cookie_id'],
                                        diageo_categories_obj[cookie_name]['category_id'], OT_TOKEN, OT_HOSTNAME
                                    )
                                    categorised_cookies.append({
                                        'cookie_name': cookie_name,
                                        'cookie_domain': host['output_domain_name'],
                                        'cookie_host': host['output_host'],
                                        'cookie_id': host['output_cookie_id'],
                                        'old_category': host['output_default_category'],
                                        'new_category': diageo_categories_obj[cookie_name]['category_name']

                                    })
                                    categorised_ids.append(host['output_cookie_id'])
                                except requests.RequestException as e:
                                    logging.error(f"Error categorizing cookie {cookie_name}: {e}")
                            else:
                                logging.info(f'Cookie not in Diageo list: {cookie_name}')
                        else:
                            print(f'Cookie already categorized: {cookie_name}')
                            logging.info(f'Cookie already categorized: {cookie_name}')
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
    try:
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

        print('categorising cookie: {} - {}'.format(cookie_name, site_domain))
        
        response = requests.put(url, json=payload, headers=headers)
        print(response.text)
        return {'status': 'success'}
    except requests.RequestException as e:
        logging.error(f"Error categorizing cookie {cookie_name}: {e}")
        return {'status': 'error'}


def update_categorised_cookies_ds(categorised_array):


    date = datetime.datetime.now().strftime("%d-%m-%Y")
    # hour = datetime.datetime.now().strftime("%H:%M:%S")
    # print(date, hour)

    entity_key = datastore_client.key('Categorised Cookies by date', date)
    categorised = datastore.Entity(key=entity_key)

    categorised.update(
        {   
            "last_updated": datetime.datetime.now(),
            "cookies_categorised": len(categorised_array),
            "categorised_list": categorised_array
        }
    )
    
    print('Updating categorised cookies in datastore')
    datastore_client.put(categorised)
    
    return categorised_array
