import { Cell, CellConstructorParams } from "./Cell";
import { GameEventDispatcher } from "./Dispatcher";

const gameStringRegex = /^[1-9?]{81}$/;
export class Game {
  private gameEventDispatcher = new GameEventDispatcher();
  private cells: Cell[] = [];

  constructor(gameString: string) {
    const strippedGameString = gameString.replace(/[\t\s\n]+/gi, "").trim();
    if (!gameStringRegex.test(strippedGameString)) {
      throw new Error(
        `Game string: "${strippedGameString}" is invalid, needs to be nine characters and contain only 1-9 or ? to indicate a missing number`,
      );
    }
    strippedGameString.split("").map((char, index) => {
      const i = index % 9;
      const j = Math.floor(index / 9);

      const cellParams: CellConstructorParams = {
        coordinates: [i, j],
      };

      if (char !== "?") {
        cellParams.knownValue = Number(char);
      }

      this.cells.push(new Cell(cellParams, this.gameEventDispatcher));
    });
  }

  solve(): Promise<void> {
    this.cells
      .filter((c) => c.isSolved)
      .forEach((c) => {
        c.setValue(Number(c.valueString));
      });

    return new Promise((res) => {
      setTimeout(res, 100);
    });
  }

  toString(): string {
    return this.cells.reduce((str, cell, index) => {
      str += ` ${cell.valueString.length === 1 ? cell.valueString : "?"} `;
      if ((index + 1) % 27 === 0) {
        str += "\n---------   ---------   ---------\n";
      } else if ((index + 1) % 9 === 0) {
        str += "\n";
      } else if ((index + 1) % 3 === 0) {
        str += " | ";
      }
      return str;
    }, "");
  }
}
