# Battery Passport Portal

A Vue 3 web application for searching, opening, and reviewing digital battery passports through a lightweight portal UI.

## Overview

The webportal provides:

- public battery search and deep-link access
- protected operational screens for manufacturer registration, passport browsing, and API logs
- local demo authentication with persisted browser session state
- client-side validation of manufacturer API responses with user-facing error messages when returned JSON is invalid

The portal is aligned with the **OPENAPI Digital Battery Passport** structure used by this project.

## Current Features

### Public screens

- **Battery Search** for opening a passport by manufacturer and battery ID
- **Battery Passport** view for direct route-based access to a specific battery
- **About** page describing the portal, passport model, license, and deep-link format

### Protected screens

After signing in with the demo account:

- **All Passports** to browse passports from registered manufacturers
- **Manufacturer Registration** to store manufacturer codes, URLs, and optional API keys
- **API Logs** to inspect recent API requests and responses

### API integration behavior

- reads manufacturer endpoint settings from browser storage
- supports deep links in both `/manufacturer/{manufacturer}/battery/{id}` and `/oem/{manufacturer}/battery/{id}` formats
- validates received JSON before rendering battery passport data
- shows explicit error messages when required passport fields are missing or response structure is invalid

## Demo Authentication

Demo credentials:

- **Username:** `admin`
- **Password:** `password`

The login session is persisted in `localStorage`, so refreshes and deep links do not immediately sign the user out.

## Deep Links

Example deep link:

```text
<portal url>/manufacturer/DAF/battery/BAT-1001
```

Supported route patterns:

- `/manufacturer/{manufacturer}/battery/{id}`
- `/oem/{manufacturer}/battery/{id}`

## Project Structure

```text
src/
├── App.vue                     # Main shell, navigation, routing, deep-link handling
├── apiLogger.ts                # In-memory API log store for the logging screen
├── passportValidation.ts       # Validation for manufacturer API JSON payloads
├── storage.ts                  # Shared localStorage helpers for auth and registrations
├── main.ts                     # Vue entry point
├── style.css                   # Global styling
└── components/
    ├── AboutScreen.vue
    ├── BatteryListScreen.vue
    ├── BatteryPassportScreen.vue
    ├── BatterySearchScreen.vue
    ├── LoggingScreen.vue
    ├── LoginScreen.vue
    └── RegistrationScreen.vue
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Start development server

```bash
npm run dev
```

By default, Vite serves the app locally at `http://localhost:5173`.

### Build for production

```bash
npm run build
```

The production build is written to `dist/`.

### Preview the production build

```bash
npm run preview
```

## Docker

Using Docker Compose:

```bash
docker-compose up
```

Manual build/run:

```bash
docker build -t battery-passport-portal:latest .
docker run -d -p 3000:3000 --name battery-portal battery-passport-portal:latest
```

For more details, see [DOCKER.md](./DOCKER.md).

## Routing

The app uses lightweight client-side routing with `window.history.pushState` and `popstate`.

Routes:

- `/` or `/search` - Battery Search
- `/about` - About
- `/login` - Sign In
- `/list` - All Passports
- `/register` - Manufacturer Registration
- `/logs` - API Logs
- `/manufacturer/{manufacturer}/battery/{id}` - Battery Passport
- `/oem/{manufacturer}/battery/{id}` - Battery Passport

## Browser Storage

The app stores the following locally in the browser:

- manufacturer registrations
- optional manufacturer API keys
- persisted demo login session

## License

This webportal is licensed under the Apache License 2.0. See [LICENSE](./LICENSE).
