import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from ..utils import essay

BASE_URL = "https://paulgraham.com/"
ESSAY_LIST_URL = BASE_URL + "articles.html"

# Scrapes essays from https://paulgraham.com/articles.html and inserts into the Supabase essay-table
# together with embeddings.
# Requires ollama & supabase to be up

def scrape_all_essays_from_page(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    essay_link_selector = "body > table > tr > td:nth-child(3) > table:nth-child(6) a"
    essay_links = soup.select(essay_link_selector, href=True)
    
    supabase = essay.get_supabase_client()
    already_scraped_essays = supabase.table('essays').select('url').execute()
    already_scraped_links = set(item['url'] for item in already_scraped_essays.data)
    
    essays = []
    for index, essay_link in enumerate(essay_links):
        print(f"Processing item {index + 1}/{len(essay_links)}")

        title = essay_link.text
        link = essay_link['href']
        if not link.startswith("http"):
            link = BASE_URL + link
        
        if(link in already_scraped_links):
            print(f"Skipping already ingested essay \"{title}\"")
            continue

        print(f"Scraping essay \"{title}\" from {link}")
        content = scrape_essay_from_url(link)
        essay_data = {
            'title': title,
            'link': link,
            'content': content
        }
        insert_essay_into_supabase(essay_data, supabase)
        essays.append(essay_data)
        print(f"Finished scraping essay \"{title}\"\n")

    return essays


def scrape_essay_from_url(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')

    clean_text_data = soup.get_text().strip()

    if clean_text_data:
        return clean_text_data
    else:
        return "Essay content not found."

def insert_essay_into_supabase(essay, supabase):
    embedding = get_embedding(essay['content'])
    data = {
        'title': essay['title'],
        'url': essay['link'],
        'content': essay['content'],
        'embedding': embedding
    }
    supabase.table('essays').insert(data).execute()
    print(f"Inserted essay \"{essay['title']}\"")


def get_embedding(query):
    embedding_url = os.environ.get(
        "OLLAMA_API_URL", "http://localhost:11434/api"
    ) + "/embed"
    embedding_model = os.environ.get(
        "OLLAMA_EMBEDDING_MODEL", "all-minilm:22m")

    response = requests.post(
        embedding_url,
        headers={
            'Authorization': f'Bearer {os.environ.get("OLLAMA_API_KEY")}',
        },
        json={
            "input": query,
            "model": embedding_model
        }
    )
    embedding = response.json().get('embeddings', [[]])[0]
    return embedding


def main():
    load_dotenv(".env.local")
    scrape_all_essays_from_page(ESSAY_LIST_URL)


if __name__ == "__main__":
    main()
