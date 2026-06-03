import { serve } from "bun";

import app from "./src/index.html";

const server = serve({
  routes: {
    "/": app,
  },
});

console.log(`Listening on ${server.url}`);
