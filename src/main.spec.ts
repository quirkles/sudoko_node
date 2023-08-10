import { describe, test } from "@jest/globals";

import { main } from "./main";

const gameString = `
4  1  ?   ?  ?  8   ?  6  9
?  6  3   4  ?  ?   5  ?  ?
9  ?  8   5  ?  ?   ?  7  ?

?  7  2   9  8  ?   ?  ?  ?
?  ?  1   ?  ?  7   ?  4  ?
5  ?  ?   6  ?  3   7  2  8


?  5  ?   8  ?  ?   ?  9  4
3  ?  ?   ?  ?  ?   8  1  ?
2  ?  4   ?  9  6   3  ?  ?
`;
describe("main", () => {
  test("works", async () => {
    await main(gameString);
  });
});
