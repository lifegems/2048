import React from 'react';
import { Client } from 'boardgame.io/client';
import { Game } from 'boardgame.io/core';
import './App.css';

function mergeFourCellsLeft(fourcells) {
   fourcells = removeZeroesLeft(fourcells);
   let cellA = fourcells[0];
   let cellB = fourcells[1];
   let cellC = fourcells[2];
   let cellD = fourcells[3];
   let cells;

   if (cellA === cellB && cellC === cellD) {
      // 2,2,4,4 => 4,8,0,0
      cells = [cellA + cellB, cellC + cellD, 0, 0];
   } else if (cellA === cellB && cellC !== cellD) {
      // 2,2,4,8 => 4,4,8,0
      cells = [cellA + cellB, cellC, cellD, 0];
   } else if (cellB === cellC) {
      // 2,4,4,2 => 2,8,2,0
      cells = [cellA, cellB + cellC, cellD, 0];
   } else if (cellC === cellD) {
      // 2,4,8,8 => 2,4,16
      cells = [cellA, cellB, cellC + cellD, 0];
   } else {
      // 2,4,8,16 => 2,4,8,16
      cells = [cellA, cellB, cellC, cellD];
   }
   return removeZeroesLeft(cells);
}

function removeZeroesLeft(fourcells) {
   let cells = fourcells.filter(c => c > 0);
   let zeroes = Array(4 - cells.length).fill(0);
   cells = [...cells, ...zeroes];
   return cells;
}

function getRandom(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getNextCell(cells) {
   let availableCells = [];
   cells.forEach((c, i) => {
      if (c === 0) {
         availableCells.push(i);
      }
   });
   let randomIndex = getRandom(0, (availableCells.length >= 0) ? availableCells.length - 1 : 0);
   return availableCells[randomIndex];
}

function addRandomNumber(cells) {
   let randomPiece = getRandom(1,2) * 2;
   let randomIndex = getNextCell(cells);
   cells[randomIndex] = randomPiece;
   return cells;
}

function setupInitialCells() {
   let cells = Array(16).fill(0);
   for (let i = 0; i < 2; i++) {
      cells = addRandomNumber(cells);
   }
   printGame(cells);
   return cells;
}

function doGridsMatch(gridA, gridB) {
   for (let i = 0; i < 16; i++) {
      if (gridA[i] !== gridB[i]) {
         return false;
      }
   }
   return true;
}

function printGame(cells) {
   // console.log(cells);
   for (let i = 0; i < 4; i++) {
      console.log(i + 1, '-', cells[i * 4], cells[i * 4 + 1], cells[i * 4 + 2], cells[i * 4 + 3]);
   }
   console.log("\n");
}

function getNumberScore(gridNew, gridOld, digit) {
   let count = gridNew.filter(c => c === digit).length - gridOld.filter(c => c === digit).length;
   if (count > 0) {
      return count * digit;
   }
   return 0;
}

function getRoundScore(gridNew, gridOld) {
   let score = 0;
   score += getNumberScore(gridNew, gridOld, 4);
   score += getNumberScore(gridNew, gridOld, 8);
   score += getNumberScore(gridNew, gridOld, 16);
   score += getNumberScore(gridNew, gridOld, 32);
   score += getNumberScore(gridNew, gridOld, 64);
   score += getNumberScore(gridNew, gridOld, 128);
   score += getNumberScore(gridNew, gridOld, 256);
   score += getNumberScore(gridNew, gridOld, 512);
   score += getNumberScore(gridNew, gridOld, 1024);
   score += getNumberScore(gridNew, gridOld, 2048);
   return score;
}

function getClassesForNumber(digit) {
   switch (digit) {
      case 0: return 'bg--lightgray';
      case 2: return 'bg--lightyellow';
      case 4: return 'bg--lightgreen';
      case 8: return 'bg--lightblue';
      case 16: return 'bg--lightred';
      case 32: return 'bg--yellow';
      case 64: return 'bg--green';
      case 128: return 'bg--blue';
      case 256: return 'bg--orange';
      case 512: return 'bg--red';
      case 1024: return 'bg--darkgreen';
      case 2048: return 'bg--darkred';
      default: return '';
   }
}

function getCol(cells, colNum) {
   switch (colNum) {
      case 1: return [cells[0],cells[4],cells[8],cells[12]];
      case 2: return [cells[1],cells[5],cells[9],cells[13]];
      case 3: return [cells[2],cells[6],cells[10],cells[14]];
      case 4: return [cells[3],cells[7],cells[11],cells[15]];
   }
}

function getRow(cells, rowNum) {
   switch (rowNum) {
      case 1: return [cells[0],cells[1],cells[2],cells[3]];
      case 2: return [cells[4],cells[5],cells[6],cells[7]];
      case 3: return [cells[8],cells[9],cells[10],cells[11]];
      case 4: return [cells[12],cells[13],cells[14],cells[15]];
   }
}

function recombine(group, direction) {
   switch (direction) {
      case 'UP':
         return [
            group[0][0],group[1][0],group[2][0],group[3][0],
            group[0][1],group[1][1],group[2][1],group[3][1],
            group[0][2],group[1][2],group[2][2],group[3][2],
            group[0][3],group[1][3],group[2][3],group[3][3]
         ];
      case 'DOWN':
         return [
            group[0][3],group[1][3],group[2][3],group[3][3],
            group[0][2],group[1][2],group[2][2],group[3][2],
            group[0][1],group[1][1],group[2][1],group[3][1],
            group[0][0],group[1][0],group[2][0],group[3][0]
         ];
      case 'LEFT':
         return [
            ...group[0],
            ...group[1],
            ...group[2],
            ...group[3],
         ];
      case 'RIGHT':
         return [
            ...group[0].reverse(),
            ...group[1].reverse(),
            ...group[2].reverse(),
            ...group[3].reverse(),
         ];
   }
}


function getCellGroups(cells, blRows, blReverse) {
   let groups = [];
   for (let i = 1; i <= 4; i++) {
      let group = blRows ? getRow(cells, i) : getCol(cells, i);
      groups.push(mergeFourCellsLeft(blReverse ? group.reverse() : group));
   }
   return groups;
}

function merge(cells, direction) {
   switch (direction) {
      case 'UP':
         return recombine(getCellGroups(cells, false, false), direction);
      case 'DOWN':
         return recombine(getCellGroups(cells, false, true), direction);
      case 'LEFT':
         return recombine(getCellGroups(cells, true, false), direction);
      case 'RIGHT':
         return recombine(getCellGroups(cells, true, true), direction);
   }
}

function isLoss(cells) {
   if (cells.filter(c => c === 0).length === 0) {
      if (cells[0] === cells[1] || cells[0] === cells[4]
       || cells[1] === cells[2] || cells[1] === cells[5]
       || cells[2] === cells[3] || cells[2] === cells[6]
                                || cells[3] === cells[7]
       || cells[4] === cells[5] || cells[4] === cells[8]
       || cells[5] === cells[6] || cells[5] === cells[9]
       || cells[6] === cells[7] || cells[6] === cells[10]
                                || cells[7] === cells[11]
       || cells[8] === cells[9] || cells[8] === cells[12]
       || cells[9] === cells[10] || cells[9] === cells[13]
       || cells[10] === cells[11] || cells[10] === cells[14]
                                  || cells[11] === cells[15]
       || cells[12] === cells[13]
       || cells[13] === cells[14]
       || cells[14] === cells[15]
      ) {
         return false;
      }
      return true;
   }
   return false;
}

function isWin(cells) {
   return cells.filter(c => c === 2048).length >= 1;
}

const Game2048 = Game({
   setup: () => ({
      cells: setupInitialCells(),
      points: 0
   }),
   moves: {
      move(G, ctx, direction) {
         let cells = merge([...G.cells], direction);
         let points = G.points + getRoundScore(cells, G.cells);
         if (!doGridsMatch(cells, G.cells)) {
            cells = addRandomNumber(cells);
         }
         return {...G,cells,points};
      }
   },
   flow: {
      movesPerTurn: 1,
      endGameIf: (G, ctx) => {
         if (isWin(G.cells)) {
            return true;
         }
         if (isLoss(G.cells)) {
            return false;
         }
      }
   }
});

class Board extends React.Component {
   move(direction) {
      this.props.moves.move(direction);
   }
   render() {
      let loss = null;
      let win = null;
      if (this.props.ctx.gameover === true) {
         win = <div>You win! You obtained the 2048!</div>;
      } else if (this.props.ctx.gameover === false) {
         loss = <div>Game over! No more possible moves</div>;
      }
      let tbody = [];
      for (let i = 0; i < 4; i++) {
         let cells = [];
         for (let j = 0; j < 4; j++) {
            const id = 4 * i + j;
            let digit = this.props.G.cells[id];
            let classes = 'box ';
            classes += getClassesForNumber(digit);
            let digitDisplay = (digit === 0) ? '' : digit;
            cells.push(
               <td className={classes} key={id}>{digitDisplay}</td>
            );
         }
         tbody.push(<tr key={i}>{cells}</tr>);
      }
      // let scoreboard = (typeof this.props.G.score === Number) ? this.props.G.score : 0;
      return (
         <div className="game" onKeyPress={(e) => this.pressButton(e)}>
            {loss}
            <div className="scoreboard">Score: {this.props.G.points}</div>
            <table id="board">
               <tbody>{tbody}</tbody>
            </table>
            <div className="controls">
               <div className="pad">
                  <button className="button button--left" onClick={() => this.move('LEFT')}>&#9664;</button>
                  <button className="button button--up" onClick={() => this.move('UP')}>&#9650;</button>
                  <button className="button button--down" onClick={() => this.move('DOWN')}>&#9660;</button>
                  <button className="button button--right" onClick={() => this.move('RIGHT')}>&#9654;</button>
               </div>
            </div>
         </div>
      );
   }
}

const App = Client({
   game: Game2048,
   board: Board,
   debug: false
})

export default App;
