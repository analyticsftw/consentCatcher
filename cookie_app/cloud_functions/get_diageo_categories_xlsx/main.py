import pandas as pd
import json, requests, time
import io
import functions_framework

from google.cloud import secretmanager
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseDownload

@functions_framework.http
def read_diageo_categories(request):
    # event = request.get_json()
    # print(event)

    PROJECT_ID = "diageo-cookiebase"
    SECRET_NAME = "consent_catcher"
    FILE_ID = "1C-AKv7Nml4ZHHtHY4pqsjW0WgQvKli7C"

    # Authenticate with Drive API
    # The current file is an excel sheet, that's why it hjas to be donwloaded fitrst and then converted to a pandas dataframe
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
        # excel sheets have a limit in the sheets names of 31 characters, if the name has more characters the additional characters will not be captured
        df = pd.DataFrame(pd.read_excel("categories.xlsx", sheet_name="Collated Cookie Categories - Ol")) 
        # clean_df = df.loc[df['Cookie Name'].isnull ]
        df_selected_columns = df.iloc[:, [0,1,2]]

        # Any rows with all the cells empy will be dropped
        clean_df = df_selected_columns.dropna(how='all')
        # Print duplicates
        print(clean_df[clean_df.duplicated()])
        clean_df_deduped = clean_df.drop_duplicates(subset=['Cookie Name'], keep='first')
        clean_df_deduped.columns = ['cookie_name', 'diageo_category', 'category_id']
        dict_list_orient = clean_df_deduped.to_dict('records')
        print(dict_list_orient)
        return dict_list_orient
    except HttpError as error:
        print(f"An error occurred: {error}")
        file = None
        return(error)
    
read_diageo_categories('test')