
import os
from flask import Flask, request, jsonify
from playwright.sync_api import sync_playwright, expect
import os.path
from datetime import datetime
import time
import pandas as pd


app = Flask(__name__)


def initiate_site_scan(myURL):
    cookies_file = 'scan_cookies_data.csv'
    errors_file = 'scan_erors_data.csv'
    print('starting scan process of {}'.format(myURL), flush=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()
        print('going to the site {}'.format(myURL), flush=True)
        page.goto(myURL)
        page.wait_for_load_state('networkidle')

        # cookies_dataframe = pd.DataFrame(columns=['name','value','domain','path','expires','httpOnly','secure','sameSite','phase'])

		#PAGE LOAD
        load_cookies = context.cookies()
        load_cookies_df = pd.DataFrame(load_cookies)
        load_cookies_df['cookie_siteURL'] = page.url
        load_cookies_df['cookie_phase'] = 'pageload'
        load_cookies_df['cookie_date'] = datetime.now()
        print(load_cookies_df, flush=True)
        # load_cookies_df.to_csv(cookies_file, mode='a', header=True, index=False)


		# CONSENT
        expect(page.locator('#onetrust-accept-btn-handler')).to_be_visible()
        page.locator('#onetrust-accept-btn-handler').click()

        consent_cookies = context.cookies()
        consent_cookies_df = pd.DataFrame(consent_cookies)
        consent_cookies_df['cookie_siteURL'] = page.url
        consent_cookies_df['cookie_phase'] = 'consent'
        consent_cookies_df['cookie_date'] = datetime.now()
        print(consent_cookies_df, flush=True)
        # consent_cookies_df.to_csv(cookies_file, mode='a', header=True, index=False)


        # AGE GATE
        expect(page.locator('#age_content')).to_be_visible()
        page.locator('#age_select_country').select_option('GB')
        page.locator('#age_select_year_of_birth').select_option('1970')
        # page.locator('#age_select_month_of_birth').select_option('01')
        # page.locator('#age_select_day_of_birth').select_option('01')

        page.locator('#age_confirm_btn').click()



        agegate_cookies = context.cookies()
        agegate_cookies_df = pd.DataFrame(agegate_cookies)
        agegate_cookies_df['cookie_siteURL'] = page.url
        agegate_cookies_df['cookie_phase'] = 'agegate'
        agegate_cookies_df['cookie_date'] = datetime.now()
        print(agegate_cookies_df, flush=True)

        cookies_dataframe = pd.concat([load_cookies_df, consent_cookies_df, agegate_cookies_df], ignore_index=True )
        cookies_dataframe.to_csv(cookies_file, mode='a', header=True, index=False)

        time.sleep(60)

        browser.close()
        return 'scan completed'

@app.route("/")
def scan_site():
    siteurl = request.args.get('siteurl')
    initiate_site_scan('https://{}'.format(siteurl))
    return f"Scan initiated for {siteurl}"

if __name__ == "__main__":
    initiate_site_scan("https://www.mortlach.com.tw")
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))

