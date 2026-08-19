import { Hono } from "hono";

import { healthRoutes } from "./routes/health.ts";

const app = new Hono();

app.route("/", healthRoutes);

const port = Number(process.env.API_PORT ?? 3000);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
