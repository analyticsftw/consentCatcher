from extensions import cache  # import the cache object from app.py
from google.cloud import bigquery

client = bigquery.Client()

@cache.memoize(timeout=300)
def all_cookies():
    # This query selects only the cookies from the last scan performed on each site
    query = """
        SELECT
        *,
        DATE(cookie_date) AS last_scan
        FROM(
            SELECT
            *,
            DENSE_RANK() OVER(PARTITION BY cookie_siteURL ORDER BY DATE(cookie_date) desc) AS scan_number
            FROM
                `diageo-cookiebase.cookie_scan.cookies_with_vendor`
            GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12,13,14
        )WHERE scan_number = 1
        ORDER BY cookie_siteURL, cookie_date
    """

    query_job = client.query(query)
    all_cookies = query_job.to_dataframe()
    return all_cookies

@cache.memoize(timeout=300)
def scan_errors():
    # This query selects only the cookies from the last scan performed on each site
    query = """
        SELECT
            distinct
            * EXCEPT(date, scan_number),
            --
            DATE(date) AS error_date
            -- date
            FROM (
            SELECT
                date, site_url,error_clean,
                DENSE_RANK() OVER(PARTITION BY site_url ORDER BY date DESC) AS scan_number
            FROM
                `diageo-cookiebase.cookie_scan.cookie_scan_errors_clean` )
            WHERE
            scan_number = 1
            ORDER BY
            site_url
    """

    query_job = client.query(query)
    scan_errors = query_job.to_dataframe()
    return scan_errors

@cache.memoize(timeout=300)
def cookie_sources():
    # This query selects only the cookies from the last scan performed on each site
    query = """
        SELECT
            *
        FROM
            `diageo-cookiebase.cookie_scan.cookie_scan_sources`
    """
    query_job = client.query(query)
    scan_errors = query_job.to_dataframe()
    return scan_errors

@cache.memoize(timeout=300)
def cookie_categories():

    query = """
        SELECT
            *
        FROM `diageo-cookiebase.cookie_enhancement.cookie_categorization`
        ORDER BY 1 ASC
    """

    query_job = client.query(query)
    categories = query_job.to_dataframe()
    return categories