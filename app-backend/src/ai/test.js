import { askOllama } from "./services/ollamaService.js";

async function test() {
  const answer = await askOllama("What is React?");

  console.log(answer);
}

test();
