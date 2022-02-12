//The size of board on a single dimension - board
//is assumed to always be square
const BoardSize = 10

//Number of mines to place on the board
const Mines = 15

//Total Number of cells in the board
const TotalCells = BoardSize * BoardSize

//The game state object
const state = {

  //Determines if the game is over or not
  gameOver: false,

  //True if the game is over and the player has won, false if the player lost
  won: false,

  //An "array of arrays" (a 2d array) that represents the cells of the board. Each
  //index in the array represents a row. The value of each index is also
  //an array with each index representing a column in that row. You can visualize
  //it like this:
  //
  // [
  //  [ {/* column 0 */ }, { /* column 1 */ }, /* etc..*/  ], /*row 0*/
  //  [ {/* column 0 */ }, { /* column 1 */ }, /* etc..*/  ], /*row 1*/
  //  /* etc. */
  // ]
  //
  //A board cell can be accessed through state.board[rowNumber][columnNumber].
  //The setUpBoard() function initializes this array when the game is started.
  board: [],

  //Tracks the number of spaces cleared by the player
  cleared: 0,
}

/////////////////////// State Functions ////////////////////////

//Initializes the board state
function setUpBoard() {

  //Reset the game state variables
  state.gameOver = false
  state.won = false
  state.cleared = 0

  //Initialize the board array
  let positions = []

  //For each row in the board
  for (let row = 0; row < BoardSize; row++) {

    //Create a new array to store the columns in that row
    state.board[row] = new Array(BoardSize)

    //For each column in that row
    for (let col = 0; col < BoardSize; col++) {

      //Populate the board position with a new object that represents
      //the state of that cell
      state.board[row][col] = {
        mine: false,
        cleared: false,
        flagged: false,
        surrounding: 0,
        row: row,
        col: col,
      }

      //Store this position in an array of all positions that we'll
      //use in the next step to randomly place the mines
      positions.push({ row: row, col: col })
    }
  }

  //Shuffle the positions array then take the first N elements
  //based on how many mines we want to create - this gives us
  //an array of random positions we can use for the mines
  shuffle(positions)
  positions = positions.slice(0, Mines)

  //Go through each of the random positions and update the board
  //cell at that position to set the mine flag to true
  for (const position of positions) {
    const cell = state.board[position.row][position.col]
    cell.mine = true
  }

  //Go through each cell on the board and update the surrounding
  //property to record the number of mines surrounding that cell.
  forAll(function (cell) {
    cell.surrounding = countSurroundingMines(cell.row, cell.col)
  })
}

//Checks if a row or column position is outside the
//boundary of the board
function outOfBounds(pos) {
  return pos < 0 || pos >= BoardSize
}

//Takes a callback function and invokes that function for
//each cell on the board passing in the cell object
function forAll(callback) {
  for (let row = 0; row < BoardSize; row++) {
    for (let col = 0; col < BoardSize; col++) {
      callback(state.board[row][col])
    }
  }
}

//Takes a row number and column number and executes
//the passed callback function for each surrounding
//cell passing in the cell object
function forSurrounding(row, col, callback) {
  const offsets = [-1, 0, 1]
  offsets.forEach(function (rowOffset) {
    offsets.forEach(function (colOffset) {

      //If the both offsets are 0, we are on the
      //current cell so skip
      if (rowOffset === 0 && colOffset === 0) {
        return
      }

      //Workout the surrounding row and column position
      //by adding the offset to the passed row and column
      const checkRow = row + rowOffset
      const checkCol = col + colOffset

      //if either the row or column are outside the grid area
      //then return
      if (outOfBounds(checkRow) || outOfBounds(checkCol)) {
        return
      }

      //Invoke the passed callback function and pass in the 
      //cell object from the board
      callback(state.board[checkRow][checkCol])
    })
  })
}

//Given a row and column number, returns the number
//of mines in the surrounding cells
function countSurroundingMines(row, col) {
  let mines = 0
  forSurrounding(row, col, function (cell) {
    if (cell.mine) {
      mines++
    }
  })

  return mines
}

//Randomizes the items in-place in the passed array
function shuffle(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

//Clear the specified cell. If the cell is a mine or the
//player has cleared all the non-mine cells, the game status
//will also be updated
function clearCell(cell) {
  if (cell.cleared) {
    return
  }

  if (cell.flagged) {
    cell.flagged = false
  }

  cell.cleared = true

  if (cell.mine) {
    state.gameOver = true
    state.won = false
  } else {
    state.cleared++
    const remaining = TotalCells - state.cleared
    if (remaining === Mines) {
      state.gameOver = true
      state.won = true
    }
    if (cell.surrounding === 0) {
      //If there are no mines in the surrounding cell,
      //call this function recursively for each surrounding
      //cell to "clear" all the cells until we find a cell
      //that does have surrounding mines.
      forSurrounding(cell.row, cell.col, clearCell)
    }
  }
}

//Toggles the flag status of a cell
function flagCell(cell) {
  cell.flagged = !cell.flagged
}

function reset() {
  setUpBoard()
  render()
}

/////////////////////// Render Functions ////////////////////////

//Top-level render function. Updates the prompt and recreates the
//board and cells.
function render() {
  const boardContainerEl = createBoardElement()
  const mainEl = document.querySelector("main")
  
  updatePromptElement()

  //For each cell, create a cell element and add to the 
  //board element
  forAll(function(cell){
    const cellEl = createCellElement(cell)
    boardContainerEl.append(cellEl)
  })

  //Add the board element to page
  mainEl.prepend(boardContainerEl)
}

//Update the prompt element based on the game completion state
function updatePromptElement() {
  const promptEl = document.querySelector(".prompt")
  if (!state.gameOver) {
    promptEl.innerText = "Click to clear, right-click to flag"
  } else if (state.won) {
    promptEl.innerText = "🎉 You won!"
  } else {
    promptEl.innerText = "😢 Game over"
  }
}

//Create and return a new board element, removing the
//existing board element
function createBoardElement() {
  
  //Find the existing board element
  let boardContainerEl = document.querySelector(".board")
  //Remove the existing board
  boardContainerEl.remove()
  //Create a new board
  boardContainerEl = document.createElement("div")

  boardContainerEl.classList.add("board")
  if (state.won) {
    boardContainerEl.classList.add("won")
  } else if (!state.gameOver) {
    boardContainerEl.classList.add("playing")
  }

  //Create CSS Grid columns based on how many cells we have in each row
  boardContainerEl.style.gridTemplateColumns = `repeat(${BoardSize}, 50px)`

  return boardContainerEl
}

//Creates and returns an individual board cell element
function createCellElement(cell) {
  const cellEl = document.createElement("div")
  cellEl.classList.add("cell")
  if (cell.cleared) {
    if (cell.mine) {
      cellEl.classList.add("mine")
      cellEl.innerText = "💣"
    } else {
      cellEl.classList.add("cleared")
      if (cell.surrounding > 0) {
        const countEl = document.createElement("p")
        countEl.innerText = cell.surrounding
        cellEl.append(countEl)
      }
    }
  } else if (cell.flagged) {
    cellEl.innerText = "🚩"
  }

  //When the game is over, show all mines
  if (state.gameOver && cell.mine) {
    cellEl.classList.add("mine")
    cellEl.innerText = "💣"
  }

  //Only listen for events on cells if the game is not over
  if (!state.gameOver) {
    //When this cell is clicked
    cellEl.addEventListener("click", function () {
      //Update the state
      clearCell(cell)
      //Render
      render()
    })

    //When this cell is right-clicked
    cellEl.addEventListener("contextmenu", function (e) {
      //Prevent the context menu showing on right click
      e.preventDefault()
      //Update the state
      flagCell(cell)
      //Render
      render()
    })
  }

  return cellEl
}

//When the rest button is clicked, call the reset
//function to reset the game state
const restButtonEl = document.querySelector("#reset")
restButtonEl.addEventListener("click", function () {
  reset()
})

//Set up the board the first time the page loads
reset()
