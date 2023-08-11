import { Cell, CellConstructorParams } from "./Cell";

const gameStringRegex = /^[1-9?]{81}$/;

export class Game {
  private cells: Set<Cell>;
  private unsolvedCells: Set<Cell>;

  constructor(gameString: string) {
    const strippedGameString = gameString.replace(/[\t\s\n]+/gi, "").trim();
    if (!gameStringRegex.test(strippedGameString)) {
      throw new Error(
        `Game string: "${strippedGameString}" is invalid, needs to be nine characters and contain only 1-9 or ? to indicate a missing number`,
      );
    }

    this.cells = new Set<Cell>([]);
    this.unsolvedCells = new Set<Cell>([]);
    strippedGameString.split("").map((char, index) => {
      const i = index % 9;
      const j = Math.floor(index / 9);

      const cellParams: CellConstructorParams = {
        coordinates: [i, j],
      };

      if (char !== "?") {
        cellParams.knownValue = Number(char);
      }
      const cell = new Cell(cellParams);
      this.cells.add(cell);
      if (char === "?") {
        this.unsolvedCells.add(cell);
      }
    });
  }

  solve() {
    // initial rip through and rule out the simple cases
    for (const cell of this.cells) {
      if (cell.isSolved) {
        this.handleSolvedCell(cell);
      }
    }

    while (this.unsolvedCells.size) {
      const unsolvedArr = Array.from(this.unsolvedCells);
      for (const cell of unsolvedArr) {
        const { i, j, box: b } = cell.locators;
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInRow(i)),
        );
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInColumn(j)),
        );
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInBox(b)),
        );
      }
    }
  }

  handleSolvedCell(cell: Cell) {
    const cellValue = cell.knownValue;
    if (!cellValue) {
      throw new Error("Expected solved cell to have a known value");
    }
    for (const unsolvedCell of this.unsolvedCells) {
      if (cell.isRelatedToOtherCell(unsolvedCell)) {
        unsolvedCell.ruleOutValue(cell.knownValue);
        if (unsolvedCell.isSolved) {
          this.unsolvedCells.delete(unsolvedCell);
          this.handleSolvedCell(unsolvedCell);
        }
      }
    }
  }

  eliminateByGroups(cells: Cell[]) {
    const uniquelyCanBe: Record<string, null | Cell | false> = {
      "1": null,
      "2": null,
      "3": null,
      "4": null,
      "5": null,
      "6": null,
      "7": null,
      "8": null,
      "9": null,
    };
    const values = cells.reduce(
      (acc, cell) => {
        const valueString = cell.valueString;
        valueString.split("").forEach((c) => {
          if (uniquelyCanBe[c] === null) {
            uniquelyCanBe[c] = cell;
          } else {
            uniquelyCanBe[c] = false;
          }
        });
        if (acc[valueString]) {
          acc[valueString].push(cell);
        } else {
          acc[valueString] = [cell];
        }
        return acc;
      },
      {} as Record<string, Cell[]>,
    );
    for (const [value, cellNullOrFalse] of Object.entries(uniquelyCanBe)) {
      if (cellNullOrFalse instanceof Cell) {
        cellNullOrFalse.setValue(Number(value));
        this.handleSolvedCell(cellNullOrFalse);
      }
    }
    for (const [valueString, groupedCells] of Object.entries(values)) {
      if (valueString.length <= groupedCells.length) {
        for (const cell of cells) {
          if (!groupedCells.includes(cell)) {
            cell.ruleOutValues(valueString.split("").map(Number));
            if (cell.isSolved) {
              this.handleSolvedCell(cell);
            }
          }
        }
      }
    }
    return;
  }

  toString(): string {
    return Array.from(this.cells).reduce((str, cell, index) => {
      str += ` ${cell.knownValue ?? "?"} `;
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
