import { createApp } from "./app.js";

const port = Number(process.env.PORT) || 4000;

createApp().listen(port, (error) => {
  if (error) {
    console.error(`Failed to start server on port ${port}:`, error.message);
    process.exit(1);
  }

  console.log(`Server listening on http://localhost:${port}`);
});
