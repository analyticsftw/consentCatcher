""" Connects to the OneTrust API and retrieves an API token for use in other API requests """

from config import apiSettings
import requests

# Settings
hostname=apiSettings["hostname"]
client_id=apiSettings["client_id"]
client_secret=apiSettings["client_secret"]

url = f"https://{hostname}/api/access/v1/oauth/token"

payload = f"-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"grant_type\"\r\n\r\nclient_credentials\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"client_id\"\r\n\r\n{client_id}\r\n-----011000010111000001101001\r\nContent-Disposition: form-data; name=\"client_secret\"\r\n\r\n{client_secret}\r\n-----011000010111000001101001--\r\n\r\n"
headers = {
    "accept": "application/json",
    "content-type": "multipart/form-data; boundary=---011000010111000001101001"
}

response = requests.post(url, data=payload, headers=headers)
jsonResponse = response.json()
oneTrustToken = jsonResponse['access_token']

# Outputs token to console
print(oneTrustToken)
