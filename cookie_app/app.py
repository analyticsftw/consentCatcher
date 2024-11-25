import os
import secrets
import pandas as pd
import json

from flask import Flask, redirect, url_for, session, render_template, jsonify
from flask_oauthlib.client import OAuth

import bigquery_queries
from google.cloud import secretmanager
from extensions import cache
from onetrust_module.onetrust_functions import get_datastore_data
from onetrust_module.onetrust_functions import sanitise_data

# from categoriseCookies import read_cookie_registry

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
            scan_errors_data = scan_errors[['site_url','error_clean', 'error_date' ]]
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

@app.route('/cookie-categories')
def cookie_categories():
    if 'google_token' in session:
        user_info = google.get('userinfo')
        if user_info.status == 200:
            print(user_info.data)

            cookie_categories = bigquery_queries.cookie_categories()
            cookie_categories_data = cookie_categories[['cookie_siteURL','cookie_name','cookie_category', 'cookie_description', 'suggested_category', 'suggested_description' ]]
            cookie_categories_data_dict = cookie_categories.to_dict(orient='records')
            print(cookie_categories_data_dict)

            cookie_categories_headers = cookie_categories_data.columns.tolist()
            print(cookie_categories_headers)


            user_info = google.get('userinfo')
            return render_template('cookie_categories.html', cookie_categories_headers=cookie_categories_headers, cookie_categories_data=cookie_categories_data_dict, user=user_info.data, page='Cookie Categories', show_search_bar=True )
        else:
        # Handle HTTP error from Google API
            return redirect(url_for('login'))
    else:
        # User is not logged in
        return redirect(url_for('login'))

@app.route('/cookie-sources')
def cookie_sources():
    if 'google_token' in session:
        user_info = google.get('userinfo')
        if user_info.status == 200:
            print(user_info.data)

            cookie_sources = bigquery_queries.cookie_sources()
            cookie_sources_data = cookie_sources[['site_scanned','cookie_siteURL','cookie_name', 'cookie_source' ]]
            cookie_sources_data_dict = cookie_sources.to_dict(orient='records')
            print(cookie_sources_data_dict)

            cookie_sources_headers = cookie_sources_data.columns.tolist()
            print(cookie_sources_headers)


            user_info = google.get('userinfo')
            return render_template('cookie_sources.html', cookie_sources_headers=cookie_sources_headers, cookie_sources_data=cookie_sources_data_dict, user=user_info.data, page='Cookie Sources', show_search_bar=True )
        else:
        # Handle HTTP error from Google API
            return redirect(url_for('login'))
    else:
        # User is not logged in
        return redirect(url_for('login'))


ot_authorized_users = ['andres@mightyhive.com', 'helen@mightyhive.com', 'julien@mightyhive.com']
@app.route('/onetrust-cookies')
def onetrust_cookies():
    if 'google_token' in session:
        user_info = google.get('userinfo')
        if user_info.status == 200:
            if user_info.data['email'] in ot_authorized_users:
                print(user_info.data['email'])
                # print('reading cookies')
                # onetrust_cookies_headers = {
                #     'main' : ['Cookie Name','Unknown Categories', 'Categories'],
                #     'list' : ['Category', 'Site', 'Cookie Id', 'Cookie Name']
                # }
                # print(type(onetrust_cookies_headers))
                # onetrust_cookies_data = get_datastore_data('Cookie')
                # print(onetrust_cookies_data)
                tables = [
                    {'name' : 'Diageo Cookies from by Cookie',
                     'id' : 'diageo_cookies'
                    },
                    {'name' : 'Diageo Cookie Categories',
                      'id' : 'diageo_cookie_categories' 
                    },
                    {'name' : 'Diageo Cookie Categorisation',
                     'id' : 'diageo_cookie_categorisation'
                    },
                ]
                user_info = google.get('userinfo')
                return render_template('onetrust_cookies.html', tables=tables, user=user_info.data, page='Onetrust Cookies', show_search_bar=True )
                # return render_template('onetrust_cookies.html', onetrust_cookies_data=onetrust_cookies_data, onetrust_cookies_headers=onetrust_cookies_headers, user=user_info.data, page='Onetrust Cookies', show_search_bar=True )
            else: 
                return "Unauthorised User"
        else:
        # Handle HTTP error from Google API
            return redirect(url_for('login'))
    else:
        # User is not logged in
        return redirect(url_for('login'))
    
@app.route('/get_table_data/diageo_cookies')
def get_table_data():
    if 'google_token' in session:
        user_info = google.get('userinfo')
        if user_info.status == 200:
            if user_info.data['email'] in ot_authorized_users:
                print(user_info.data['email'])
                print('reading cookies')
                # headers = {
                #     'main' : ['Cookie Name','Unknown Categories', 'Categories'],
                #     'list' : ['Category', 'Site', 'Cookie Id', 'Cookie Name']
                # }
                headers = ['cookie_name', 'unknown_categories', 'categories']
                # rows = [['one', 'two', 'three', 'four']]
                # print(type(onetrust_cookies_headers))
                rows = get_datastore_data('Cookie')
                print(rows)
                data = {
                    'headers' : headers,
                    'rows' : rows
                }
                sanitised_data = sanitise_data(data)
                # print(onetrust_cookies_data)
                user_info = google.get('userinfo')
                # print(jsonify(data))
                return jsonify(sanitised_data)
                # print(onetrust_cookies_data)
                # return onetrust_cookies_data
            else: 
                return "Unauthorised User"
        else:
        # Handle HTTP error from Google API
            return redirect(url_for('login'))
    else:
        # User is not logged in
        return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
