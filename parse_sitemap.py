import xml.etree.ElementTree as ET

def extract_urls_from_sitemap(sitemap_path):
    tree = ET.parse(sitemap_path)
    root = tree.getroot()

    urls = []
    for url in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}url'):
        loc = url.find('{http://www.sitemaps.org/schemas/sitemap/0.9}loc').text
        urls.append(loc)

    return urls

# Example usage:
sitemap_path = './sitemap.xml'
urls = extract_urls_from_sitemap(sitemap_path)
for url in urls:
    print(url)