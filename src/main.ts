import { Game } from "./Game";

export async function main(gameString: string): Promise<void> {
  const game = new Game(gameString);
  // console.log('Game initialized.')
  console.log(game.print());
  // await game.solve()
  // console.log('Game solved.')
  // console.log(game.print())
}
