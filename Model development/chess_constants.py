import numpy as np
import random

GAME_STATE_SHAPE = (6, 6, 51)
BOARD_STATE_START = 33
BOARD_INFO_START = -8
# BOARD_STATE_END = -2
MOVE_SHAPE = (6, 6, 54)
GAME_LENGTH_CAP = 75
PLAYER_TO_MOVE_INDEX = -6
UNDERPROMOTION_INDEX = 48


# starting state of the game
def init_state():
    state = np.zeros((6, 6, 51), dtype=np.byte)
    state[[0, 0, 5, 5], [0, 5, 0, 5], [38, 38, 33, 33]] = 1  # rooks
    state[[0, 0, 5, 5], [1, 4, 1, 4], [39, 39, 34, 34]] = 1  # knights
    state[[0, 5], 2, [40, 35]] = 1  # queen
    state[[0, 5], 3, [41, 36]] = 1  # king
    state[[1, 4], :, [42, 37]] = 1  # pawns

    # castling availability
    state[..., 47:] = 1

    return state


MOVE_TO_INDEX = {
    # knight moves
    (1, -2): 40,
    (2, -1): 41,
    (2, 1): 42,
    (1, 2): 43,
    (-1, 2): 44,
    (-2, 1): 45,
    (-2, -1): 46,
    (-1, -2): 47,
    # underpromotions
    (48, 0): 48,
    (49, 0): 49,
    (50, 0): 50,
    (51, 0): 51,
    (52, 0): 52,
    (53, 0): 53,
}


for dist in range(1, 6):
    MOVE_TO_INDEX[dist, 0] = dist * 8 - 8
    MOVE_TO_INDEX[dist, -dist] = dist * 8 - 7
    MOVE_TO_INDEX[0, -dist] = dist * 8 - 6
    MOVE_TO_INDEX[-dist, -dist] = dist * 8 - 5
    MOVE_TO_INDEX[-dist, 0] = dist * 8 - 4
    MOVE_TO_INDEX[-dist, dist] = dist * 8 - 3
    MOVE_TO_INDEX[0, dist] = dist * 8 - 2
    MOVE_TO_INDEX[dist, dist] = dist * 8 - 1

INDEX_TO_MOVE = {}
for move in MOVE_TO_INDEX:
    INDEX_TO_MOVE[MOVE_TO_INDEX[move]] = move
# add underpromotions
INDEX_TO_MOVE[48] = -1, 0
INDEX_TO_MOVE[49] = 0, 0
INDEX_TO_MOVE[50] = 1, 0
INDEX_TO_MOVE[51] = -1, 0
INDEX_TO_MOVE[52] = 0, 0
INDEX_TO_MOVE[53] = 1, 0

UNDERPROMOTE_TO_ROOK = {-1: 48, 0: 49, 1: 50}
UNDERPROMOTE_TO_KNIGHT = {-1: 51, 0: 52, 1: 53}

INDEX_TO_NOTATION = {
    0: 'R', 1: 'N', 2: 'Q', 3: 'K', 4: '',
    5: 'R', 6: 'N', 7: 'Q', 8: 'K', 9: ''
}
INDEX_TO_COLUMNS_NOTATION = {
    0: "a", 1: "b", 2: "c", 3: "d", 4: "e", 5: "f"
}

# zobrist hashing
ZOBRIST_HASH = np.zeros((6, 6, 10), dtype=np.int64)
for x in range(6):
    for y in range(6):
        for p in range(10):
            ZOBRIST_HASH[y, x, p] = random.getrandbits(20)
