export interface CellConstructorParams {
  coordinates: [number, number];
  possibleValues: number[];
}

export class Cell {
  isRelatedToOtherCell(cell: Cell) {
    return (
      this._i === cell._i || this._j === cell._j || this._box === cell._box
    );
  }

  private _i: number;
  private _j: number;
  private _box: number; // 0 -> 8
  private _possibleValues: Set<number>;
  private _knownValue: number | null = null;
  private _isSolved = false;

  constructor(cellParams: CellConstructorParams) {
    [this._i, this._j] = cellParams.coordinates;
    this._box = this.getBox();
    this._possibleValues = new Set(cellParams.possibleValues);
    if (this._possibleValues.size === 1) {
      this._knownValue = Number(this._possibleValues.values().next().value);
      this._isSolved = true;
    }
  }

  getBox(): number {
    const small_i = Math.floor(this._i / 3);
    const small_j = Math.floor(this._j / 3);
    return small_j * 3 + small_i;
  }

  ruleOutValue(value: number) {
    this.ruleOutValues([value]);
  }

  ruleOutValues(values: number[]) {
    // if (this.isSolved) {
    //   return;
    // }
    values.forEach((v) => {
      this._possibleValues.delete(v);
    });
    if (this._possibleValues.size === 1) {
      this._knownValue = Number(this._possibleValues.values().next().value);
      this._isSolved = true;
    }
    if (this._possibleValues.size === 0) {
      throw new Error(
        `Ruled out all possible values for cell: {${this._i},${this._j}}`,
      );
    }
  }

  setValue(value: number) {
    if (this._possibleValues.has(value)) {
      this._possibleValues = new Set([value]);
      this._isSolved = true;
      this._knownValue = value;
    } else {
      throw new Error("Set cell to impossible value");
    }
  }

  isInRow(row: number): boolean {
    return this._i === row;
  }

  isInColumn(col: number): boolean {
    return this._j === col;
  }

  isInBox(box: number): boolean {
    return this._box === box;
  }

  get knownValue(): number | null {
    return this._knownValue;
  }

  get isSolved(): boolean {
    return this._isSolved;
  }

  get valueString(): string {
    return this.possibleValues.sort().join("");
  }

  get possibleValues(): number[] {
    return Array.from(this._possibleValues);
  }

  get locators(): { i: number; j: number; box: number } {
    return {
      i: this._i,
      j: this._j,
      box: this._box,
    };
  }
}
