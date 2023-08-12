import {findAllValues, getAllSubstrings} from "./findAllValues";

describe("findAllValues", () => {
  it("works length 1", () => {
    expect(findAllValues("1")).toEqual(["1"]);
  });
  it("works length 2", () => {
    expect(findAllValues("12")).toEqual(["1", "12", "2"]);
  });
  it("works length 3", () => {
    expect(getAllSubstrings("123").sort()).toEqual([
      "1",
      "12",
      "13",
      "123",
      "2",
      "23",
      "3",
    ]);
  });
  it("works length 4", () => {
    expect(findAllValues("1234")).toEqual([
      "1",
      "12",
      "13",
      "14",
      "123",
      "124",
      "134",
      "1234",
      "2",
      "23",
      "24",
      "234",
      "3",
      "34",
      "4",
    ]);
  });
  it("works length 5", () => {
    expect(findAllValues("1234")).toEqual([
      "1",
      "12",
      "13",
      "14",
      "15",
      "123",
      "124",
      "125",
      "1234",
      "2",
      "23",
      "24",
      "234",
      "3",
      "34",
      "4",
    ]);
  });
});
