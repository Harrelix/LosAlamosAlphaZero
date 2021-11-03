/* global Chess, Chessboard, COLUMNS, NUMBERS, TreeSearch, board_to_game, fen_to_arr, square_to_move, move_to_square $ */

function coor_to_square(x, y) {
  let res = "";
  res = res + COLUMNS[x];
  res = res + (y + 1).toString();
  return res;
}

function is_same_side(a, b) {
  if (a === "1" || b === "1") {
    return false;
  }
  const x = a === a.toUpperCase();
  const y = b === b.toUpperCase();
  return (x && y) || (!x && !y);
}

function is_square_valid(square) {
  const x = COLUMNS.indexOf(square[0]);
  const y = parseInt(square[1], 10) - 1;
  if (x >= 0 && y >= 0 && x < 6 && y < 6) {
    return true;
  }
  return false;
}

function replace_at(board, x, y, replacement) {
  const row = board[y];
  const chars = row.split("");
  chars[x] = replacement;
  board[y] = chars.join("");
  return board;
}

function update_pgn(pgn) {
  let $pv = $("#pgn-viewer");
  const x = pgn.split(" ");

  if (NUMBERS.includes(x[x.length - 2][0])) {
    let c = x[x.length - 2];
    c = c.slice(0, c.length - 1);
    let $e = $("<div class='pgn-move-label'>" + c + "</div>");
    $pv.append($e);
  }

  let $es = $(".pgn-move");
  $es.removeClass("pgn-highlight");
  $es.attr("currentMove", false);

  let $e = $(
    "<button class='pgn-move' id=pgn-button-" +
      x.length +
      ">" +
      x[x.length - 1] +
      "</button>"
  );
  $e.on("click", set_board_and_game(game.state, $e.attr("id")));
  $e.addClass("pgn-highlight");
  $e.attr("currentMove", true);
  $pv.append($e);

  $pv.scrollTop($pv.scrollHeight);
  game.hist.push(game.fen());
}

function set_board_and_game(s, id) {
  function x() {
    game.set_state(s);
    board.position(game.fen());
    $board.find("." + squareClass).removeClass("highlight-white");
    $board.find("." + squareClass).removeClass("highlight-black");
    $(".pgn-move").removeClass("pgn-highlight");
    $("#" + id).addClass("pgn-highlight");
    onCurrentMove = $("#" + id).attr("currentMove") === "true";
  }
  return x;
}

String.prototype.replaceAt = function (index, replacement) {
  if (index >= this.length) {
    return this.valueOf();
  }

  return this.substring(0, index) + replacement + this.substring(index + 1);
};

class Chessgame {
  constructor() {
    this.state = "rnqknr/pppppp/111111/111111/PPPPPP/RNQKNR w KQkq";
    this.board = this.state.replace(/ .+$/, "").split("/").reverse();
    this.pgn = "";
    this.hist = [this.fen()];
  }

  get_moves_from_square(square) {
    let res = [];
    const x = COLUMNS.indexOf(square[0]);
    const y = parseInt(square[1], 10) - 1;
    const pp = this.board[y][x];
    const currently_in_check = this.is_check(this.turn());

    if (pp === "1") {
    } else if (pp.toUpperCase() === "K") {
      for (let dx = -1; dx < 2; dx++) {
        for (let dy = -1; dy < 2; dy++) {
          if (dx === 0 && dy === 0) {
            continue;
          }
          if (6 > x + dx && x + dx >= 0 && 6 > y + dy && y + dy >= 0) {
            let tp = this.board[y + dy][x + dx];
            if (!is_same_side(tp, pp)) {
              res.push(coor_to_square(x + dx, y + dy));
            }
          }
        }
      }

      // check castling availability
      if (!currently_in_check) {
        // black
        if (pp === "k") {
          // kingside
          if (this.state[46] === "k" && this.board[5][4] === "1") {
            // if castle is available and no piece in the way
            res.push(coor_to_square(5, 5));
          }
          // queenside
          if (
            this.state[47] === "q" &&
            this.board[5][1] === "1" &&
            this.board[5][2] === "1"
          ) {
            let f = this.board.slice();
            f = replace_at(f, 3, 5, "1");
            f = replace_at(f, 0, 5, "1");
            f = replace_at(f, 2, 5, "k");
            f.reverse();
            for (let i = 0; i < f.length; i++) {
              f[i] = f[i] + "11";
            }
            f = "8/8/" + f.join("/") + " " + this.turn() + " - - 0 1";
            f = f
              .replace(/11111111/g, "8")
              .replace(/1111111/g, "7")
              .replace(/111111/g, "6")
              .replace(/11111/g, "5")
              .replace(/1111/g, "4")
              .replace(/111/g, "3")
              .replace(/11/g, "2");
            let g = Chess(f);

            if (!g.in_check()) {
              res.push(coor_to_square(1, 5));
            }
          }
        } else {
          // white
          if (this.state[44] === "K" && this.board[0][4] === "1") {
            res.push(coor_to_square(5, 0));
          }
          if (
            this.state[45] === "Q" &&
            this.board[0][1] === "1" &&
            this.board[0][2] === "1"
          ) {
            let f = this.board.slice();
            f = replace_at(f, 3, 0, "1");
            f = replace_at(f, 0, 0, "1");
            f = replace_at(f, 2, 0, "K");
            f.reverse();
            for (let i = 0; i < f.length; i++) {
              f[i] = f[i] + "11";
            }
            f = "8/8/" + f.join("/") + " " + this.turn() + " - - 0 1";
            f = f
              .replace(/11111111/g, "8")
              .replace(/1111111/g, "7")
              .replace(/111111/g, "6")
              .replace(/11111/g, "5")
              .replace(/1111/g, "4")
              .replace(/111/g, "3")
              .replace(/11/g, "2");
            let g = Chess(f);

            if (!g.in_check()) {
              res.push(coor_to_square(1, 0));
            }
          }
        }
      }

      return this.filter_illegal(square, res);
    } else if (pp.toUpperCase() === "P") {
      let ty = -1;
      if (pp === "P") {
        ty = y + 1;
      } else {
        ty = y - 1;
      }
      // Moving foward
      if (this.board[ty][x] === "1") {
        res.push(coor_to_square(x, ty));
      }
      // taking on left side
      if (x !== 0) {
        if (
          this.board[ty][x - 1] !== "1" &&
          !is_same_side(this.board[ty][x - 1], pp)
        ) {
          res.push(coor_to_square(x - 1, ty));
        }
      }

      // taking on right side
      if (x !== 5) {
        if (
          this.board[ty][x + 1] !== "1" &&
          !is_same_side(this.board[ty][x + 1], pp)
        ) {
          res.push(coor_to_square(x + 1, ty));
        }
      }
      return this.filter_illegal(square, res);
    } else {
      const g = Chess(this.legit_fen());
      const moves = g.moves({
        square: square,
        verbose: true
      });

      for (let i = 0; i < moves.length; i++) {
        if (is_square_valid(moves[i].to)) {
          res.push(moves[i].to);
        }
      }
    }

    return res;
  }

  filter_illegal(ps, moves) {
    let filtered_moves = [];

    for (let i = 0; i < moves.length; i++) {
      let new_game = new Chessgame();
      new_game.set_state(this.state);
      new_game.move_game(ps, moves[i]);
      if (new_game.turn() === "w") {
        new_game.state = new_game.state.replaceAt(42, "b");
      } else {
        new_game.state = new_game.state.replaceAt(42, "w");
      }
      if (!new_game.is_check(new_game.turn() !== "w" ? "b" : "w")) {
        filtered_moves.push(moves[i]);
      }
    }
    return filtered_moves;
  }

  game_over() {
    let f = false;
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 6; y++) {
        if (
          (this.board[y][x] === this.board[y][x].toUpperCase() &&
            this.turn() === "w") ||
          (this.board[y][x] !== this.board[y][x].toUpperCase() &&
            this.turn() === "b")
        ) {
          if (this.get_moves_from_square(coor_to_square(x, y)).length !== 0) {
            f = true;
            break;
          }
        }
      }
      if (f) {
        break;
      }
    }
    if (this.hist.filter((x) => x === this.fen()).length === 3) {
      return true;
    }
    return !f;
  }

  check_for_game_over() {
    let f = false;
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 6; y++) {
        if (
          (this.board[y][x] === this.board[y][x].toUpperCase() &&
            this.turn() === "w") ||
          (this.board[y][x] !== this.board[y][x].toUpperCase() &&
            this.turn() === "b")
        ) {
          if (this.get_moves_from_square(coor_to_square(x, y)).length !== 0) {
            f = true;
            break;
          }
        }
      }
      if (f) {
        break;
      }
    }
    if (!f) {
      // no moves
      if (this.is_check(this.turn())) {
        // Checkmate
        return "Checkmate";
      } else {
        // Stalemate
        return "Stalemate";
      }
    }
    if (this.hist.filter((x) => x === this.fen()).length === 3) {
      return "Repetition";
    }
    return false;
  }

  turn() {
    return this.state[42];
  }

  fen() {
    return this.state
      .replace(/6/g, "111111")
      .replace(/5/g, "11111")
      .replace(/4/g, "1111")
      .replace(/3/g, "111")
      .replace(/2/g, "11");
  }

  set_state(state) {
    this.state = state;
    this.board = this.state.replace(/ .+$/, "").split("/").reverse();
  }

  move_game(ps, ts) {
    const px = COLUMNS.indexOf(ps[0]);
    const py = parseInt(ps[1], 10) - 1;
    const pp = this.board[py][px];

    const tx = COLUMNS.indexOf(ts[0]);
    const ty = parseInt(ts[1], 10) - 1;
    const tp = this.board[ty][tx];

    this.board = replace_at(this.board, px, py, "1");

    if (pp === "K") {
      // if picked up white king
      // moved the king -> no more castling
      this.state = this.state.replaceAt(44, "-").replaceAt(45, "-");
      if (tx - px === 2) {
        // kingside
        this.board = replace_at(this.board, 5, 0, "1");
        this.board = replace_at(this.board, 3, 0, "R");
        this.board = replace_at(this.board, 4, 0, "K");
        // clear history if castled
        this.hist = [];
      } else if (tx - px === -2) {
        // Queenside
        this.board = replace_at(this.board, 0, 0, "1");
        this.board = replace_at(this.board, 2, 0, "R");
        this.board = replace_at(this.board, 1, 0, "K");
      } else {
        // move normally
        if (tp !== "1") {
          // clear history if a piece is taken
          this.hist = [];
        }
        this.board = replace_at(this.board, tx, ty, "K");
      }
    } else if (pp === "k") {
      // sane with black king
      this.state = this.state.replaceAt(46, "-").replaceAt(47, "-");
      if (tx - px === 2) {
        this.board = replace_at(this.board, 5, 5, "1");
        this.board = replace_at(this.board, 3, 5, "r");
        this.board = replace_at(this.board, 4, 5, "k");
      } else if (tx - px === -2) {
        this.board = replace_at(this.board, 0, 5, "1");
        this.board = replace_at(this.board, 2, 5, "r");
        this.board = replace_at(this.board, 1, 5, "k");
      } else {
        if (tp !== "1") {
          // clear history if a piece is taken
          this.hist = [];
        }
        this.board = replace_at(this.board, tx, ty, "k");
      }
    } else if (pp === "p" || pp === "P") {
      // clear history after a pawn move
      this.hist = [];
      // move normally
      this.board = replace_at(this.board, tx, ty, pp);
    } else {
      if (tp !== "1") {
        // clear history if a piece is taken
        this.hist = [];
      }
      // move
      this.board = replace_at(this.board, tx, ty, pp);
      // moved the rook -> no more castle
      if (pp === "R") {
        if (px === 0) {
          this.state = this.state.replaceAt(45, "-");
        } else if (px === 5) {
          this.state = this.state.replaceAt(44, "-");
        }
      } else if (pp === "r") {
        if (px === 0) {
          this.state = this.state.replaceAt(47, "-");
        } else if (px === 5) {
          this.state = this.state.replaceAt(46, "-");
        }
      }
    }

    this.state =
      this.board.slice().reverse().join("/") + " " + this.state.slice(42);
    if (this.turn() === "w") {
      this.state = this.state.replaceAt(42, "b");
    } else {
      this.state = this.state.replaceAt(42, "w");
    }
  }

  is_check(side) {
    let f = this.board.slice().reverse();
    for (let i = 0; i < f.length; i++) {
      f[i] = f[i] + "11";
    }
    f = "8/8/" + f.join("/") + " " + side + " - - 0 1";
    f = f
      .replace(/11111111/g, "8")
      .replace(/1111111/g, "7")
      .replace(/111111/g, "6")
      .replace(/11111/g, "5")
      .replace(/1111/g, "4")
      .replace(/111/g, "3")
      .replace(/11/g, "2");
    const g = Chess(f);
    return g.in_check();
  }

  legit_fen() {
    let f = this.board.slice().reverse();
    for (let i = 0; i < f.length; i++) {
      f[i] = f[i] + "11";
    }
    f = "8/8/" + f.join("/") + " " + this.turn() + " - - 0 1";
    f = f
      .replace(/11111111/g, "8")
      .replace(/1111111/g, "7")
      .replace(/111111/g, "6")
      .replace(/11111/g, "5")
      .replace(/1111/g, "4")
      .replace(/111/g, "3")
      .replace(/11/g, "2");
    return f;
  }

  add_pgn(ps, ts) {
    if (this.turn() === "w") {
      this.pgn += " " + this.pgn.split(".").length + ".";
    }
    const px = COLUMNS.indexOf(ps[0]);
    const py = parseInt(ps[1], 10) - 1;
    const pp = this.board[py][px];

    const tx = COLUMNS.indexOf(ts[0]);

    if (pp.toUpperCase() === "K" && tx - px === 2) {
      this.pgn += " O-O";
      let g = new Chessgame();
      g.set_state(this.state);
      g.move_game(ps, ts);
      if (g.is_check(g.turn())) {
        this.pgn += "+";
      }
    } else if (pp.toUpperCase() === "K" && px - tx === 2) {
      this.pgn += " O-O-O";
      let g = new Chessgame();
      g.set_state(this.state);
      g.move_game(ps, ts);
      if (g.is_check(g.turn())) {
        this.pgn += "+";
      }
    } else if (promoting.length === 1) {
      this.pgn += " " + ps[0];
      if (px !== tx) {
        this.pgn += "x" + ts;
      } else {
        this.pgn += ts[1];
      }
      this.pgn += "=" + promoting[0].toUpperCase();
    } else {
      let g = new Chess(this.legit_fen());
      g.move({ from: ps, to: ts, promotion: "q" });
      const m = g.pgn().split(" ");
      this.pgn += " " + m[m.length - 1];
    }
  }
}

function promotion(p, px, py, tx, ty) {
  function promote() {
    $("div#promotion-buttons-container").remove();
    $("#promotion-buttons-container").remove();
    promoting = [p];
    game.state = game.state.replaceAt(42, game.turn() === "w" ? "b" : "w");
    game.add_pgn(coor_to_square(px, py), coor_to_square(tx, ty));
    game.state = game.state.replaceAt(42, game.turn() === "w" ? "b" : "w");
    game.board = replace_at(game.board, tx, ty, p);
    game.state =
      game.board.slice().reverse().join("/") + " " + game.state.slice(42);
    game.hist = [];
    board.position(game.fen());

    if (game.is_check(game.turn())) {
      game.pgn += "+";
    }
    update_pgn(game.pgn);

    // alert user if game over
    const x = game.check_for_game_over();
    if (x !== false) {
      if (x === "Checkmate") {
        game.pgn = game.pgn.replaceAt(game.pgn.length - 1, "#");
        setTimeout(() => {
          alert((game.turn() === "w" ? "BLACK " : "WHITE ") + "WINS!");
        }, 150);
      } else if (x === "Stalemate") {
        setTimeout(() => {
          alert("DRAW (STALEMATE)");
        }, 100);
      } else if (x === "Repetition") {
        setTimeout(() => {
          alert("DRAW (REPETITION)");
        }, 100);
      }
    }
    promoting = [];
  }
  return promote;
}

function removeGreySquares() {
  $("#myBoard .square-55d63").css("background", "");
}

function greySquare(square) {
  let $square = $("#myBoard .square-" + square);

  let background = whiteSquareGrey;
  if ($square.hasClass("black-3c85d")) {
    background = blackSquareGrey;
  }

  $square.css("background", background);
}

function onDragStart(source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over() || !onCurrentMove) return false;
  // or if it's not that side's turn
  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
}

function onDrop(source, target) {
  removeGreySquares();

  // see if the move is legal
  let moves = game.get_moves_from_square(source);

  // illegal move
  if (!moves.includes(target)) {
    return "snapback";
  } else {
    const px = COLUMNS.indexOf(source[0]);
    const py = parseInt(source[1], 10) - 1;
    const pp = game.board[py][px];
    const tx = COLUMNS.indexOf(target[0]);
    const ty = parseInt(target[1], 10) - 1;

    if ((pp === "P" && py === 4) || (pp === "p" && py === 1)) {
      // promoting
      promoting = [game.state];
      game.move_game(source, target);

      const size = $board.find(".square-" + target)[0].getBoundingClientRect();
      let $container = $(
        "<div class='promotion-buttons' id='promotion-buttons-container'></div>"
      );
      $container.css({
        position: "absolute",
        height: size.height * 3 + "px",
        width: size.width + "px",
        left: size.left + "px"
      });

      let $qp = $("<button>");
      let $rp = $("<button>");
      let $np = $("<button>");
      $qp.addClass("promotion");
      $rp.addClass("promotion");
      $np.addClass("promotion");

      $qp.css({ height: size.height + "px", width: size.width + "px" });
      $rp.css({ height: size.height + "px", width: size.width + "px" });
      $np.css({ height: size.height + "px", width: size.width + "px" });

      if (pp === "P") {
        $qp.addClass("white-queen-promotion");
        $rp.addClass("white-rook-promotion");
        $np.addClass("white-knight-promotion");
        $qp.on("click", promotion("Q", px, py, tx, ty));
        $rp.on("click", promotion("R", px, py, tx, ty));
        $np.on("click", promotion("N", px, py, tx, ty));
        if (board.orientation() === "white") {
          $container.css("top", size.top + "px");
          $container.append($qp);
          $container.append($rp);
          $container.append($np);
        } else {
          $container.css("top", size.top - size.height * 2 + "px");
          $container.append($np);
          $container.append($rp);
          $container.append($qp);
        }
      } else {
        $qp.addClass("black-queen-promotion");
        $rp.addClass("black-rook-promotion");
        $np.addClass("black-knight-promotion");
        $qp.on("click", promotion("q", px, py, tx, ty));
        $rp.on("click", promotion("r", px, py, tx, ty));
        $np.on("click", promotion("n", px, py, tx, ty));
        if (board.orientation() === "white") {
          $container.css("top", size.top - size.height * 2 + "px");
          $container.append($np);
          $container.append($rp);
          $container.append($qp);
        } else {
          $container.css("top", size.top + "px");
          $container.append($qp);
          $container.append($rp);
          $container.append($np);
        }
      }

      $(document.body).append($container);
    } else {
      // highlight
      $board.find("." + squareClass).removeClass("highlight-white");
      $board.find("." + squareClass).removeClass("highlight-black");
      let $ssquare = $board.find(".square-" + source);
      if ($ssquare.hasClass("black-3c85d")) {
        $ssquare.addClass("highlight-black");
      } else {
        $ssquare.addClass("highlight-white");
      }
      let $tsquare = $board.find(".square-" + target);
      if ($tsquare.hasClass("black-3c85d")) {
        $tsquare.addClass("highlight-black");
      } else {
        $tsquare.addClass("highlight-white");
      }
      // add pgn
      game.add_pgn(source, target);

      game.move_game(source, target);
      update_pgn(game.pgn);

      treeSearch.add_move(square_to_move(target, px, 5 - py));
    }
  }
}

function undo_promotion() {
  $("div#promotion-buttons-container").remove();
  $("#promotion-buttons-container").remove();
  game.set_state(promoting[0]);
  board.position(game.fen());
  promoting = [];
}

function onMouseoverSquare(square, piece) {
  if (game.game_over() || !onCurrentMove) return false;
  if (!piece) return false;
  if (
    (game.turn() === "w" && piece.search(/^b/) !== -1) ||
    (game.turn() === "b" && piece.search(/^w/) !== -1)
  ) {
    return false;
  }
  // get list of possible moves for this square
  const moves = game.get_moves_from_square(square);

  // exit if there are no moves available for this square
  if (moves.length === 0) return;

  // highlight the square they moused over
  greySquare(square);

  // highlight the possible squares for this piece
  for (let i = 0; i < moves.length; i++) {
    greySquare(moves[i]);
  }
}

function onMouseoutSquare(square, piece) {
  removeGreySquares();
}

function onSnapEnd() {
  board.position(game.fen());
  // alert user if game over
  const x = game.check_for_game_over();
  if (x !== false) {
    if (x === "Checkmate") {
      game.pgn = game.pgn.replaceAt(game.pgn.length - 1, "#");
      setTimeout(() => {
        alert((game.turn() === "w" ? "BLACK " : "WHITE ") + "WINS!");
      }, 150);
    } else if (x === "Stalemate") {
      setTimeout(() => {
        alert("DRAW (STALEMATE)");
      }, 100);
    } else if (x === "Repetition") {
      setTimeout(() => {
        alert("DRAW (REPETITION)");
      }, 100);
    }
  } else {
    setTimeout(() => {
      ai_move();
    }, 100);
  }
}

function ai_move() {
  const move = treeSearch.get_pi();
  const [ps, ts] = move_to_square(move);

  // highlight
  $board.find("." + squareClass).removeClass("highlight-white");
  $board.find("." + squareClass).removeClass("highlight-black");
  let $ssquare = $board.find(".square-" + ps);
  if ($ssquare.hasClass("black-3c85d")) {
    $ssquare.addClass("highlight-black");
  } else {
    $ssquare.addClass("highlight-white");
  }
  let $tsquare = $board.find(".square-" + ts);
  if ($tsquare.hasClass("black-3c85d")) {
    $tsquare.addClass("highlight-black");
  } else {
    $tsquare.addClass("highlight-white");
  }
  // add pgn
  game.add_pgn(ps, ts);
  game.move_game(ps, ts);
  update_pgn(game.pgn);
  setTimeout(() => {
    board.position(game.fen());
  }, 100);
}

document.body.onclick = function (evt) {
  if (detectLeftButton(evt)) {
    if (promoting.length === 2) {
      const target = "target" in evt ? evt.target : evt.srcElement;
      if (!target.classList.contains("promotion")) {
        undo_promotion();
      }
    } else if (promoting.length === 1) {
      promoting.push(true);
    }
  }
};

function detectLeftButton(e) {
  let isLeft;
  e = e || window.event;

  if ("which" in e) isLeft = e.which === 1;
  else if ("button" in e)
    // IE, Opera
    isLeft = e.button === 1;

  return isLeft;
}

const config = {
  draggable: true,
  position: "6/6/6/6/6/6 w KQkq",
  onDragStart: onDragStart,
  onDrop: onDrop,
  onMouseoutSquare: onMouseoutSquare,
  onMouseoverSquare: onMouseoverSquare,
  onSnapEnd: onSnapEnd,
  orientation: "white"
};

function init(color) {
  if (color === "random") {
    if (Math.random() < 0.5) {
      color = "white";
    } else {
      color = "black";
    }
  }
  board.position("rnqknr/pppppp/6/6/PPPPPP/RNQKNR w KQkq");
  board.orientation(color);
  treeSearch = new TreeSearch(board_to_game(fen_to_arr(game.fen(), 0, [])), 32);

  let $pv = $("#pgn-viewer");
  $pv.html("");
  $pv.css("text-align", "left");

  if (color === "black") {
    setTimeout(() => {
      ai_move();
    }, 1000);
  }
}

let board = null;

let promoting = [];
let game = new Chessgame();
board = Chessboard("myBoard", config);
$(window).resize(board.resize);
let treeSearch;

const whiteSquareGrey = "#a9a9a9";
const blackSquareGrey = "#696969";
let $board = $("#myBoard");
const squareClass = "square-55d63";
let onCurrentMove = true;
