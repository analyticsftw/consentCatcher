import requests
import csv
import xml.etree.ElementTree as ET

def extract_urls_from_sitemap(sitemap_url, output_csv):
    try:
        # Fetch the sitemap content
        response = requests.get(sitemap_url)
        response.raise_for_status()
        sitemap_content = response.text

        # Parse the sitemap XML
        root = ET.fromstring(sitemap_content)

        # Define the namespace
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}

        # Extract URLs
        urls = []
        for url in root.findall('ns:url', namespace):
            loc = url.find('ns:loc', namespace)
            if loc is not None and loc.text:
                urls.append([loc.text])

        # Write URLs to CSV
        with open(output_csv, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['URL'])  # Write header
            writer.writerows(urls)

        print(f"Successfully extracted {len(urls)} URLs to {output_csv}.")

    except Exception as e:
        print(f"An error occurred: {e}")

# Usage
sitemap_url = 'https://stage.guinness.com/en-kr/sitemap.xml?_vercel_share=WdAJnz8vWzUW1Sgub0bnVCqv7e0S3Wkk'
output_csv = 'stage_guinness_sitemap_en-kr_urls.csv'

extract_urls_from_sitemap(sitemap_url, output_csv)