import { Cell, CellConstructorParams } from "./Cell";

const gameStringRegex = /^[1-9?,]+$/;

export class Game {
  private cells: Set<Cell> = new Set<Cell>([]);
  private unsolvedCells: Set<Cell> = new Set<Cell>([]);

  constructor(gameString: string) {
    this.setStateFromGameString(gameString);
  }

  setStateFromGameString(gameString: string): void {
    const strippedGameString = gameString
      .trim()
      .replace(/[\t\s\n]+/gi, ",")
      .trim();
    if (!gameStringRegex.test(strippedGameString)) {
      throw new Error(`Game string: "${strippedGameString}" is invalid`);
    }

    this.cells = new Set<Cell>([]);
    this.unsolvedCells = new Set<Cell>([]);
    strippedGameString.split(",").map((char, index) => {
      const i = index % 9;
      const j = Math.floor(index / 9);

      const cellParams: CellConstructorParams = {
        coordinates: [i, j],
        possibleValues:
          char === "?"
            ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
            : char.split("").map(Number),
      };
      const cell = new Cell(cellParams);
      this.cells.add(cell);
      if (!cell.isSolved) {
        this.unsolvedCells.add(cell);
      }
    });
  }

  solve(): void {
    // initial rip through and rule out the simple cases
    for (const cell of this.cells) {
      if (cell.isSolved) {
        this.handleSolvedCell(cell);
      }
    }

    let totalPossibleValues = this.getTotalPossibleValues();

    let eliminatingByGroups = true;

    while (eliminatingByGroups) {
      const unsolvedArr = Array.from(this.unsolvedCells);
      for (const cell of unsolvedArr) {
        const { i, j, box: b } = cell.locators;
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInRow(j)),
          { type: "row", identifier: i },
        );
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInColumn(i)),
          { type: "col", identifier: j },
        );
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInBox(b)),
          { type: "box", identifier: b },
        );
      }
      const newTotalPossibleValues = this.getTotalPossibleValues();
      if (totalPossibleValues === newTotalPossibleValues) {
        eliminatingByGroups = false;
      } else {
        totalPossibleValues = newTotalPossibleValues;
      }
    }
    if (this.unsolvedCells.size === 0) {
      return;
    }
    const solvedGameString = this.trialAndErrorIt();
    this.setStateFromGameString(solvedGameString);
  }

  handleSolvedCell(cell: Cell) {
    this.unsolvedCells.delete(cell);
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

  eliminateByGroups(
    cells: Cell[],
    meta: { type: "row" | "col" | "box"; identifier: number },
  ) {
    this.handleCanOnlyBeInGroup(cells);
    this.excludeViaExhaustiveBuckets(cells, meta);
  }

  excludeViaExhaustiveBuckets(
    cells: Cell[],
    meta: { type: "row" | "col" | "box"; identifier: number },
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const vs = cells.map((c) => `${c.valueString}`).join(", ");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const metaStr = `${meta.type}:${meta.identifier}`;
    const firstOrderBuckets: Record<string, Cell[]> = cells.reduce(
      (acc, cell) => {
        const valueString = cell.valueString;
        if (acc[valueString]) {
          acc[valueString].push(cell);
        } else {
          acc[valueString] = [cell];
        }
        return acc;
      },
      {} as Record<string, Cell[]>,
    );

    const compositeBuckets: Record<string, Cell[]> = {};

    const firstOrderBucketValues = Object.keys(firstOrderBuckets);
    for (let i = 0; i < firstOrderBucketValues.length; i++) {
      for (let j = i; j < firstOrderBucketValues.length; j++) {
        const baseValueStr = firstOrderBucketValues[i];
        const otherValueString = firstOrderBucketValues[j];
        const compositeValueStr = Array.from(
          new Set([...otherValueString.split(""), ...baseValueStr.split("")]),
        )
          .sort()
          .join("");
        if (!compositeBuckets[compositeValueStr]) {
          compositeBuckets[compositeValueStr] = [];
        }
      }
    }

    for (const compositeBucketValues of Object.keys(compositeBuckets)) {
      const compositeBucketValueArr = compositeBucketValues.split("");
      for (const firstOrderBucketValue of firstOrderBucketValues) {
        const firstOrderBucketValueArr = firstOrderBucketValue.split("");
        if (
          new Set(compositeBucketValueArr).size ===
          new Set([...compositeBucketValueArr, ...firstOrderBucketValueArr])
            .size
        ) {
          compositeBuckets[compositeBucketValues].push(
            ...firstOrderBuckets[firstOrderBucketValue],
          );
        }
      }
    }

    for (const [valueString, groupedCells] of Object.entries(
      compositeBuckets,
    )) {
      if (valueString.length <= groupedCells.length) {
        for (const cell of cells.filter((c) => !groupedCells.includes(c))) {
          cell.ruleOutValues(valueString.split("").map(Number));
          if (cell.isSolved) {
            this.handleSolvedCell(cell);
          }
        }
      }
    }
    return;
  }

  handleCanOnlyBeInGroup(cells: Cell[]) {
    const uniquelyCanBe = cells.reduce(
      (acc, cell) => {
        const valueString = cell.valueString;
        valueString.split("").forEach((c) => {
          if (acc[c] === null) {
            acc[c] = cell;
          } else {
            acc[c] = false;
          }
        });
        return acc;
      },
      {
        "1": null,
        "2": null,
        "3": null,
        "4": null,
        "5": null,
        "6": null,
        "7": null,
        "8": null,
        "9": null,
      } as Record<string, null | Cell | false>,
    );
    for (const [value, cellNullOrFalse] of Object.entries(uniquelyCanBe)) {
      if (cellNullOrFalse instanceof Cell) {
        cellNullOrFalse.setValue(Number(value));
        this.handleSolvedCell(cellNullOrFalse);
      }
    }
  }

  getTotalPossibleValues(): number {
    let total = 0;
    this.unsolvedCells.forEach((cell) => {
      total += cell.valueString.length;
    });
    return total;
  }

  toString(mode = "concise"): string {
    const padLength =
      mode === "concise"
        ? 1
        : Array.from(this.cells).reduce(
            (max, curr) => Math.max(max, curr.possibleValues.length),
            1,
          );
    const divider = Array.from({ length: padLength * 3 + 6 }).reduce(
      (str: string) => (str += "-"),
      "",
    );
    return Array.from(this.cells).reduce((str, cell, index) => {
      str += ` ${String(
        cell.knownValue ?? (mode === "concise" ? "?" : cell.valueString),
      ).padStart(padLength, " ")} `;
      if ((index + 1) % 27 === 0) {
        str += `\n ${divider}   ${divider}   ${divider}\n `;
      } else if ((index + 1) % 9 === 0) {
        str += "\n ";
      } else if ((index + 1) % 3 === 0) {
        str += " | ";
      }
      return str;
    }, " ");
  }

  trialAndErrorIt(): string {
    const gameString = this.getGameString();
    const possibleValuesList = gameString.split(",");
    let groupSize = 2;
    while (groupSize <= 10) {
      for (let i = 0; i < possibleValuesList.length; i++) {
        const possibleValues = possibleValuesList[i];
        if (possibleValues.length !== groupSize) {
          continue;
        }
        for (const possibleValue of possibleValues.split("")) {
          try {
            const game = new Game(
              arrayWithAt(possibleValuesList, i, possibleValue).join(","),
            );
            game.solve();
            return game.getGameString();
          } catch (e) {
            // we just want to ignore errors
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const err = e;
          }
        }
      }
      groupSize++;
    }
    throw new Error("Trial and error couldnt complete");
  }

  getGameString(): string {
    return Array.from(this.cells)
      .map((c) => c.valueString)
      .join(",");
  }
}

function arrayWithAt<T>(array: T[], index: number, value: T): T[] {
  return array.map((v, i) => (i === index ? value : v));
}
