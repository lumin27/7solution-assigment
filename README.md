# 7Solutions Developer Assignment

My solution to the 7Solutions developer assignment. The repository contains two independent
apps: a Next.js frontend for the Auto Delete Todo List, and an Express API that builds
department summaries from DummyJSON user data.

## Live Demos

| Part | Link |
| ---- | ---- |
| Part 1 — Auto Delete Todo List | https://7solution-assigment.vercel.app/ |
| Part 2 — Department User Summary API | `GET` https://sevensolution-assigment-api.onrender.com/api/users/department-summary |

Source code: https://github.com/lumin27/7solution-assigment

## Assignment Overview

- **Part 1 — Auto Delete Todo List:** a list of clickable items that move into Fruit and
  Vegetable columns and return to the main list after five seconds.
- **Part 2 — Department User Summary API (optional challenge):** fetch users from
  [DummyJSON](https://dummyjson.com/users) and group them by department.

## Part 1 — Frontend

The page has three columns: **Main List**, **Fruit**, and **Vegetable**.

- Clicking an item in the Main List moves it to the column that matches its type.
- A moved item returns to the bottom of the Main List after five seconds.
- Clicking an item in the Fruit or Vegetable column returns it immediately and cancels its timer.
- Every item has its own timer, so several items can be moved and returned independently.
  Moving an item again starts a fresh five-second timer.

How it is put together:

- `todoReducer.ts` contains the list logic as a pure reducer with two actions: move to a
  category and return to the main list. An action for an item that isn't where the action
  expects is ignored, so an item can't be duplicated.
- `useAutoReturnTodos.ts` connects the reducer to React and keeps one `setTimeout` per item
  in a `useRef` map. Timers are cleared on manual return, replaced when an item is moved again,
  and all cleared when the board unmounts.
- `TodoBoard.tsx` is the only client component. `TodoColumn.tsx` renders one column and keeps
  its height fixed so the layout doesn't jump as items move.
- Items are native `<button>` elements with descriptive labels (for example "Move Apple to
  Fruit"), and keyboard focus moves to the next item when the focused one leaves its column.

Tests use Vitest and React Testing Library. The timer behavior is tested with fake timers,
including the 4,999 ms / 5,000 ms boundary, independent timers, cancellation on manual return,
and cleanup on unmount.

## Part 2 — Backend

`GET /api/users/department-summary` fetches every user from DummyJSON and returns one summary
per department. Example of the response shape:

```json
{
  "Engineering": {
    "male": 1,
    "female": 1,
    "ageRange": "28-32",
    "hair": { "Black": 1, "Blond": 1 },
    "addressUser": { "TerryMedhurst": "12345", "JaneSmith": "54321" }
  }
}
```

- **DummyJSON integration:** the client requests `?limit=0` so all users are returned instead
  of the default first 30, and checks that the number of users matches `total`.
- **Department grouping:** departments and hair colors come from the data, not a fixed list.
- **Male/female counts, age range, and hair color counts** are calculated per department.
- **`addressUser`** maps `firstName + lastName` (without spaces) to the user's home postal code.
- **Single pass:** users are grouped in one loop using `Map`, so the transformation is O(n).
- **Runtime validation:** every user record is checked before it is used. Invalid records
  are skipped, and only their count is logged.
- **Centralized error handling:** upstream failures return `502`, upstream timeouts return
  `504`, and unexpected errors return `500`.
- **Dependency injection:** `createApp()` accepts the user-fetching function, so tests can
  run the API with mock data instead of calling DummyJSON.

More detail is in [backend/README.md](backend/README.md).

## Tech Stack

**Frontend**

- Next.js 16 (App Router), React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- Vitest, React Testing Library, jsdom

**Backend**

- Node.js 22, Express 5
- TypeScript (strict mode)
- Native `fetch` with `AbortSignal.timeout`
- Vitest, Supertest
- tsx for local development

## Project Structure

```
.
├── auto-delete-todo/                    Part 1 — Next.js frontend
│   └── src/
│       ├── app/                         layout.tsx, page.tsx
│       └── features/todo/
│           ├── components/              TodoBoard.tsx, TodoColumn.tsx
│           ├── initialTodoItems.ts
│           ├── todoReducer.ts
│           ├── types.ts
│           ├── useAutoReturnTodos.ts
│           └── __tests__/
├── backend/                             Part 2 — Express API
│   └── src/
│       ├── app.ts                       createApp(): routes and error handling
│       ├── server.ts                    starts the HTTP server
│       ├── errors.ts
│       ├── middleware/errorHandler.ts
│       ├── routes/usersRouter.ts
│       ├── users/
│       │   ├── dummyJsonClient.ts
│       │   ├── summarizeUsersByDepartment.ts
│       │   ├── validateUser.ts
│       │   ├── types.ts
│       │   └── __tests__/
│       └── __tests__/
├── .nvmrc
└── README.md
```

Each app has its own `package.json` and lockfile, so they can be installed, tested, and
deployed separately.

## Running Locally

Requires Node.js 22 (`nvm use` reads it from `.nvmrc`).

**Frontend**

```bash
cd auto-delete-todo
npm install
npm run dev
```

Open http://localhost:3000.

**Backend**

```bash
cd backend
npm install
npm run dev
```

The API runs on http://localhost:4000 (set `PORT` to change it):

```bash
curl http://localhost:4000/api/users/department-summary
```

Both apps also support `npm run build`, `npm start`, `npm run lint`, and `npm run typecheck`.

## Testing

```bash
cd auto-delete-todo
npm test
```

```bash
cd backend
npm test
```

At the time of writing, the frontend has 21 tests and the backend has 73 tests, all passing.
Backend tests replace the global `fetch` with a mock, so they never contact DummyJSON.

## Deployment

- **Frontend:** hosted on Vercel, deployed from the `auto-delete-todo` folder.
- **Backend:** hosted on Render, deployed from the `backend` folder. To run it on any Node.js
  host, use `npm ci && npm run build` to build and `npm start` to run; the server reads the
  port from the `PORT` environment variable.

## Author

**Luu Min**

- Portfolio: https://luu-min.vercel.app/
- GitHub: https://github.com/lumin27
