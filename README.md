# Williams Park — Community Idea Mashup
### A Community Play Tools project for the St. Petersburg Downtown Partnership

---

## What this is
A mobile-first community engagement web app for Williams Park renovation planning. Users combine park programming and infrastructure concepts to generate AI-powered idea descriptions, then star and submit the ones they like. A card-sort game lets users prioritize existing programming ideas.

All submissions save to the shared Community Play Tools Supabase database.

---

## 1. Supabase — Run Migration First

In your Supabase dashboard → SQL Editor, run:

```
williams-park-mashup-migration.sql
```

This creates two tables: `mashup_ideas` and `cardsort_results`, with RLS policies for anonymous inserts.

---

## 2. Local Development

```bash
# Install dependencies
npm install

# Copy env file and add your Anthropic API key
cp .env.example .env
# Edit .env — add VITE_ANTHROPIC_API_KEY

# Run dev server
npm run dev
```

App runs at http://localhost:5173

---

## 3. Deploy to Netlify (recommended)

```bash
npm run build
# Drag the dist/ folder to netlify.com/drop
```

Or connect your GitHub repo and set environment variables in Netlify dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`  
- `VITE_ANTHROPIC_API_KEY`

---

## ⚠️ API Key Security Note

`VITE_ANTHROPIC_API_KEY` is exposed in the browser bundle. This is fine for a short-run community engagement deployment with a limited audience, but for a public-facing production app you should proxy the API call through a Netlify Edge Function or similar. The Supabase anon key is safe to expose.

---

## Project Structure

```
src/
  main.jsx          — React entry point
  App.jsx           — Full application (single file)
index.html
vite.config.js
package.json
.env.example
williams-park-mashup-migration.sql
```

---

## Supabase Tables

**mashup_ideas** — one row per submitted idea
| column | type | notes |
|---|---|---|
| project | text | always `williams-park-mashup` |
| term1 | text | first input term |
| term2 | text | second input term |
| ai_description | text | Claude-generated description |
| user_comment | text | optional user addition |
| submitted_at | timestamptz | when starred/submitted |

**cardsort_results** — one row per completed sort
| column | type | notes |
|---|---|---|
| scores | jsonb | `{ "idea": score }` map |
| rounds_played | int | total rounds in session |
