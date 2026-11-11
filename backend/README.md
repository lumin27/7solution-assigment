# Department Summary API

A small Express + TypeScript service that downloads every user from
[DummyJSON](https://dummyjson.com/users) and returns them grouped by department, with
gender counts, an age range, hair color counts, and a name-to-postal-code map for each
department.

This is Part 2 of the 7Solutions developer assignment. It runs locally; it is not deployed.

## Tech stack

- Node.js 22 (see `.nvmrc` in the repository root)
- Express 5
- TypeScript (strict mode), ES modules
- Native `fetch` with `AbortSignal.timeout` (no HTTP client library)
- Vitest + Supertest for tests
- tsx for local development, ESLint for linting

## Project structure

```
src/
├── server.ts                          Starts the HTTP server (reads PORT, default 4000)
├── app.ts                             createApp(): configures Express, routes, 404 and error handling
├── errors.ts                          UpstreamServiceError (502) and UpstreamTimeoutError (504)
├── routes/
│   └── usersRouter.ts                 GET /api/users/department-summary
├── middleware/
│   └── errorHandler.ts                Maps errors to status codes and JSON error bodies
├── users/
│   ├── dummyJsonClient.ts             Fetches all users from DummyJSON and checks the response
│   ├── validateUser.ts                Runtime check for a single user record
│   ├── summarizeUsersByDepartment.ts  Pure, single-pass grouping logic
│   └── types.ts                       DummyJSON and summary types
└── __tests__/
    ├── setup.ts                       Blocks real network requests in every test
    └── app.test.ts                    HTTP tests with Supertest
```

Unit tests for the `users/` modules live in `src/users/__tests__/`.

## Getting started

```bash
cd backend
npm install
npm run dev
```

The server starts on http://localhost:4000 and restarts when files change.
Set `PORT` to use a different port.

## Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the dev server with watch mode (tsx)         |
| `npm run build`     | Compile TypeScript to `dist/` (test files are excluded) |
| `npm start`         | Run the compiled server from `dist/`               |
| `npm run lint`      | Run ESLint                                         |
| `npm run typecheck` | Type-check everything, including tests             |
| `npm test`          | Run the test suite once                            |
| `npm run test:watch`| Re-run tests on file changes                       |

For production:

```bash
npm ci
npm run build
npm start
```

## API

### `GET /api/users/department-summary`

Returns one entry per department found in the data.

```bash
curl http://localhost:4000/api/users/department-summary
```

Example response (shortened to one department):

```json
{
  "Engineering": {
    "male": 1,
    "female": 1,
    "ageRange": "28-32",
    "hair": {
      "Black": 1,
      "Blond": 1
    },
    "addressUser": {
      "TerryMedhurst": "12345",
      "JaneSmith": "54321"
    }
  }
}
```

| Field         | Meaning                                                        |
| ------------- | -------------------------------------------------------------- |
| `male`        | Users whose `gender` is `"male"`                               |
| `female`      | Users whose `gender` is `"female"`                             |
| `ageRange`    | Youngest and oldest age in the department, as `"min-max"`      |
| `hair`        | Number of users per `hair.color`                               |
| `addressUser` | `firstName + lastName` (spaces removed) → home `address.postalCode` |

### Errors

Errors always use the same shape:

```json
{ "error": { "message": "User service timed out" } }
```

| Status | When                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| 502    | DummyJSON is unreachable, returns a non-2xx status, sends invalid JSON, or the response has no `users` array, no valid `total`, or fewer/more users than `total` |
| 504    | DummyJSON does not respond within 5 seconds                                                   |
| 500    | Any unexpected error in this service (details are logged, not returned)                       |

Unknown routes return `404` with `{ "error": { "message": "Not found" } }`.

## How the data is transformed

1. **Fetch.** `dummyJsonClient.ts` requests
   `https://dummyjson.com/users?limit=0&select=firstName,lastName,age,gender,hair,address,company`.
   `limit=0` returns all users instead of the default first 30, and `select` only downloads
   the fields we need.
2. **Check the response.** The body must contain a `users` array and a `total`, and the
   array length must equal `total`. Otherwise the request fails with 502 instead of
   returning a partial summary.
3. **Validate each user.** `isDummyJsonUser` checks every field the summary reads. Invalid
   records are skipped, and only their count is logged (never their contents).
4. **Group in one pass.** `summarizeUsersByDepartment` loops over the users once and keeps
   running totals per department in a `Map`: gender counts, min/max age, hair color counts,
   and name → postal code. The result is converted to plain JSON at the end. Departments and
   hair colors are not hard-coded; they come from the data.

Notes:

- Gender values other than `"male"` and `"female"` still count toward age, hair, and
  addresses, but not toward either gender count.
- If two users in the same department have the same full name, the later one's postal code
  is kept.

## Testing

```bash
npm test
```

Tests never contact DummyJSON:

- `src/__tests__/setup.ts` replaces the global `fetch` before each test with a mock that
  rejects. Any test that reaches it fails, even if the app handled the error.
- Tests that need an upstream response set it explicitly, for example
  `vi.mocked(fetch).mockResolvedValueOnce(Response.json({ users, total: users.length }))`.
- HTTP tests use Supertest against `createApp()`, which accepts an injected `fetchUsers`
  function, so endpoint behavior can be tested with fixed data and no running server.
