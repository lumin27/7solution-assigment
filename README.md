# 7Solutions Developer Assignment

Two independent apps in one repository:

| Folder              | Part                            | Stack                                                 |
| ------------------- | ------------------------------- | ----------------------------------------------------- |
| `auto-delete-todo/` | 1. Auto Delete Todo List        | Next.js (App Router), React, TypeScript, Tailwind CSS |
| `backend/`          | 2. Create data from API (bonus) | Node.js, Express, TypeScript                          |

Each app has its own `package.json`, lockfile, and tests, so they can be installed and
deployed separately.

## Requirements

- Node.js 22 (`nvm use` picks it up from `.nvmrc`)
- npm

## Part 1 — Auto Delete Todo List

Click an item in the Main List to move it to its Fruit or Vegetable column. Each moved item
goes back to the bottom of the Main List after 5 seconds, and clicking it in its column sends
it back immediately. Every item has its own timer.

```bash
cd auto-delete-todo
npm install
npm run dev
```

Open http://localhost:3000.

How it's built:

- `todoReducer.ts` holds the list logic as a pure reducer (move to category, return to main
  list). Actions for an item that isn't where the action expects are ignored, so items can't
  be duplicated.
- `useAutoReturnTodos.ts` keeps one `setTimeout` per item in a `useRef` map. Returning an item
  cancels its timer, moving it again starts a fresh one, and all timers are cleared on unmount.
- `TodoBoard.tsx` is the only client component; `TodoColumn.tsx` renders each column.
- Items are native buttons with descriptive labels, and keyboard focus moves to the next item
  when the focused one leaves its column.

## Part 2 — Department summary API

`GET /api/users/department-summary` fetches all users from
[DummyJSON](https://dummyjson.com/users) and groups them by department with gender counts,
age range, hair color counts, and a name → postal code map.

```bash
cd backend
npm install
npm run dev
```

The API runs on http://localhost:4000. See [`backend/README.md`](backend/README.md) for the
response format, error codes, and how the transformation works.

## Scripts

Both apps support the same commands, run from inside their folder:

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the development server |
| `npm run build`     | Production build             |
| `npm start`         | Run the production build     |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | TypeScript type check        |
| `npm test`          | Run the tests (Vitest)       |

The frontend uses React Testing Library with fake timers to test the 5-second behavior. The
backend uses Supertest, and its tests never call the real DummyJSON API.

## Deployment

The frontend deploys to Vercel as a standard Next.js project with **Root Directory** set to
`auto-delete-todo`. The backend can run on any Node.js host with `npm ci && npm run build`
and `npm start`, using the `PORT` environment variable.
# 7solution-assigment
