from deepeval.evaluate import evaluate
from supabase import create_client, Client
from dotenv import load_dotenv
import os

def get_supabase_client() -> Client:
    url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return create_client(url, key)

def get_essays(limit=10):
    supabase = get_supabase_client()
    query_result =  (
        supabase.table('essays')
            .select('content')
            .limit(limit)
            .execute()
    )
    return [
        item['content'] for item in query_result.data
    ]
