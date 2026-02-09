# Parental

Parental is a parenting and homeschooling assistant designed to help
families plan their homeschool year, understand curriculum requirements,
and find meaningful activities nearby that children genuinely enjoy.
Everything lives in one organized, easy-to-use platform.

------------------------------------------------------------------------

## Table of Contents

-   Overview
-   Why Parental
-   Features
-   Technology Stack
-   Project Structure
-   Getting Started
-   Environment Variables
-   Development
-   Roadmap
-   Vision

------------------------------------------------------------------------

## Overview

Parental is built for parents managing homeschooling, hybrid education,
or supplemental learning at home. It combines curriculum planning,
progress tracking, local activity discovery, and AI-powered assistance
into a single dashboard.

The goal is simple: reduce overwhelm and help parents make confident
educational decisions without pressure, comparison, or unnecessary
complexity.

------------------------------------------------------------------------

## Why Parental

Homeschooling often means juggling: - Curriculum expectations -
Long-term planning - Daily routines - Child interests and motivation -
Finding real-world learning opportunities

Parental brings all of this together in one place so parents can focus
less on logistics and more on supporting their children.

------------------------------------------------------------------------

## Features

### Curriculum Guidance

-   Breaks down O-Level and A-Level subjects into clear, monthly
    learning goals
-   Helps parents understand what their child should be learning at each
    stage

### Learning Path Builder

-   Creates structured, month-by-month learning plans
-   Turns interests into practical skills and steady academic progress

### Local Activities Discovery

-   Finds nearby science fairs, art classes, coding camps, museums, and
    workshops
-   Matches activities to each child's interests and age

### Checklist System

-   Default daily and weekly checklists based on age
-   Fully customizable as children grow and routines change

### Progress Tracking

-   Notes on strengths, challenges, and interests
-   Improves recommendations over time

### Stress-Reducing Design

-   Built for parents managing education solo or for the first time
-   No comparison, no rankings, no pressure

------------------------------------------------------------------------

## Technology Stack

-   Backend: Supabase (authentication, database, storage)
-   Server: Node.js with TypeScript
-   Frontend: EJS templates with modular server-rendered components
-   Integrations:
    -   Google Calendar
    -   AI-powered assistant

------------------------------------------------------------------------

## Project Structure

parental/ ├── src/ │ ├── server/ │ ├── routes/ │ ├── controllers/ │ ├──
services/ │ └── types/ ├── views/ │ ├── layouts/ │ ├── components/ │ └──
pages/ ├── public/ │ ├── css/ │ └── js/ ├── supabase/ │ └── migrations/
├── .env.example ├── package.json └── README.md

------------------------------------------------------------------------

## Getting Started

1.  Clone the repository
2.  Install dependencies
3.  Configure environment variables
4.  Run database migrations
5.  Start the development server
6.  Open the app at http://localhost:3000

------------------------------------------------------------------------

## Environment Variables

SUPABASE_URL\
SUPABASE_ANON_KEY\
SUPABASE_SERVICE_ROLE_KEY\
SESSION_SECRET\
GOOGLE_CALENDAR_API_KEY

------------------------------------------------------------------------

## Development

npm run dev

------------------------------------------------------------------------

## Roadmap

-   Additional curriculum support
-   Expanded activity discovery
-   Smarter AI recommendations
-   Mobile-friendly dashboard
-   Parent collaboration tools

------------------------------------------------------------------------

## Vision

Parental exists to make homeschooling simpler, calmer, and more
sustainable.

Everything you need, in one place.
