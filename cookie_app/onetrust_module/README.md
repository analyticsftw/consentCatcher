# OneTrust API Tools 
These Python scripts help you connect to the [OneTrust API](https://developer.onetrust.com/onetrust/reference/onetrust-api-overview) and retrieve/update cookie information.


## Prerequisites
- Obtain [API credentials from OneTrust](https://my.onetrust.com/s/article/UUID-3faa8a9f-7635-bcda-5184-c01a157c3132)
- Determine the *hostname* for your OneTrust tenant (client account). This is usually a value to the effect of `app-uk.onetrust.com` and generally the beginning of the URL you use to connect to the URL.
- Store the hostname and credential keys in the `config.py` file, which will be read as a settings include file. 

## Usage
 
### Obtain a OneTrust API access token
Using your client ID and client secret, send a first request to return a token.
```
    python3 getToken.py > token.json
```
Once this operation completes, a token is written to `token.json`. Reflect the value of the token in `config.py`.

### Obtain a list of websites
This will output all websites in OneTrust to a `websites.json` file
```
    python3 getWebsites.py
```

### Obtain a list of cookies
This will loop through all OneTrust websites in the `websites.json` file and pull corresponding cookies found in OneTrust and output them to a `cookies.csv` CSV file
```
    python3 getCookies.py
```
## TODO
- add script to udate cookie data and upload back to OneTrust
