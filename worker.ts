import { tableFromIPC } from "apache-arrow";
import fs from "fs/promises";
import { Vector } from "apache-arrow/vector";
import { Pool } from "pg";
import pgvector from "pgvector/pg";

const pool = new Pool();
pool.on("connect", async (client) => {
  await pgvector.registerType(client);
});

type Row = { _id: string; title: string; text: string; openai: Vector };

const num = process.argv[2]; // Get file number from arguments

async function processFile(num: string) {
  try {
    const arrow = await fs.readFile(`data/train/data-000${num}-of-00014.arrow`);
    const table = tableFromIPC(arrow);
    const data: Row[] = table.toArray();
    for (const row of data) {
      try {
        await pool.query(
          `
          INSERT INTO wikipedia (_id, title, text, embedding)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (_id) DO NOTHING
        `,
          [row._id, row.title, row.text, row.openai.toString()]
        );
      } catch (error) {
        console.error(`Error inserting row ${row._id}:`, error);
      }
    }
  } catch (error) {
    console.error(`Error processing file ${num}:`, error);
    process.exit(1);
  } finally {
    console.log(`Finished processing file ${num}`);
    await pool.end();
    process.exit();
  }
}

console.log(`Processing file ${num}...`);
processFile(num);
