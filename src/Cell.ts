export class Cell {
  private i: number;
  private j: number;
  private possibleValues: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor(cellParams: {
    coordinates: [number, number];
    knownValue?: number;
  }) {
    [this.i, this.j] = cellParams.coordinates;
    if (cellParams.knownValue) {
      this.possibleValues = [cellParams.knownValue];
    }
  }
}
