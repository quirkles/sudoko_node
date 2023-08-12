import { describe, test } from "@jest/globals";
import { Game } from "./Game";

const gameString = `
4  ?  ?   ?  1  ?   5  ?  ?
?  9  ?   ?  ?  ?   2  ?  ?
?  ?  3   5  ?  4   ?  6  ?

3  ?  ?   ?  ?  ?   ?  ?  4
?  ?  ?   ?  ?  8   ?  ?  ?
?  ?  4   7  ?  6   ?  5  ?


?  ?  7   ?  8  ?   ?  ?  ?
2  ?  ?   1  ?  7   6  ?  ?
?  ?  ?   ?  3  ?   ?  1  ?
`;

describe("main", () => {
  test("works", () => {
    const game = new Game(gameString);
    game.solve();
    console.log(game.toString());
    expect(game.getGameString()).toEqual(
      "4,7,6,2,1,9,5,8,3,5,9,1,8,6,3,2,4,7,8,2,3,5,7,4,1,6,9,3,6,2,9,5,1,8,7,4,7,1,5,3,4,8,9,2,6,9,8,4,7,2,6,3,5,1,1,3,7,6,8,5,4,9,2,2,4,8,1,9,7,6,3,5,6,5,9,4,3,2,7,1,8",
    );
  });
});
