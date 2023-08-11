import { describe, test } from "@jest/globals";

import { main } from "./main";

const gameString = `
?  4  ?   ?  ?  ?   ?  5  ?
?  ?  7   ?  ?  ?   ?  ?  8
?  ?  ?   7  ?  ?   9  ?  ?

7  5  ?   ?  ?  2   ?  ?  ?
?  ?  ?   ?  5  ?   ?  6  7
?  ?  8   ?  ?  ?   3  4  ?


5  ?  ?   2  ?  3   ?  ?  ?
9  3  ?   ?  6  5   ?  ?  ?
?  ?  ?   ?  4  ?   ?  9  ?
`;
describe("main", () => {
  test("works", async () => {
    await main(gameString);
  });
});
