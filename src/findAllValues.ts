export function findAllValues(str: string): string[] {
  const chars = str.split("");
  return chars.reduce((list, char, index) => {
    let length = 1;
    let currentStr = char;
    while (length <= str.length - index) {
      let i = index;
      while (currentStr.length < length) {
        currentStr += chars[i + 1];
        i++;
      }
      list.push(currentStr);
      length++;
    }
    return list;
  }, [] as string[]);
}

export function getAllSubstrings(str: string): string[] {
  const result: string[] = [];

  function recurse(startIndex: number, endIndex: number) {
    // Base case
    if (endIndex === str.length) {
      return;
    }

    // Recursive case
    if (startIndex > endIndex) {
      recurse(0, endIndex + 1);
    } else {
      result.push(str.slice(startIndex, endIndex + 1));
      recurse(startIndex + 1, endIndex);
    }
  }

  recurse(0, 0);
  return result;
}
