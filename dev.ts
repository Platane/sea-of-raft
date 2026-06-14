import { serve } from "bun";

import app from "./src/index.html";

const server = serve({
  routes: {
    "/": app,
  },
  development: { hmr: false },
});

console.log(`Listening on ${server.url}`);
