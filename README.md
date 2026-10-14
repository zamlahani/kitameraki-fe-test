# Kitameraki Frontend - Task Management

Single-page React app for managing tasks (React 18 + TypeScript + Fluent UI v9), backed by the Azure Functions + Cosmos DB API in the sibling `kitameraki-be-test` repository.

## Prerequisites

- Node.js 20.19+ (or 22.12+) and npm
- The backend API running locally (see `kitameraki-be-test/README.md`), or a deployed instance you can point at with `VITE_API_BASE_URL`

## Setup

```bash
npm install
cp .env.example .env.local   # optional; sensible defaults are built in
```

`VITE_API_BASE_URL` sets the API base URL (default `/api`). In development the Vite dev server proxies `/api` to the local Functions host at `http://localhost:7071`, so no CORS setup is needed.

## Running

Start the backend first (emulator + functions host), then:

```bash
npm run dev      # http://localhost:5173
```

## Scripts

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the dev server with HMR        |
| `npm run build`      | Type-check and build for production  |
| `npm run preview`    | Serve the production build locally   |
| `npm run typecheck`  | Run `tsc --noEmit`                   |
| `npm run lint`       | Run ESLint                           |
| `npm run format`     | Format with Prettier                 |
| `npm test`           | Run the test suite once              |
| `npm run test:watch` | Run tests in watch mode              |

## API notes

`updateTask(id, patch)` sends only the changed fields (patch semantics) to `PUT /api/tasks/{id}` — for example, changing a task's status from the list sends `{ status }` alone, so nothing else is re-sent or re-validated.

## Known issues

- Form settings page: no drag preview when swapping fields (the swap itself works); occasional preview flicker in some cases.

