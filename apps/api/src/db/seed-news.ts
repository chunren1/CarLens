import { pathToFileURL } from "node:url";
import { closeDb, createDb } from "./client";
import { seedNews } from "./news-seed";
import { loadEnv } from "../env";

const isMain =
  process.argv[1] !== undefined &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isMain) {
  const env = loadEnv();
  const db = createDb(env.DATABASE_URL);
  try {
    seedNews(db);
    console.log("news seed 完成");
  } finally {
    closeDb(db);
  }
}
