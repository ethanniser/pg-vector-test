import OpenAI from "openai";

const openai = new OpenAI();

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

async function processQuery(query: string, i: number) {
  const embedding = await createEmbedding(query);
  const finalString = `SELECT (title) from wikipedia ORDER BY embedding <#> '${JSON.stringify(
    embedding
  )}' LIMIT 5;`;
  await Bun.write(`src/bench/sql/query-${i}.sql`, finalString);
}

await Promise.all(inputs.map(processQuery));
