import { semanticSearch } from "./retrieval/vectorSearch.js";

async function test() {

  const results = await semanticSearch(
    "How do I run Docker?"
  );

  console.log(results);

}

test();