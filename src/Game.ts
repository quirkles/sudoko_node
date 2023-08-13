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
        );
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInColumn(i)),
        );
        this.eliminateByGroups(
          unsolvedArr.filter((cell) => !cell.isSolved && cell.isInBox(b)),
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

  eliminateByGroups(cells: Cell[]) {
    this.handleCanOnlyBeInGroup(cells);
    this.excludeViaExhaustiveBuckets(cells);
  }

  excludeViaExhaustiveBuckets(cells: Cell[]) {
    // This takes a family of cells (all in the same row, col, or box) and eliminates possible values by creating groups, or buckets.
    // This is the general case, or which 'handleCanOnlyBeInGroup' is a special case (group size limited to one)
    // The principle is that if we have 5 cells and their possible values

    // cell 1 | call 2 | cell 3 | cell 4  | cell 5
    // 1,2,3  | 1,2    | 2,3    | 2,3,7,8 | 1,7,8

    // From this we know that the values 123 are taken up by the first three cells
    // Therefore we can eliminate 1,2,3 from the possible values  cells 4 and 5
    // Think of '123' as a bucket into which we can put the cells that exhaust this combination of possible values

    // Another way of thinking about it:
    // We are going to take EVERY possible combination of 2 or more cells, and for each combination, list all possible values combined
    // if a combination of two buckets b1 and b2 only has two possible values; x and y, then we know b1 is x or y and b2 is x or y
    // Therefore we can remove x and y from the possible values of any other buckets in the family
    // This holds in general, if a bucket containing x cells has x possible values than that is exhaustive, no other cells in the family have those values
    // Think of the simplest case, is a bucket of 1 cell has only 1 possible value, none of the other buckets have that value

    // First lets get the 'first order' buckets,for each cell, create a bucket from the possible values and put the cell in it, there may be more than one cell in any bucket here
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

    // The composite bucket will contain all possible combinations
    const compositeBuckets: Record<string, Cell[]> = {};

    // To get it we rip through the first order buckets
    // For each bucket we compare it with every other bucket, to find the composite bucket name we create a set of all the possible values (removing duplicates), and sort it numerically
    // Example from above, the first first-order bucket will be 123, the second will be 12
    // The composite bucket name will be 123, both cells are contained in this bucket
    // The composite bucket of 123 and 2378? 12378, this bucket will also hold 12, and 23

    // A single bucket will contain one or more cells, and any cell can be in many buckets
    const firstOrderBucketValues = Object.keys(firstOrderBuckets);
    for (let i = 0; i < firstOrderBucketValues.length; i++) {
      // rip through all first order buckets, which will represent actual cells
      for (let j = i; j < firstOrderBucketValues.length; j++) {
        // we need to compare it to every other first order bucket, we can reuse the index for a minor optimization, dont need to look back!
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

    // Now we have all our composite buckets we need to populate them
    // I do this by looking at the first order buckets if the values in the FObucket are a strict subset of the values in the composite, we concat that bucket.
    // remember, by values in the bucket, i am referring to the bucket 'name' which is the possible values sorted and joined '123' or '12'

    for (const compositeBucketValues of Object.keys(compositeBuckets)) {
      const compositeBucketValueArr = compositeBucketValues.split("");
      for (const firstOrderBucketValue of firstOrderBucketValues) {
        const firstOrderBucketValueArr = firstOrderBucketValue.split("");
        // Create a new set from all the values of the two buckets
        // If the new set's size is the same as the composite then the FO bucket contains no values that are not in the composite, add the cellls to the bucket
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

    // Now the elimination
    // Rip through the composite buckets
    // If the bucket name is the same length as the number of cells, we can eliminate the values in that bucket name from every cell not in the bucket
    // If this seems like magic, remember, a bucket name is all the possible values and the cells in that bucket are all of the cells that can be every of those values

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
    // This is the simpler of the elimination methods
    // For each family of cells (same row, col, or box), if only one cell's possible values contains any given possible value we know that's the one
    // Begin with a map of all values 0-9 as nulls
    // Loop over the cells, for each cell, loop over the possible values
    // If the maps key for that value is null ad the cell
    // If there is already a cell then more than one cell in this family can be that value

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

    // If any of the values in the map are a cell then the cells value is the key

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
    // At this point we aren't learning anything from the logic elimination, so lets guess
    // Find the cells with only 2 degrees of freedom, and assume a value, then try to solve it
    // If it throws an error, we know it's the other value, rinse and repeat.
    // Doing the cells with the least possible values is a nice optimization, because at this point we have gone through the logical eliminations we should be able to quickly determine if a value is unsolvable
    // When this returns a string, it will be the game string of a solved sudoko
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
