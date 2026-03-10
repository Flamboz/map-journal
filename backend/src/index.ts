import dotenv from "dotenv";
import { init } from "./db/sqlite";
import { buildApp } from "./app";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);

async function start() {
  await init();
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Backend listening on http://localhost:${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
// server started in start()
