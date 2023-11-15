import os
import secrets
import pandas as pd
import json

from flask import Flask, redirect, url_for, session, render_template
from flask_oauthlib.client import OAuth


import bigquery_queries

from google.cloud import secretmanager
from extensions import cache



app = Flask(__name__)
cache.init_app(app, config={'CACHE_TYPE': 'SimpleCache'})



app.secret_key = secrets.token_hex(16)
oauth = OAuth(app)


project_id = 'diageo-cookiebase'
secret_id = 'cookie_app_auth'
version_id = '1'

# retrieve auth secret from gcp
def get_secret(project_id, secret_id, version_id="latest"):
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/{project_id}/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(name=name)
    return response.payload.data.decode('UTF-8')

# Get the secret.
secret_value = get_secret(project_id, secret_id)


google = oauth.remote_app(
    'google',
    consumer_key='191126329179-2vtgi9rp3vs4ke0ig6f3n11826par66f.apps.googleusercontent.com',
    consumer_secret= secret_value,
    request_token_params={
        'scope': 'email',
    },
    base_url='https://www.googleapis.com/oauth2/v1/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
)

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login')
def login():
    return google.authorize(callback=url_for('authorized', _external=True))

@app.route('/logout')
def logout():
    session.pop('google_token')
    return redirect(url_for('index'))

@app.route('/login/authorized')
def authorized():
    response = google.authorized_response()
    if response is None or response.get('access_token') is None:
        return 'Access denied: reason={} error={}'.format(
            request.args['error_reason'],
            request.args['error_description']
        )

    session['google_token'] = (response['access_token'], '')
    user_info = google.get('userinfo')
    print(user_info.data)
    # return 'Logged in as: {}'.format(user_info.data['email'])
    # return render_template('home.html', user=user_info.data)
    return redirect(url_for('home'))

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

@app.route('/home')
def home():
    if 'google_token' in session:
        user_info = google.get('userinfo')
        if user_info.status == 200:
            print(user_info.data)

            return render_template('index.html',user=user_info.data, show_search_bar=False)
    else:
            # Handle HTTP error from Google API
            return redirect(url_for('login'))


@app.route('/cache-keys')
def cache_keys():
    return str(cache.cache._cache.keys())


@app.route('/scan-summary')
def scan_summary():
    if 'google_token' in session:
        user_info = google.get('userinfo')
        if user_info.status == 200:
            print(user_info.data)


            all_cookies = bigquery_queries.all_cookies()
            all_cookies_headers = all_cookies.columns.tolist()

            summary_df =  all_cookies.groupby('cookie_siteURL').agg(
                total_cookies = pd.NamedAgg(column='cookie_name', aggfunc='count'), last_scan = pd.NamedAgg(column='last_scan', aggfunc='max')
            ).reset_index()

            summary_dict = summary_df.to_dict(orient='records')
            summary_headers =  summary_df.columns.tolist()

            # list of columns to pull from results
            detailed_data_columns = ['cookie_name','cookie_vendor','cookie_siteURL', 'cookie_phase', 'cookie_value','cookie_domain', 'expires_in_time']
            detailed_data_df = all_cookies[detailed_data_columns]
            # renaming columns
            detailed_data_renamed = detailed_data_df.rename(columns={
                'cookie_name':'Name',
                'cookie_vendor': 'Vendor',
                'cookie_siteURL':'Site URL',
                'cookie_phase' : 'Phase',
                # 'cookie_sameSite': 'SameSite',
                'cookie_value' : 'Value',
                'cookie_domain': 'Domain',
                # 'cookie_path' : 'Path',
                # 'cookie_expires' : 'Expires',
                # 'cookie_httpOnly' : 'HttpOnly',
                # 'cookie_secure' : 'Secure'
                'expires_in_time': 'Expiration time'

            })
            detailed_headers = detailed_data_renamed.columns.tolist()




            for dictionary in summary_dict:
                for key, value in dictionary.items():
                    print(f'{key}: {value}')


            detailed_data = {k: v.to_dict(orient='records') for k, v in detailed_data_renamed.groupby('Site URL')}

            print(detailed_data)

            # print(summary_table)

            # results = query_job.result()

            # headers = [schema_field.name for schema_field in results.schema]
            # data = [dict(row) for row in results]

            # print(data)
            # print(headers)

            user_info = google.get('userinfo')
            return render_template('scan_summary.html', summary_headers=summary_headers, detailed_headers=detailed_headers, summary_data=summary_dict, detailed_data=detailed_data,  user=user_info.data, page='Cookie Scan Summary', show_search_bar=True)

        else:
            # Handle HTTP error from Google API
            return redirect(url_for('login'))
    else:
        # User is not logged in
        return redirect(url_for('login'))

@app.route('/scan-errors')
def scan_errors():
    if 'google_token' in session:
        user_info = google.get('userinfo')
        if user_info.status == 200:
            print(user_info.data)

            scan_errors = bigquery_queries.scan_errors()
            scan_errors_data = scan_errors[['site_url','error_clean', 'last_scan' ]]
            scan_errors_data_dict = scan_errors_data.to_dict(orient='records')
            print(scan_errors_data_dict)

            errors_table_headers = scan_errors_data.columns.tolist()
            print(errors_table_headers)


            user_info = google.get('userinfo')
            return render_template('scan_errors.html', errors_headers=errors_table_headers, errors_data=scan_errors_data_dict, user=user_info.data, page='Cookie Scan Errors', show_search_bar=True )
        else:
        # Handle HTTP error from Google API
            return redirect(url_for('login'))
    else:
        # User is not logged in
        return redirect(url_for('login'))

# @app.route('/categories')
# def categories():
#     if 'google_token' in session:
#         user_info = google.get('userinfo')
#         if user_info.status == 200:

#             categories = ['Analytics', 'Marketing', 'Personalization', 'Other']


#             scan_errors = bigquery_queries.scan_errors()
#             scan_errors_data = scan_errors[['site_url','error_clean', 'last_scan' ]]
#             scan_errors_data_dict = scan_errors_data.to_dict(orient='records')
#             print(scan_errors_data_dict)

#             errors_table_headers = scan_errors_data.columns.tolist()
#             print(errors_table_headers)


#             user_info = google.get('userinfo')
#             return render_template('scan_errors.html', errors_headers=errors_table_headers, errors_data=scan_errors_data_dict, user=user_info.data, page='Cookie Scan Errors', show_search_bar=True )
#         else:
#         # Handle HTTP error from Google API
#             return redirect(url_for('login'))
#     else:
#         # User is not logged in
#         return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
