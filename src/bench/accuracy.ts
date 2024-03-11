import OpenAI from "openai";
import { Client } from "pg";
import assert from "node:assert";

const openai = new OpenAI();
const client = new Client();

await client.connect();

const inputs = [
  "Which historical figure is known for their pivotal role in the development of classical music?",
  "What are the environmental impacts of plastic pollution in the world's oceans?",
  "Who was awarded the Nobel Prize in Physics for groundbreaking work in quantum mechanics?",
  "What are the main ingredients and cultural significance of traditional Japanese sushi?",
  "How do black holes form and what are their effects on surrounding galaxies?",
  "What are the primary challenges and benefits of implementing renewable energy sources globally?",
  "Which ancient civilization is credited with the invention of the wheel and writing?",
  "What are the psychological effects of prolonged isolation on human behavior and mental health?",
  "How does photosynthesis work and what is its importance in the Earth's ecosystem?",
  "Who was a key figure in the civil rights movement and what was their contribution to social justice?",
];

async function createEmbedding(input: string) {
  const res = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input,
    encoding_format: "float",
  });
  return res.data[0].embedding;
}

async function processQuery(query: string, ef_search: number) {
  const embedding = await createEmbedding(query);

  await client.query(`SET hnsw.ef_search = ${ef_search};`);
  const res = await client.query(
    `SELECT (title) from wikipedia ORDER BY embedding <#> '${JSON.stringify(
      embedding
    )}' LIMIT 5;`
  );
  return res.rows;
}

const errors: any[] = [];

for (const input of inputs) {
  console.log(`Processing query: ${input}`);
  const results = await Promise.all(
    [10, 20, 40, 60].map((ef_search) => processQuery(input, ef_search))
  );

  const baseResult = results[0];
  for (let i = 1; i < results.length; i++) {
    try {
      const result = results[i];
      assert.deepStrictEqual(result, baseResult);
    } catch (error) {
      console.error(`Error comparing results for query ${input}:`);
      errors.push(error);
    }
  }
}

await client.end();

if (errors.length > 0) {
  console.error("Errors:");
  for (const error of errors) {
    console.error(error);
  }
  process.exit(1);
}
