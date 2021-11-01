import sys
from collections import Counter

import numpy as np
from PyQt5.QtCore import Qt, QRect, QMargins
from PyQt5.QtGui import QImage, QPainter, QBrush, QColor, QPen
from PyQt5.QtWidgets import (QMainWindow, QApplication, QLabel, QScrollArea, QWidget, QGridLayout, QPushButton)

import chess_constants as constants
import chess_logic as logic

inp_dir = "games/sample game.txt"
padding = 40
grid_width, grid_height = 80, 80
board_width = grid_width * 6
board_height = grid_height * 6

piece_width, piece_height = 80, 80

info_width = 512
info_line_height = int(info_width / 8)
info_scrollbar_width = 23

top = 600
left = 100
width = board_width + info_width + padding * 3
height = board_height + padding * 2


def load_img(path):
    img = QImage()
    img.load(path)
    return img


images = {
    0: load_img("images/wr.png"),
    1: load_img("images/wn.png"),
    2: load_img("images/wq.png"),
    3: load_img("images/wk.png"),
    4: load_img("images/wp.png"),
    5: load_img("images/br.png"),
    6: load_img("images/bn.png"),
    7: load_img("images/bq.png"),
    8: load_img("images/bk.png"),
    9: load_img("images/bp.png")
}


def get_movables(board_state, px, py):
    legal_moves = logic.get_legal_moves(board_state, board_state[0, 0, constants.PLAYER_TO_MOVE_INDEX])
    r = []

    for m in legal_moves:
        if m[0] == py and m[1] == px:
            r.append(m[2])

    return r


class Window(QMainWindow):

    def __init__(self):
        super(Window, self).__init__()

        title = "Chess board"
        self.setWindowTitle(title)
        self.setGeometry(top, left, width, height)
        self.setFocusPolicy(Qt.StrongFocus)

        self.board_img = QImage()
        self.board_img.load("images/board.png")
        self.movable_img = QImage()
        self.movable_img.load("images/movable.png")

        self.board_rect = QRect(padding, padding, board_width, board_height)
        self.p_rects = []
        for y in range(6):
            r = []
            for x in range(6):
                r.append(QRect(int(padding + x * grid_width),
                               int(padding + y * grid_height),
                               piece_width, piece_height))
            self.p_rects.append(r)

        self.reset_visual()

        self.board = constants.init_state()[..., constants.BOARD_STATE_START:].copy()
        self.history = Counter()
        self.history[logic.hash_board(self.board)] += 1

        self.init_info()

    def init_info(self):
        self.info = QScrollArea(self)
        self.info.setStyleSheet(
            "border-bottom: none;\
            border-left: none;\
            border-right: none;\
            border-top: none;\
            padding: none;\
            text-align: left;"
        )

        self.info_grid = QGridLayout()
        self.info_grid.setSpacing(0)
        mar = QMargins(0, 0, 0, 0)
        self.info_grid.setContentsMargins(mar)
        self.info_grid.setAlignment(Qt.AlignTop)

        self.info_gridW = QWidget()
        self.info_gridW.setLayout(self.info_grid)

        self.info = QScrollArea(self)
        self.info.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOn)
        self.info.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        self.info.setFocusPolicy(Qt.NoFocus)
        self.info.setWidgetResizable(True)
        self.info.setWidget(self.info_gridW)
        self.info.setContentsMargins(mar)
        self.info.setGeometry(
            padding * 2 + board_width, padding,
            info_width + info_scrollbar_width, board_height
        )

        self.info_rect = QRect(padding * 2 + board_width, padding, info_width, board_height)
        self.move_history = []
        self.c = 0
        self.current_c = 0

    def paintEvent(self, event):

        painter = QPainter(self)
        # draw the board background
        painter.drawImage(self.board_rect, self.board_img, self.board_img.rect())

        # draw the highlights
        painter.setBrush(QBrush(QColor(255, 255, 0, 100), Qt.SolidPattern))
        painter.setPen(Qt.NoPen)
        for h in self.highlight:
            painter.drawRect(self.p_rects[h[1]][h[0]])

        # draw the pieces
        for y in range(6):
            for x in range(6):
                for t in range(10):
                    if self.board[y][x][t]:
                        img = images[t]
                        painter.drawImage(self.p_rects[y][x], img, img.rect())

        # draw the movables
        for d in self.movable:
            if d >= constants.UNDERPROMOTION_INDEX:
                # don't draw underpromote moves
                continue
            dx, dy = constants.INDEX_TO_MOVE[d]
            x, y = self.selected[0] + dx, self.selected[1] + dy
            if np.nonzero(self.board[y, x, :constants.BOARD_INFO_START])[0].size:
                painter.setBrush(Qt.NoBrush)
                pen = QPen()
                pen.setWidth(10)
                pen.setColor(QColor(0, 0, 0, 30))
                painter.setPen(pen)
                painter.drawEllipse(int(x * grid_width + 5) + padding,
                                    int(y * grid_height + 5) + padding,
                                    70, 70)
            else:
                painter.setBrush(QBrush(QColor(0, 0, 0, 30), Qt.SolidPattern))
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(int(x * grid_width + 25) + padding,
                                    int(y * grid_height + 25) + padding,
                                    30, 30)

        # draw underpromotion
        if len(self.underpromotion):
            s = 0 if self.c % 2 == 0 else 1
            painter.setBrush(QBrush(Qt.white, Qt.SolidPattern))
            pen = QPen()
            pen.setWidth(8)
            pen.setColor(QColor(0, 0, 0, 60))
            painter.setPen(pen)
            painter.drawRect(self.underpromotion[0] * grid_width + padding, grid_height * (3 if s else 0) + padding,
                             grid_width, grid_height * 3)
            queen_img = images[7 if s else 2]
            painter.drawImage(self.p_rects[self.underpromotion[1]][self.underpromotion[0]], queen_img, queen_img.rect())
            rook_img = images[5 if s else 0]
            painter.drawImage(self.p_rects[self.underpromotion[1] - 1 if s else 1][self.underpromotion[0]],
                              rook_img, rook_img.rect())
            knight_img = images[6 if s else 1]
            painter.drawImage(self.p_rects[self.underpromotion[1] - 2 if s else 2][self.underpromotion[0]],
                              knight_img, knight_img.rect())

        # draw info
        # painter.setPen(QPen(Qt.black, 3, Qt.SolidLine))
        # painter.drawRect(self.info_rect)

        self.update()

    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            for y in range(6):
                for x in range(6):
                    if self.p_rects[y][x].contains(event.pos()):
                        # if we click a grid
                        if self.selected is None:
                            # if we we didn't select a piece
                            if logic.is_same_side(self.board[..., :constants.BOARD_INFO_START],
                                                  x, y, -1 if self.c % 2 == 0 else 1):
                                # if it's the right color
                                self.selected = (x, y)  # select the piece
                                self.movable = get_movables(self.board, x, y)  # get legal moves
                                self.highlight = [(x, y)]  # highlight the grid
                            else:
                                # we clicked an empty grid
                                self.reset_visual()
                        elif self.selected == (x, y):
                            # if we clicked on the already seleted piece
                            self.reset_visual()
                        elif len(self.underpromotion):
                            dy = -1 if self.c % 2 == 0 else 1
                            d = None
                            if x == self.underpromotion[0]:
                                if y == self.underpromotion[1]:
                                    # => to a queen
                                    d = constants.MOVE_TO_INDEX[x - self.selected[0], dy]
                                elif y == self.underpromotion[1] - dy:
                                    # => to a rook
                                    d = constants.UNDERPROMOTE_TO_ROOK[x - self.selected[0]]
                                elif y == self.underpromotion[1] - dy - dy:
                                    # => to a knight
                                    d = constants.UNDERPROMOTE_TO_KNIGHT[x - self.selected[0]]
                            if d is None:
                                # clicked somewhere else
                                self.reset_visual()
                                return

                            self.add_move((self.selected[1], self.selected[0], d))
                            self.highlight_button(self.current_c)
                            logic.move_board(self.board, (self.selected[1], self.selected[0], d), self.history)
                            self.eval()
                            self.selected = None
                            self.movable = []
                            self.highlight.append((x, self.underpromotion[1]))
                            self.underpromotion = ()
                        else:
                            # moving
                            p = np.nonzero(self.board[self.selected[1], self.selected[0], :constants.BOARD_INFO_START])
                            if (p[0] == 4 and self.selected[1] == 1) or (p[0] == 9 and self.selected[1] == 4):
                                # if picked a pawn that is promoting
                                moves = get_movables(self.board, self.selected[0], self.selected[1])

                                dy = -1 if self.c % 2 == 0 else 1
                                if y == self.selected[1] + dy:
                                    for dx in (-1, 0, 1):
                                        if constants.MOVE_TO_INDEX[dx, dy] in moves and x - self.selected[0] == dx:
                                            self.underpromotion = (self.selected[0] + dx, y)
                                            return
                            else:
                                for d in self.movable:
                                    if constants.INDEX_TO_MOVE[d] == (x - self.selected[0], y - self.selected[1]):
                                        # we clicked on a movavble grid
                                        self.add_move((self.selected[1], self.selected[0], d))
                                        self.highlight_button(self.current_c)
                                        logic.move_board(self.board, (self.selected[1], self.selected[0], d),
                                                         self.history)
                                        self.eval()
                                        self.selected = None
                                        self.movable = []
                                        self.highlight.append((x, y))

                                        return
                            self.reset_visual()
                        return

    def keyPressEvent(self, event):
        if event.key() == Qt.Key_Left:
            if self.current_c != 0:
                self.go_to_move(self.current_c - 1)
        if event.key() == Qt.Key_Right:
            if self.current_c != self.c - 1:
                self.go_to_move(self.current_c + 1)
        if event.key() == Qt.Key_I:
            if event.modifiers() == Qt.ControlModifier:
                self.import_game()

    def reset_visual(self):
        self.selected = None
        self.movable = []
        self.highlight = []
        self.underpromotion = ()

    def add_move(self, m):
        self.move_history.append(m)
        notation = logic.move_to_algebraic_notation(self.board, m)
        notation = notation.split()[1]

        label = QLabel(str(self.c))
        label.setAlignment(Qt.AlignCenter)
        label.setStyleSheet("\
            QLabel {\
                background-color : lightgray;\
                border-right-width: 1px;\
                border-style: solid;\
                border-color: gray;\
                text-align: center;\
                font: bold 14px;\
            }\
        ")
        self.info_grid.addWidget(label, self.c // 2, (self.c % 2) * 4, 1, 1)

        b = QPushButton(notation)
        b.setFixedHeight(info_line_height)
        b.setFocusPolicy(Qt.NoFocus)
        temp = self.c
        b.clicked.connect(lambda: self.go_to_move(temp))  # pass in self.c doesn't work

        # stylesheet is set in highlightButton
        self.info_grid.addWidget(b, self.c // 2, (self.c % 2) * 4 + 1, 1, 3)

        self.c += 1
        self.current_c = self.c - 1

    def highlight_button(self, c):
        j = 0
        for w in self.info_gridW.children():
            if isinstance(w, QPushButton):
                if j == c:
                    w.setStyleSheet("\
                        QPushButton { \
                            border-width: 0px;\
                            border-style: solid;\
                            text-align:left;\
                            background-color : #b0cfff;\
                        }\
                        QPushButton::hover {\
                            background-color : #0057db;\
                        }\
                    ")
                else:
                    w.setStyleSheet("\
                        QPushButton { \
                            border-width: 0px;\
                            border-style: solid;\
                            text-align:left;\
                            background-color : white;\
                        }\
                        QPushButton::hover {\
                            background-color : #0057db;\
                        }\
                    ")
                j += 1

    def go_to_move(self, t):
        self.reset_visual()

        self.board = constants.init_state()[..., constants.BOARD_STATE_START:].copy()
        self.history = Counter()
        self.history[logic.hash_board(self.board)] += 1

        for i in range(t + 1):
            logic.move_board(self.board, self.move_history[i], self.history)
        self.highlight_button(t)
        dx, dy = constants.INDEX_TO_MOVE[self.move_history[t][2]]
        self.highlight = [
            (self.move_history[t][1], self.move_history[t][0]),
            (self.move_history[t][1] + dx, self.move_history[t][0] + dy)
        ]
        self.current_c = t

    def eval(self):
        res = logic.evaluate(self.board)
        if res == 0:
            print("DRAW")
        elif res == 1:
            print("BLACK WINS")
        elif res == -1:
            print("WHITE WINS")

    def import_game(self):
        self.reset_visual()
        for i in reversed(range(self.info_grid.count())):
            self.info_grid.itemAt(i).widget().setParent(None)
        self.move_history = []
        self.c = 0
        self.board = constants.init_state()[..., constants.BOARD_STATE_START:].copy()
        self.history = Counter()

        with open(inp_dir) as f:
            for notation in f:
                m = logic.notation_to_move(notation)
                self.add_move(m)
                logic.move_board(self.board, m, self.history)

        dx, dy = constants.INDEX_TO_MOVE[self.move_history[self.current_c][2]]
        self.highlight = [
            (self.move_history[self.current_c][1], self.move_history[self.current_c][0]),
            (self.move_history[self.current_c][1] + dx, self.move_history[self.current_c][0] + dy)
        ]
        self.highlight_button(self.current_c)


def start_window():
    app = QApplication(sys.argv)
    win = Window()
    win.show()
    sys.exit(app.exec_())


start_window()
