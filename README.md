
# **Paul Graham Essay RAG-Stack**
This is a tool for scraping, searching, analysing and summarizing Paul Graham's collections of essays at https://paulgraham.com/articles.html.

## Implementation reasoning
This is implemented more as a demo piece and was made to be extra portable and easy to stary up by not requiring third party LLM keys and using very lightweight models.
Locally running LLMs will generally cause quite bad performance and the lightweight models I've chosen really don't work that great compared to even the 3B+ ones.

Thus I haven't bothered refining or optimizing this at all.

## Requirements
- Docker compose
- Node 22.16 / NPM 10.9
- Python 3.10+

## Setup

```bash
# Initialize and start local Supabase dev instance
npx supabase start

# Create & populate .env.local
npx supabase status -o env \
  --override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
  --override-name auth.anon_key=NEXT_PUBLIC_SUPABASE_ANON_KEY |
    grep NEXT_PUBLIC >> .env.local

## Set up DB
npx supabase migration up

## Start up local LLM & Embedding model
docker compose up -d

## Build & run scraper
docker build --no-cache -t scraper -f docker/Dockerfile.python .
docker run --network="host" scraper

## Run web app
npm i
npm run dev

```

## Evaluation
LLM evaluations are run via a python tool called Deepeval.
I used it to generate eval questions and golden answers which are located in `/tests/python/data/goldens`.

```bash
# Set up deepeval
pip install deepeval
deepeval set-ollama gemma3:1b --base-url="http://localhost:11434"

# Run eval tests
deepeval test run tests
```
