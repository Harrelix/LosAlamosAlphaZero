/* global tf, MODEL, coor_to_square, Chessgame, CHAR_TO_IND, INDEX_TO_NOTATION, COLUMNS, MOVE_TO_INDEX, INDEX_TO_MOVE, replace_at, game, board, treeSearch, $board, squareClass, update_pgn */

function zeros3d(x, y, z) {
  return Array.from(new Array(x), (_) =>
    Array.from(new Array(y), (__) => Array(z).fill(0))
  );
}

function copy3d(arr) {
  return arr.map((_) => _.map((__) => __.slice()));
}

function argMax(array) {
  return [].reduce.call(array, (m, c, i, arr) => (c > arr[m] ? i : m), 0);
}

function nonzero(arr, x, y) {
  for (let z = 0; z < arr[y][x].length; z++) {
    if (arr[y][x][z] === 1) {
      return z;
    }
  }
  return -1;
}

function fillplane(arr, ind, val) {
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      arr[i][j][ind] = val;
    }
  }
}

function weighted_random(items, weights) {
  // console.log(items);
  // console.log(weights);
  var i;
  for (i = 0; i < weights.length; i++) {
    weights[i] += weights[i - 1] || 0;
  }
  let random = Math.random() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++) {
    if (weights[i] > random) {
      break;
    }
  }
  return items[i];
}

function fen_to_arr(fen, c, hist) {
  let board = zeros3d(6, 6, 18);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      let p = fen[j + i * 7];
      board[i][j][CHAR_TO_IND[p]] = 1;
    }
  }

  // repetition
  if (hist.filter((x) => x === fen).length >= 2) {
    fillplane(board, 10, 1);
    if (hist.filter((x) => x === fen).length === 3) {
      fillplane(board, 11, 1);
    }
  }

  // total move count
  fillplane(board, 13, c / 127);

  // player to move
  if (fen[42] === "b") {
    fillplane(board, 12, 1);
  }

  //castling rights
  if (fen[44] === "K") {
    fillplane(board, 15, 1);
  }
  if (fen[45] === "Q") {
    fillplane(board, 14, 1);
  }
  if (fen[46] === "k") {
    fillplane(board, 17, 1);
  }
  if (fen[47] === "q") {
    fillplane(board, 16, 1);
  }
  return board;
}

function arr_to_fen(arr) {
  let r = "";
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      let i = nonzero(arr, x, y);
      if (i >= 10 || i === -1) {
        r += "1";
      } else {
        r += INDEX_TO_NOTATION[i];
      }
    }
    r += "/";
  }
  r = r.slice(0, -1) + " ";
  r += arr[0][0][12] === 1 ? "b " : "w ";

  r += arr[0][0][15] === 1 ? "K" : "-";
  r += arr[0][0][14] === 1 ? "Q" : "-";
  r += arr[0][0][17] === 1 ? "k" : "-";
  r += arr[0][0][16] === 1 ? "q" : "-";

  return r;
}

function game_to_board(game_state) {
  return game_state.map((y) => y.map((x) => x.slice(33)));
}

function board_to_game(board_state) {
  return board_state.map((y) => y.map((x) => new Array(33).fill(0).concat(x)));
}

function update_game(game_state, board_state) {
  const _gs = copy3d(game_state);

  for (let i = 0; i < 33; i++) {
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 6; y++) {
        game_state[y][x][i] = _gs[y][x][i + 11];
      }
    }
  }
  for (let i = 0; i < 18; i++) {
    for (let x = 0; x < 6; x++) {
      for (let y = 0; y < 6; y++) {
        game_state[y][x][i + 33] = board_state[y][x][i];
      }
    }
  }
}

function get_legal_move(board_state, side) {
  let _g = new Chessgame();
  _g.set_state(arr_to_fen(board_state));
  let r = [];
  for (let y = 0; y < 6; y++) {
    for (let x = 0; x < 6; x++) {
      let i = nonzero(board_state, x, y);
      if (i < 10 && i !== -1) {
        if ((i < 5 && side === 0) || (i >= 5 && side === 1)) {
          const moves = _g.get_moves_from_square(coor_to_square(x, 5 - y));
          if (i === 4 && y === 1) {
            for (let m = 0; m < moves.length; m++) {
              let move = square_to_move(moves[m], x, y);
              r.push(move);
              if (move[2] === 2) {
                r.push([y, x, 49]);
                r.push([y, x, 52]);
              }
              if (move[2] === 1) {
                r.push([y, x, 50]);
                r.push([y, x, 53]);
              }
              if (move[2] === 3) {
                r.push([y, x, 48]);
                r.push([y, x, 51]);
              }
            }
          } else if (i === 9 && y === 4) {
            for (let m = 0; m < moves.length; m++) {
              const move = square_to_move(moves[m], x, y);
              r.push(move);
              if (move[2] === 6) {
                r.push([y, x, 49]);
                r.push([y, x, 52]);
              }
              if (move[2] === 7) {
                r.push([y, x, 50]);
                r.push([y, x, 53]);
              }
              if (move[2] === 5) {
                r.push([y, x, 48]);
                r.push([y, x, 51]);
              }
            }
          } else {
            for (let m = 0; m < moves.length; m++) {
              r.push(square_to_move(moves[m], x, y));
            }
          }
        }
      }
    }
  }
  return r;
}

function move_game(game_state, move, hist) {
  const [y, x, d] = move;
  const [dx, dy] = INDEX_TO_MOVE[d];

  let fen = arr_to_fen(game_to_board(game_state));
  let g = new Chessgame();
  g.set_state(fen);

  let p = g.board[5 - y][x];
  if (p === "p" && y === 4) {
    hist.length = 0;
    g.board = replace_at(g.board, x, y, "1");
    if (d < 48) {
      g.board = replace_at(g.board, x + dx, 5, "q");
    } else if (d < 51) {
      g.board = replace_at(g.board, x + dx, 5, "r");
    } else {
      g.board = replace_at(g.board, x + dx, 5, "n");
    }
    if (g.turn() === "w") {
      g.state = g.state.replaceAt(42, "b");
    } else {
      g.state = g.state.replaceAt(42, "w");
    }
  } else if (p === "P" && y === 1) {
    hist.length = 0;
    g.board = replace_at(g.board, x, y, "1");
    if (d < 48) {
      g.board = replace_at(g.board, x + dx, 0, "Q");
    } else if (d < 51) {
      g.board = replace_at(g.board, x + dx, 0, "R");
    } else {
      g.board = replace_at(g.board, x + dx, 0, "N");
    }
    g.state = g.board.slice().reverse().join("/") + " " + g.state.slice(42);
    if (g.turn() === "w") {
      g.state = g.state.replaceAt(42, "b");
    } else {
      g.state = g.state.replaceAt(42, "w");
    }
  } else {
    g.move_game(coor_to_square(x, 5 - y), coor_to_square(x + dx, 5 - y - dy));
  }
  hist.push(g.fen());
  update_game(
    game_state,
    fen_to_arr(g.fen(), game_state[0][0][46] * 127 + 1, hist)
  );
}

function square_to_move(square, px, py) {
  const tx = COLUMNS.indexOf(square[0]);
  const ty = 6 - parseInt(square[1], 10);
  const dx = tx - px;
  const dy = ty - py;
  // if (typeof MOVE_TO_INDEX[dx][dy] === "undefined") {
  //   console.log(
  //     `dx: ${dx} || dy: ${dy} || sq: ${square} || px: ${px} || py: ${py}`
  //   );
  // }
  return [py, px, MOVE_TO_INDEX[dx][dy]];
}

function move_to_square(move) {
  const [y, x, d] = move;
  if (d < 51) {
    let [dx, dy] = INDEX_TO_MOVE[d];
    const ps = coor_to_square(x, 5 - y);
    const ts = coor_to_square(x + dx, 5 - y - dy);
    return [ps, ts];
  }
}

function test() {
  const move = treeSearch.get_pi();
  console.log(move);
  const [ps, ts] = move_to_square(move);
  console.log([ps, ts]);

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

  board.position(game.fen());
}

function evaluate(board_state) {
  let g = new Chessgame();
  g.set_state(arr_to_fen(board_state));
  let res = g.check_for_game_over();
  if (res === "Checkmate") {
    return g.turn() === "w" ? 1 : -1;
  } else if (res === "Stalemate" || res === "Repetition") {
    return 0;
  }
  return 2;
}

function format_state(game_state) {
  let _gs = copy3d(game_state);
  if (game_state[0][0][45] === 1) {
    _gs.reverse();
  }
  return _gs;
}

function format_policy(game_state, p) {
  let _p = copy3d(p);
  if (game_state[0][0][45] === 1) {
    _p.reverse();
  }
  return _p;
}

function get_output(game_state) {
  const inp = tf.tensor4d([format_state(game_state)]);
  let pred = MODEL.predict(inp);
  let value = pred[1].dataSync()[0];
  let policy = pred[0].arraySync()[0];
  policy = format_policy(game_state, policy);
  return [value, policy];
}

///////////////// MCTS /////////////////
function backup(value, path) {
  for (let n = 0; n < path.length; n++) {
    path[n].w += value;
    path[n].n += 1;
    path[n].q = path[n].w / path[n].n;
  }
}

class TreeSearch {
  constructor(game_state, num_search) {
    this.last_node = {
      game_state: copy3d(game_state),
      history: [],
      n: 0,
      w: 0,
      q: 0,
      p: 0,
      m: null,
      children: []
    };
    this.num_search = num_search;
    this.c_puct = 1.0;
    this.exploration = 1.0;
  }

  get_pi(net) {
    for (let k = 0; k < this.num_search; k++) {
      let path = [];
      let parent = this.last_node;

      while (parent.children.length !== 0) {
        const n = parent.children.reduce((ps, c) => ps + c.n, 0);
        let puct = [];
        for (let c = 0; c < parent.children.length; c++) {
          puct.push(
            parent.children[c].q +
              this.c_puct *
                parent.children[c].p *
                (Math.sqrt(n) / (1 + parent.children[c].n))
          );
        }
        parent = parent.children[argMax(puct)];
        path.push(parent);
      }
      const res = evaluate(game_to_board(parent.game_state));
      if (res === 0) {
        backup(0, path);
      } else if (res !== 2) {
        backup(this.last_node.game_state[0][0][45] === 1 ? res : -res, path);
      } else {
        const pool = get_legal_move(
          game_to_board(parent.game_state),
          parent.game_state[0][0][45]
        );
        let [value, policy] = get_output(parent.game_state);
        for (let m = 0; m < pool.length; m++) {
          const [y, x, d] = pool[m];
          policy[y][x][d] = -100;
        }
        policy = tf.softmax(policy).arraySync();

        for (let m = 0; m < pool.length; m++) {
          let _gs = copy3d(parent.game_state);
          let _h = parent.history.slice();
          move_game(_gs, pool[m], _h);
          parent.children.push({
            game_state: _gs,
            history: _h,
            n: 0,
            w: 0,
            q: 0,
            p: policy[pool[m][0]][pool[m][1]][pool[m][2]],
            m: pool[m],
            children: []
          });
        }
        backup(value, path);
      }
    }
    let n = [];
    for (let i = 0; i < this.last_node.children.length; i++) {
      n.push(this.last_node.children[i].n);
    }
    console.log(n);
    const sum_n = n.reduce((a, b) => a + b, 0);
    let p = n.map((x) => x / sum_n);
    const best_move = weighted_random(this.last_node.children, p);
    this.last_node = best_move;
    return best_move.m;
  }

  add_move(move) {
    for (let child of this.last_node.children) {
      if (child.m === move) {
        this.last_node = child;
        return;
      }
    }
    let _gs = copy3d(this.last_node.game_state);
    let _h = this.last_node.history.slice();
    move_game(_gs, move, _h);
    let new_node = {
      game_state: _gs,
      history: _h,
      n: 0,
      w: 0,
      q: 0,
      p: 0,
      m: move,
      children: []
    };
    this.last_node = new_node;
  }
}
