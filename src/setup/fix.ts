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

const id =
  "<dbpedia:Protocol_Bringing_under_International_Control_Drugs_outside_the_Scope_of_the_Convention_of_13_July_1931_for_Limiting_the_Manufacture_and_Regulating_the_Distribution_of_Narcotic_Drugs>";

const id2 =
  "<dbpedia:Instruction_Concerning_the_Criteria_for_the_Discernment_of_Vocations_with_regard_to_Persons_with_Homosexual_Tendencies_in_view_of_their_Admission_to_the_Seminary_and_to_Holy_Orders>";

const id3 =
  "<dbpedia:Protocol_for_Limiting_and_Regulating_the_Cultivation_of_the_Poppy_Plant,_the_Production_of,_International_and_Wholesale_Trade_in,_and_Use_of_Opium>";

const arrow = await fs.readFile(`data/train/data-00006-of-00014.arrow`);
const table = tableFromIPC(arrow);
const data: Row[] = table.toArray();
for (const row of data) {
  if (row._id === id) {
    console.log(row._id);
    try {
      console.log(row.title);
      await pool.query(
        `
            INSERT INTO wikipedia (_id, title, text, embedding)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (_id) DO NOTHING
          `,
        [row._id, row.title, row.text, row.openai.toString()]
      );
      console.log(`Inserted row ${row._id}`);
    } catch (error) {
      console.error(`Error inserting row ${row._id}:`, error);
    }
  }
}

await pool.end();
