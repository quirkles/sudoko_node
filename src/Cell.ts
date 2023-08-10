import { GameEventDispatcher } from "./Dispatcher";

export interface CellConstructorParams {
  coordinates: [number, number];
  knownValue?: number;
}

export class Cell {
  static areCellsRelated(cell_1: Cell, cell_2: Cell) {
    return (
      cell_1.i === cell_2.i ||
      cell_1.j === cell_2.j ||
      cell_1.box === cell_2.box
    );
  }
  private i: number;
  private j: number;
  private box: number; // 0 -> 8
  private possibleValues = new Set<number>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  private gameEventDispatcher: GameEventDispatcher;

  constructor(
    cellParams: CellConstructorParams,
    gameEventDispatcher: GameEventDispatcher,
  ) {
    [this.i, this.j] = cellParams.coordinates;
    if (cellParams.knownValue) {
      this.possibleValues = new Set([cellParams.knownValue]);
    }
    this.gameEventDispatcher = gameEventDispatcher;
    this.gameEventDispatcher.on(
      "cellValueDetermined",
      this.handleOtherCellDetermined.bind(this),
    );
    this.box = this.getBox();
  }

  getBox(): number {
    const small_i = Math.floor(this.i / 3);
    const small_j = Math.floor(this.j / 3);
    return small_j * 3 + small_i;
  }

  private handleOtherCellDetermined(payload: { cell: Cell; value: number }) {
    if (this.isSolved || !Cell.areCellsRelated(this, payload.cell)) {
      return;
    }
    this.possibleValues.delete(payload.value);
    if (this.possibleValues.size === 1) {
      this.gameEventDispatcher.off("cellValueDetermined", () => {
        this.handleOtherCellDetermined.bind(this);
      });
      this.gameEventDispatcher.emit("cellValueDetermined", {
        cell: this,
        value: Array.from(this.possibleValues)[0],
      });
    }
    if (this.possibleValues.size === 0) {
      throw new Error(`No possible values for cell {${this.i},${this.j}`);
    }
  }

  setValue(value: number) {
    if (this.possibleValues.has(value)) {
      this.possibleValues = new Set([value]);
      this.gameEventDispatcher.off("cellValueDetermined", () => {
        this.handleOtherCellDetermined.bind(this);
      });
      this.gameEventDispatcher.emit("cellValueDetermined", {
        cell: this,
        value,
      });
    } else {
      throw new Error(
        `Cell: {${this.i},${this.j} set to value: ${value} not in possible values`,
      );
    }
  }

  get valueString(): string {
    return Array.from(this.possibleValues).sort().join("");
  }

  get isSolved(): boolean {
    return this.possibleValues.size === 1;
  }
}
