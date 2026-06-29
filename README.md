# Supabase Auditor

Supabase Auditor is a browser-based security scanner for Supabase projects. It checks common PostgREST table endpoints for exposed read, write, and delete access, then turns the findings into a simple score and exportable PDF report.

## What It Does

- Probes a curated list of common Supabase table names.
- Detects whether anonymous access can read, insert, or delete rows.
- Classifies each table as `vulnerable`, `secure`, `unknown`, or `not_found`.
- Calculates an overall score and grade from the discovered exposure.
- Generates a PDF report from the final dashboard view.

## How It Works

1. Enter your Supabase project URL.
2. Paste your public `anon` API key.
3. The app sends requests directly from your browser to the Supabase REST endpoint.
4. It tests each common table name and records the HTTP response and exposure level.
5. You review the results in the dashboard or export them as a PDF.

## Safety Notes

- Use the public `anon` key only. Do not paste your `service_role` key.
- The app is designed to run entirely in the browser; it does not send your credentials to a backend.
- A `service_role` key would bypass protections and is not needed for this audit.

## Requirements

- Node.js 18 or newer
- npm 9+ recommended

## Getting Started

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal, then enter:

- A Supabase project URL in the form `https://<project-ref>.supabase.co`
- A valid public `anon` JWT from your Supabase project

## Audit Results

The dashboard shows:

- Overall score and grade
- Number of tables found vs. probed
- Count of secure, vulnerable, and unknown tables
- Per-table exposure status
- Suggested remediation steps when issues are detected

## Project Structure

- `src/components/` - UI screens and dashboard cards
- `src/lib/` - audit logic, scoring, validation, and PDF export
- `src/types/` - shared TypeScript types
- `public/` - static assets

## Deployment

This is a Vite app and can be deployed to any static hosting provider. The repository includes a `vercel.json` configuration for Vercel.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- jsPDF and html2canvas for PDF export

## Disclaimer

Use this tool only on Supabase projects you own or are authorized to assess. It is intended for defensive security auditing.
