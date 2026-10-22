export enum CellState {
	Empty = "-",
	EX = "X",
	OH = "O",
}

export function invertCell(cell: CellState) {
	if (cell === CellState.Empty) return CellState.Empty
	return cell === CellState.EX ? CellState.OH : CellState.EX
}

export type GameBoard = CellState[]

export type GameState = {
	board: GameBoard
	player_x_id: string | null
	player_o_id: string | null // null indicates a computer player (Singleplayer)
	current_turn: CellState
	winner: CellState | null // null indicates a game is still running and CellState.Empty indicates a draw
}

export function initializeBoard(side_length: number): GameBoard {
	return Array(side_length * side_length).fill(CellState.Empty)
}

export function parseBoard(board: string): GameBoard {
	const parsed_board: GameBoard = []
	for (let i = 0; i < board.length; i++) {
		const char = board[i]
		if (char === CellState.Empty || char === CellState.EX || char === CellState.OH) {
			parsed_board.push(char as CellState)
		} else {
			throw new Error(`Invalid character in game board: ${char}`)
		}
	}
	return parsed_board
}

export function serializeBoard(board: GameBoard): string {
	return board.join("")
}

export function getEmptyCells(board: GameBoard): number[] {
	return board
		.map((cell, index) => (cell === CellState.Empty ? index : -1))
		.filter((index) => index !== -1)
}

export function checkWinner(board_side_length: number, board: GameBoard): CellState | null {
	if (board.length === 0) return CellState.Empty

	for (let i = 0; i < board_side_length; i++) {
		// Check Row i
		const row_start = i * board_side_length
		const row = board.slice(row_start, row_start + board_side_length)
		if (row[0] !== CellState.Empty && row.every((cell) => cell === row[0])) {
			return row[0]
		}

		// Check Column i
		const column = Array.from(
			{ length: board_side_length },
			(_, j) => board[j * board_side_length + i]
		)
		if (column[0] !== CellState.Empty && column.every((cell) => cell === column[0])) {
			return column[0]
		}
	}

	// Check Main Diagonal
	const main_diagonal = Array.from(
		{ length: board_side_length },
		(_, i) => board[i * board_side_length + i]
	)
	if (
		main_diagonal[0] !== CellState.Empty &&
		main_diagonal.every((cell) => cell === main_diagonal[0])
	) {
		return main_diagonal[0]
	}

	// Check Anti Diagonal
	const anti_diagonal = Array.from(
		{ length: board_side_length },
		(_, i) => board[i * board_side_length + (board_side_length - 1 - i)]
	)
	if (
		anti_diagonal[0] !== CellState.Empty &&
		anti_diagonal.every((cell) => cell === anti_diagonal[0])
	) {
		return anti_diagonal[0]
	}

	if (getEmptyCells(board).length === 0) return CellState.Empty
	return null
}
