import pandas as pd
from google.cloud import datastore
import requests
import math
import functions_framework
from cloudevents.conversion import to_structured
from cloudevents.http import CloudEvent


@functions_framework.http
def update_datastore_diageo_categories(request):
    datastore_client = datastore.Client()
    datastore_kind = 'Diageo Category'
    get_categories_url = 'https://europe-west4-diageo-cookiebase.cloudfunctions.net/get_diageo_categories_xlsx'

    try:
        attributes = {
            'datacontenttype': 'application/json',
            'type': 'diageo.categories.db.update',
            'datacontenttype': 'application/json',
            'source': 'https://europe-west4-diageo-cookiebase.cloudfunctions.net/get_diageo_categories_xlsx',
        }
        data = {
            'sheet_id' : '1C-AKv7Nml4ZHHtHY4pqsjW0WgQvKli7'
        }

        event = CloudEvent(attributes, data)
        print('printing event')
        print(event)
        # Convert the event to a structured HTTP request
        headers, body = to_structured(event)

        # Send the request to the target
        response = requests.post(get_categories_url, headers=headers, data=body, timeout=10)
        # If the response was successful, no Exception will be raised
        response.raise_for_status()

        for category in response.json():
            # don't do anything if the category_id is NaN
            if isinstance(category["category_id"], float) and math.isnan(category["category_id"]):
                print("Category id is NAN {}".format(category))
            # if the category_id is a string, then we know it's a category
            else:
                print("Category id is valid {}".format(category))
                print(category)
                # All kind names that begin with two underscores are reserved by GCP, so we add * to the beginning and end of the name
                # kind_name = ''
                # if category['cookie_name'].startswith('__'):
                #     kind_name = '*{}*'.format(category['cookie_name'])
                # else:
                #     kind_name = category['cookie_name']

                # entity_key = datastore_client.key(datastore_kind, kind_name)
                # category_entity = datastore.Entity(key=entity_key)

                # category_entity.update(
                #     {
                #         'cookie_name': category['cookie_name'],
                #         'category_name': category['diageo_category'], 
                #         'category_id': category['category_id']
                #     }
                # )

                # datastore_client.put(category_entity)
                # print('Cookie {} was uploaded succesfully uploaded to datastore'.format(category_entity.get('cookie_name'))) 
        return response.text 
    except Exception as e:
        print(e)
        return 'Error getting categories'

update_datastore_diageo_categories('test')
    

    # datastore_client = datastore.Client()

    # cookie_panda = pd.read_csv("cookies1.csv").sort_values(by=["output_cookie_name"], ascending=True)
    # distinct_cookies = cookie_panda["output_cookie_name"].unique()
    # # We group the df by cookie_name
    # grouped = cookie_panda.groupby("output_cookie_name")

    # for name, group_df in grouped:
    #     cookie_dict = {}
    #     cookie_name = ''

    #     # All kind names that begin with two underscores are reserved by GCP, so we add * to the beginning and end of the name
    #     if name.startswith('__'):
    #         cookie_name = '*{}*'.format(name)
    #     else:
    #         cookie_name = name

    #     catgeories= len(group_df.output_default_category.unique())
    #     unknown = ''
    #     if 'Unknown' in group_df.output_default_category.unique():
    #         unknown = True
    #     else:
    #         unknown = False
        
    #     cookie_dict["cookie_list"] = group_df[["output_cookie_name", "output_default_category", "output_host", "output_cookie_id"]].to_dict(orient='records')
        
    #     entity_key = datastore_client.key('Cookie', cookie_name)
    #     cookie = datastore.Entity(key=entity_key)

    #     cookie.update(
    #         {   
    #             "cookie_name": cookie_name,
    #             "categories": len(group_df.output_default_category.unique()),
    #             "unknown_categories": unknown,
    #             "host_list": group_df[["output_cookie_name", "output_default_category", "output_host", "output_cookie_id"]].to_dict(orient='records'),
    #         }
    #     )
    #     datastore_client.put(cookie)
    #     print('Cookie {} was uploaded succesfully uploaded to datastore'.format(cookie_name))

