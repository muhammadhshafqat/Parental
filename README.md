# Parental

Parental is a homeschooling and parenting assistant web application that
helps families plan educational goals, understand curriculum
requirements, and discover enriching local activities tailored to their
children's interests.

It is designed to reduce planning friction for parents by combining
curriculum guidance, activity discovery, and AI-assisted support in a
single application.

## Overview

The project is built as a Node.js and TypeScript server application with
a Supabase-backed data layer and a server-rendered frontend. It
integrates external search and AI services to provide relevant
educational context and local activity recommendations.

Parental focuses on practical tooling rather than comparison or
performance pressure, supporting parents managing education at home or
alongside formal schooling.

## Project Structure

    .
    ├── public/                 Static assets
    ├── src/
    │   ├── ENV/                Environment configuration helpers
    │   ├── routes/             Application route handlers
    │   ├── utils/              Utility functions and integrations
    │   └── app.ts              Application entry point
    ├── .gitignore
    ├── eslint.config.mjs
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    └── README.md

## Tech Stack

-   Node.js
-   TypeScript
-   Express
-   Supabase (PostgreSQL, authentication, storage)
-   Google Gemini API (AI-powered reasoning and assistance)
-   SerpAPI (search grounding and local activity discovery)

## Prerequisites

-   Node.js 18 or newer
-   npm
-   Supabase project
-   Google Gemini API key
-   SerpAPI key

## Getting Started

Clone the repository and install dependencies:

``` bash
git clone https://github.com/your-username/parental.git
cd parental
npm install
```

Create a local environment file:

``` bash
cp .env.example .env
```

Update the `.env` file with the required credentials for Supabase,
Gemini, and SerpAPI.

Run database migrations or ensure your Supabase schema is initialized
before starting the server.

## Development Commands

Start the development server with hot reload:

``` bash
npm run dev
```

Run the application in production mode:

``` bash
npm run build
npm start
```

Run linting:

``` bash
npm run lint
```

Type-check the project:

``` bash
npm run typecheck
```

## Running the Application

Once the server is running, open your browser and navigate to:

    http://localhost:3000

The application will start with the main dashboard and route requests
through the configured server endpoints.

## Configuration Notes

-   API keys and secrets must never be committed to source control.
-   Supabase manages authentication and persistence.
-   Gemini is used for AI-powered planning and reasoning.
-   SerpAPI provides real-time search grounding for activity discovery.

## Contributing

Issues, feedback, and pull requests are welcome. Please open an issue
before submitting major changes so they can be discussed first.

## License

See the LICENSE file for details.
