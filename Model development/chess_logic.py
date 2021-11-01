from collections import Counter

import numpy as np
# from numba import njit

import chess_constants as constants


# game state representation:
# Shape: (6, 6, 51)
# Plane size: 6 x 6; Number of planes: (5 + 5 + 1) * 3 + (5 + 5 + 2) + 6 = 51
# Feature               Planes
# White Pieces          5       |
# Black Pieces          5       | -> 3 previous board
# Repetition count      1       |

# White Pieces          5       |
# Black Pieces          5       | -> current board
# Repetition count      2       |

# Player to move        1   (0 = white to move, 1 = black to move)
# Total move count      1
# White castling        2   (Queenside - Kingside)
# Black castling        2

# move representation:
# Shape: (6, 6, 54)
# Number of planes: 54
# Feature               Planes
# Orthogonal moves      20
# Diagonal moves        20
# Knight moves          8
# Underpromotions       2 * 3 = 6
#        L  M  R
#      R 48 49 50
#      N 51 52 53

# @njit
def is_same_side(board_state, x, y, s):
    # check if piece at x, y is on side s
    # returns false if x, y is empty
    p = np.nonzero(board_state[y, x])[0]
    if not p.size:
        return False
    return (s == -1 and p[0] < 5) or (s == 1 and p[0] >= 5)


# @njit
def get_rook_moves(board_state, px, py, s):
    # RIGHT
    for dx in range(1, 6 - px):
        x = px + dx
        if not np.any(board_state[py, x]):
            yield dx, 0
        else:
            p = np.nonzero(board_state[py, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield dx, 0
            break

    # UP
    for dy in range(1, py + 1):
        y = py - dy
        if not np.any(board_state[y, px]):
            yield 0, -dy
        else:
            p = np.nonzero(board_state[y, px])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield 0, -dy
            break

    # LEFT
    for dx in range(1, px + 1):
        x = px - dx
        if not np.any(board_state[py, x]):
            yield -dx, 0
        else:
            p = np.nonzero(board_state[py, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield -dx, 0
            break

    # DOWN
    for dy in range(1, 6 - py):
        y = py + dy
        if not np.any(board_state[y, px]):
            yield 0, dy
        else:
            p = np.nonzero(board_state[y, px])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield 0, dy
            break


# @njit
def get_knight_moves(board_state, px, py, s):
    for i in (-1, 1):
        x = px + i + i
        if 6 > x >= 0:
            y = py + 1
            if y < 6 and not is_same_side(board_state, x, y, s):
                yield i + i, 1
            y = py - 1
            if y >= 0 and not is_same_side(board_state, x, y, s):
                yield i + i, -1

        y = py + i + i
        if 6 > y >= 0:
            x = px + 1
            if x < 6 and not is_same_side(board_state, x, y, s):
                yield 1, i + i
            x = px - 1
            if x >= 0 and not is_same_side(board_state, x, y, s):
                yield -1, i + i


# @njit
def get_queen_moves(board_state, px, py, s):
    # RIGHT
    for dx in range(1, 6 - px):
        x = px + dx
        if not np.any(board_state[py, x]):
            yield dx, 0
        else:
            p = np.nonzero(board_state[py, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield dx, 0
            break

    # UP
    for dy in range(1, py + 1):
        y = py - dy
        if not np.any(board_state[y, px]):
            yield 0, -dy
        else:
            p = np.nonzero(board_state[y, px])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield 0, -dy
            break

    # LEFT
    for dx in range(1, px + 1):
        x = px - dx
        if not np.any(board_state[py, x]):
            yield -dx, 0
        else:
            p = np.nonzero(board_state[py, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield -dx, 0
            break

    # DOWN
    for dy in range(1, 6 - py):
        y = py + dy
        if not np.any(board_state[y, px]):
            yield 0, dy
        else:
            p = np.nonzero(board_state[y, px])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield 0, dy
            break

    # TOP RIGHT
    for dist in range(1, min(5 - px, py) + 1):
        x = px + dist
        y = py - dist
        if not np.any(board_state[y, x]):
            yield dist, -dist
        else:
            p = np.nonzero(board_state[y, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield dist, -dist
            break

    # TOP LEFT
    for dist in range(1, min(px, py) + 1):
        x = px - dist
        y = py - dist
        if not np.any(board_state[y, x]):
            yield -dist, -dist
        else:
            p = np.nonzero(board_state[y, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield -dist, -dist
            break

    # BOTTOM LEFT
    for dist in range(1, min(px, 5 - py) + 1):
        x = px - dist
        y = py + dist
        if not np.any(board_state[y, x]):
            yield -dist, +dist
        else:
            p = np.nonzero(board_state[y, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield -dist, +dist
            break

    # BOTTOM RIGHT
    for dist in range(1, 6 - max(px, py)):
        x = px + dist
        y = py + dist
        if not np.any(board_state[y, x]):
            yield dist, dist
        else:
            p = np.nonzero(board_state[y, x])[0]
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield dist, dist
            break


# @njit
def get_king_moves(board_state, px, py, s):
    for dx, dy in ((1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1)):
        x = px + dx
        y = py + dy
        if (6 > x >= 0 and 6 > y >= 0) and not is_same_side(board_state, x, y, s):
            yield dx, dy


# @njit
def get_pawn_moves(board_state, px, py, s):
    y = py + s
    can_promote = (s == -1 and py == 1) or (s == 1 and py == 4)
    # moving forward
    p = np.nonzero(board_state[y, px])[0]
    if (6 > y >= 0) and not p.size:
        yield 0, s
        if can_promote:
            yield 49, 0
            yield 52, 0

    # taking on left side
    x = px - 1
    if x >= 0:
        p = np.nonzero(board_state[y, x])[0]
        if p.size:
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield -1, s
                if can_promote:
                    yield 48, 0
                    yield 51, 0

    # taking on right dide
    x = px + 1
    if x < 6:
        p = np.nonzero(board_state[y, x])[0]
        if p.size:
            if (s == -1 and p >= 5) or (s == 1 and p < 5):
                yield 1, s
                if can_promote:
                    yield 50, 0
                    yield 53, 0


# @njit
def get_moves(board_state, px, py, t):
    s = 1 if np.nonzero(board_state[py, px])[0][0] > 4 else -1

    if t == 0 or t == 5:
        r = [move for move in get_rook_moves(board_state[..., :-8], px, py, s)]
    elif t == 1 or t == 6:
        r = [move for move in get_knight_moves(board_state[..., :-8], px, py, s)]
    elif t == 2 or t == 7:
        r = [move for move in get_queen_moves(board_state[..., :-8], px, py, s)]
    elif t == 3 or t == 8:
        r = [move for move in get_king_moves(board_state[..., :-8], px, py, s)]
    else:
        r = [move for move in get_pawn_moves(board_state[..., :-8], px, py, s)]

    if t == 3:
        # if piece is a king, check castling availability
        if s == 1:  # black
            # kingside
            if board_state[0, 0, -1] and not board_state[0, 4, :-8].any():
                # if castle is available and no piece in the way
                r.append((2, 0))
            # queenside
            if board_state[0, 0, -2] and not (board_state[0, 1, :-8].any() or board_state[0, 2, :-8].any()):
                r.append((-2, 0))
        else:  # white
            if board_state[0, 0, -3] and not board_state[5, 4, :-8].any():
                r.append((2, 0))
            if board_state[0, 0, -4] and not (board_state[5, 1, :-8].any() or board_state[5, 2, :-8].any()):
                r.append((-2, 0))

    return r


# @njit
def hash_board(board_state):
    h = 0
    for y in range(6):
        for x in range(6):
            for i in range(10):
                if board_state[y, x, i] == 0:
                    h ^= constants.ZOBRIST_HASH[y, x, i]
    # encode castling right + player to move
    h <<= 5
    if board_state[0, 0, -1]:
        h += 1
    if board_state[0, 0, -2]:
        h += 2
    if board_state[0, 0, -3]:
        h += 4
    if board_state[0, 0, -4]:
        h += 8
    if board_state[0, 0, -6]:
        h += 16
    return h


def move_board(board_state, m, history):
    y, x, d = m
    p = np.nonzero(board_state[y, x, :-8])[0][0]
    board_state[y, x, p] = 0

    dx, dy = constants.INDEX_TO_MOVE[d]

    if p == 3:  # if picked up white king
        # moved the king -> no more castling
        board_state[..., [-4, -3]] = 0
        if d == constants.MOVE_TO_INDEX[2, 0]:
            # kingside
            board_state[5, 5, 0] = 0
            board_state[5, 3, 0] = 1
            board_state[5, 4, 3] = 1
            history.clear()  # clear history if castled
        elif d == constants.MOVE_TO_INDEX[-2, 0]:
            # queenside
            board_state[5, 0, 0] = 0
            board_state[5, 2, 0] = 1
            board_state[5, 1, 3] = 1
            history.clear()
        else:
            # move normally
            if board_state[y + dy, x + dx, :-8].any():
                history.clear()  # clear history if a piece is taken
                board_state[y + dy, x + dx, :-8] = 0
            board_state[y + dy, x + dx, 3] = 1
    elif p == 8:  # same with black king
        board_state[..., [-2, -1]] = 0
        if d == constants.MOVE_TO_INDEX[2, 0]:
            board_state[0, 5, 5] = 0
            board_state[0, 3, 5] = 1
            board_state[0, 4, 8] = 1
            history.clear()
        elif d == constants.MOVE_TO_INDEX[-2, 0]:
            board_state[0, 0, 5] = 0
            board_state[0, 2, 5] = 1
            board_state[0, 1, 8] = 1
            history.clear()
        else:
            if board_state[y + dy, x + dx, :-8].any():
                history.clear()
                board_state[y + dy, x + dx, :-8] = 0
            board_state[y + dy, x + dx, 8] = 1
    elif p == 4 or p == 9:  # picked up a pawn
        history.clear()  # clear history after a pawn move
        ty = y - 1 if p == 4 else y + 1
        board_state[ty, x + dx, :-8] = 0
        if ty == 0 or ty == 5:  # if a pawn is promoting
            if d < 48:
                # promoting to a queen (default)
                board_state[ty, x + dx, p - 2] = 1
            elif d < 51:
                # promoting to a rook
                board_state[ty, x + dx, p - 4] = 1
            else:
                # promoting to a knight
                board_state[ty, x + dx, p - 3] = 1
        else:
            board_state[ty, x + dx, p] = 1
    else:
        if board_state[y + dy, x + dx, :-8].any():
            history.clear()  # clear history if a piece is taken
            board_state[y + dy, x + dx, :-8] = 0
        # moved the rook -> no more castle
        if p == 0:
            if x == 0:
                board_state[..., -4] = 0
            elif x == 5:
                board_state[..., -3] = 0
            board_state[y + dy, x + dx, 0] = 1
        elif p == 5:
            if x == 0:
                board_state[..., -2] = 0
            elif x == 5:
                board_state[..., -1] = 0
            board_state[y + dy, x + dx, 5] = 1
        else:
            # move normally
            board_state[y + dy, x + dx, p] = 1

    # toggle black/white
    board_state[..., -6] = not board_state[0, 0, -6]
    # update movecount
    board_state[0, 0, -5] += 1

    # repetition
    zobrist_hash = hash_board(board_state)
    history[zobrist_hash] += 1

    if history[zobrist_hash] >= 2:
        board_state[..., -8] = 1
        if history[zobrist_hash] == 3:
            board_state[..., -7] = 1


# @njit
def update_game(game_state, board_state):
    game_state[..., :33] = game_state[..., 11:44]
    game_state[..., 33:] = board_state


def move_game(game_state, m, history):
    game_state[..., :33] = game_state[..., 11:44]
    move_board(game_state[..., 33:], m, history)


# @njit
def get_pieces(board_state, side):
    return np.argwhere(board_state[..., slice(5, 10) if side else slice(5)])


# @njit
def is_checked(board_state, side):
    k = 8 if side else 3
    for y, x, t in get_pieces(board_state, not side):
        for dx, dy in get_moves(board_state, x, y, t):
            if x + dx < 6:  # don't care about underpromotions
                if board_state[y + dy, x + dx, k]:
                    return True
    return False


def get_legal_moves(board_state, side):
    # get all legal moves from side
    moves = []
    currently_in_check = is_checked(board_state, side)
    for y, x, t in get_pieces(board_state, side):
        for dx, dy in get_moves(board_state, x, y, t):
            d = constants.MOVE_TO_INDEX[dx, dy]
            new_board = board_state.copy()
            move_board(new_board, (y, x, d), Counter())
            if not is_checked(new_board, side):
                # castling
                if t == 3:  # if picked a king
                    if (dx, dy) == (2, 0) and currently_in_check:  # can't castle out of check
                        continue
                    if (dx, dy) == (-2, 0):  # queenside
                        if currently_in_check:
                            continue
                        ky = 0 if side else 5
                        p = 8 if side else 3
                        # can't castle into or through a square that is under attack
                        new_board[ky, 1, p] = 0
                        new_board[ky, 2, p - 3] = 0
                        new_board[ky, 2, p] = 1
                        if is_checked(new_board, side):
                            continue
                moves.append((y, x, d))
    return moves


def is_movable(board_state, side):
    # modified get_legal_moves
    for y, x, t in get_pieces(board_state, side):
        for dx, dy in get_moves(board_state, x, y, t):
            if (dx == 2 or dx == -2) and t == 3:
                # can't move => can't castle => don't need to check for castles
                continue
            d = constants.MOVE_TO_INDEX[dx, dy]
            new_board = board_state.copy()
            move_board(new_board, (y, x, d), Counter())
            if not is_checked(new_board, side):
                return True
    return False


def evaluate(board_state):
    side = board_state[0, 0, -6]
    if not is_movable(board_state, side):
        if is_checked(board_state, side):
            return -1 if side else 1  # checkmate
        return 0  # stalemate

    if board_state[0, 0, -7]:
        return 0  # 3-fold repetition
    if board_state[0, 0, -5] >= 127:
        return 0
    return 2


def format_state(game_state):
    # flip board to current player
    if game_state[0, 0, -6]:
        f_s = np.flip(game_state, 0).astype(float)
    else:
        f_s = game_state.astype(float)

    # decode total move count plane
    f_s[..., -5] = game_state[0, 0, -5] / 127

    return f_s


def format_pi(pi, side):
    # flip board to current player
    if side:
        f_p = np.flip(pi, 0).copy()
    else:
        f_p = pi.copy()

    return f_p


def format_policy(game_state, p):
    # re-orient pi
    if game_state[0, 0, -6] == 1:
        return np.flip(p, 0)
    return p


def move_to_iccf_notation(board_state, m):
    y, x, d = m
    dx, dy = constants.INDEX_TO_MOVE[d]
    underpromotion = ""
    p = np.nonzero(board_state[y, x, :-8])[0][0]
    if (p == 4 and y == 1) or (p == 9 and y == 4):
        if d < 48:
            underpromotion = 1
        else:
            dy = -1 if p == 4 else 1
            if d < 51:
                underpromotion = 2
            else:
                underpromotion = 4

    return f"{board_state[0, 0, -5]}. {x}{y}{x + dx}{y + dy}{underpromotion}"


rules = {
    0: get_rook_moves,
    1: get_knight_moves,
    2: get_queen_moves,
    3: get_king_moves,
    4: get_pawn_moves,
    5: get_rook_moves,
    6: get_knight_moves,
    7: get_queen_moves,
    8: get_king_moves,
    9: get_pawn_moves
}


def move_to_algebraic_notation(board_state, m):
    notation = str(board_state[0, 0, -5]) + ". "
    y, x, d = m
    s = 1 if np.nonzero(board_state[y, x])[0][0] > 4 else -1
    dx, dy = constants.INDEX_TO_MOVE[d]

    p = np.nonzero(board_state[y, x, :-8])[0][0]
    if p == 3 or p == 8:
        if dx == 2:
            return notation + "O-O"
        elif dx == -2:
            return notation + "O-O-O"
    notation += constants.INDEX_TO_NOTATION[p]

    new_board = board_state.copy()
    move_board(new_board, m, Counter())

    _ps = np.transpose(np.nonzero(board_state[..., p]))
    same_column_flag = False
    same_row_flag = False
    for _y, _x in _ps:
        if y == _y and x == _x:
            continue
        for _dx, _dy in rules[p](board_state[..., :-8], _x, _y, s):
            if _x + _dx == x + dx and _y + _dy == y + dy:
                if x == _x:
                    same_column_flag = True
                else:
                    same_row_flag = True
    if same_row_flag:
        notation += constants.INDEX_TO_COLUMNS_NOTATION[x]
    if same_column_flag:
        notation += str(6 - y)

    if board_state[y + dy, x + dx, :-8].any():
        if (not same_row_flag) and (p == 4 or p == 9):
            notation += constants.INDEX_TO_COLUMNS_NOTATION[x]
        notation += "x"

    notation += constants.INDEX_TO_COLUMNS_NOTATION[x + dx]
    if (p == 4 and y == 1) or (p == 9 and y == 4):
        notation += str(6 - y + s)
        notation += "="
        if d < 48:
            notation += "Q"
        elif d < 51:
            notation += "R"
        else:
            notation += "N"
    else:
        notation += str(6 - y - dy)

    if is_checked(new_board, 0 if s == 1 else 1):
        if not is_movable(new_board, 0 if s == 1 else 1):
            notation += "#"
        else:
            notation += "+"
    return notation


def move_to_notation(board_state, m):
    return move_to_iccf_notation(board_state, m)


def notation_to_move(notation):
    move_notation = notation.split()[1]
    x = int(move_notation[0])
    y = int(move_notation[1])
    tx = int(move_notation[2])
    ty = int(move_notation[3])
    if len(move_notation) == 5:
        # promotion
        if move_notation[4] == "1":  # queen
            return y, x, constants.MOVE_TO_INDEX[tx - x, ty - y]
        elif move_notation[4] == "2":  # rook
            return y, x, constants.UNDERPROMOTE_TO_ROOK[tx - x]
        elif move_notation[4] == "4":  # knight
            return y, x, constants.UNDERPROMOTE_TO_KNIGHT[tx - x]
        else:
            raise ValueError("Can't promote to: " + move_notation[4])

    return y, x, constants.MOVE_TO_INDEX[tx - x, ty - y]
