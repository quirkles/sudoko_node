import { Cell } from "./Cell";

const gameStringRegex = /^[1-9?]{81}$/;
export class Game {
  private cells: Cell[] = [];

  constructor(gameString: string) {
    if (!gameStringRegex.test(gameString)) {
      throw new Error(
        `Game string: "${gameString}" is invalid, needs to be nine characters and contain only 1-9 or ? to indicate a missing number`,
      );
    }
    gameString.split("").map((char, index) => {
      const i = index % 9;
      const j = Math.ceil(i / 81);

      console.log(i, j);
    });
  }
  print() {
    console.log(this.cells);
  }
}
