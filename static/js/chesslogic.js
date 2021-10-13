const COLUMNS = 'abcdef'.split('')
const NUMBERS = '0123456789'.split('')


function coor_to_square(x, y) {
    res = ""
    res = res + COLUMNS[x]
    res = res + (y + 1).toString()
    return res
}

function is_same_side(a, b) {
    if (a == 1 || b == 1) {
        return false
    }
    var x = a == a.toUpperCase()
    var y = b == b.toUpperCase()
    return (x && y) || (!x && !y)
}

function is_square_valid(square) {
    var x = COLUMNS.indexOf(square[0])
    var y = parseInt(square[1], 10) - 1
    if (x >= 0 && y >= 0 && x < 6 && y < 6) {
        return true
    }
    return false
}

function replace_at(board, x, y, replacement) {
    var row = board[y]
    var chars = row.split('')
    chars[x] = replacement
    board[y] = chars.join('')
    return board
}

function update_pgn(pgn) {
    var pv = document.getElementById("pgn-viewer")
    var x = pgn.split(" ")
    if (NUMBERS.includes(x[x.length - 2][0])) {
        var c = x[x.length - 2]
        c = c.slice(0, c.length - 1)
        var e = document.createElement("div")
        e.innerHTML = c
        e.classList.add("pgn-move-label")
        pv.appendChild(e)
    }
    
    var e = document.createElement("button")
    e.id = "pgn-button-" + x.length
    e.innerHTML = x[x.length - 1]
    e.classList.add("pgn-move")
    e.classList.add("pgn-highlight")
    e.addEventListener("click", set_board_and_game(game.state, e.id))
    var es = document.getElementsByClassName("pgn-move")
    for (i = 0; i < es.length; i++) {
        es[i].classList.remove("pgn-highlight")
        es[i].currentMove = false
    }
    e.currentMove = true
    pv.appendChild(e)
    pv.scrollTop = pv.scrollHeight
    console.log(game.fen())
}

function set_board_and_game(s, id) {
    function x() {
        game.set_state(s)
        board.position(game.fen())
        $board.find('.' + squareClass).removeClass('highlight-white')
        $board.find('.' + squareClass).removeClass('highlight-black')
        var es = document.getElementsByClassName("pgn-move")
        for (i = 0; i < es.length; i++) {
            es[i].classList.remove("pgn-highlight")
        }
        document.getElementById(id).classList.add("pgn-highlight")
        onCurrentMove = document.getElementById(id).currentMove
    }
    return x
}

String.prototype.replaceAt = function(index, replacement) {
    if (index >= this.length) {
        return this.valueOf();
    }
 
    return this.substring(0, index) + replacement + this.substring(index + 1);
}

class Chessgame {
    constructor() {
        this.state = 'rnqknr/pppppp/111111/111111/PPPPPP/RNQKNR w KQkq'
        this.board = this.state.replace(/ .+$/, '').split("/").reverse()
        this.pgn = ""
    }
    
    get_moves_from_square(square) {
        var res = []
        var x = COLUMNS.indexOf(square[0])
        var y = parseInt(square[1], 10) - 1
        var pp = this.board[y][x]
        var currently_in_check = this.is_check(this.turn())
        
        if (pp == 1) {
            
        } else if (pp.toUpperCase() == "K") {
            for (var dx = -1; dx < 2; dx++) {
                for (var dy = -1; dy < 2; dy++) {
                    if (dx == 0 && dy == 0) { continue }
                    if (6 > x + dx && x + dx >= 0 && 6 > y + dy && y + dy >= 0) {
                        var tp = this.board[y + dy][x + dx]
                        if (!is_same_side(tp, pp)) {
                            res.push(coor_to_square(x + dx, y + dy))
                        }
                    }
                    
                }
            }
            
            // check castling availability
            if (!currently_in_check) {
                // black
                if (pp == "k") {
                    // kingside
                    if (this.state[46] == "k" && this.board[5][4] == 1) {
                        // if castle is available and no piece in the way
                        res.push(coor_to_square(5, 5))
                    }
                    // queenside
                    if (this.state[47] == "q" && this.board[5][1] == 1 && this.board[5][2] == 1) {
                        var f = this.board.slice()
                        f = replace_at(f, 3, 5, "1")
                        f = replace_at(f, 0, 5, "1")
                        f = replace_at(f, 2, 5, "k")
                        f.reverse()
                        for (var i = 0; i < f.length; i++) {
                            f[i] = f[i] + "11"
                        }
                        f = "8/8/" + f.join("/") + " " + this.turn() + " - - 0 1"
                        f = f.replace(/11111111/g, '8')
                              .replace(/1111111/g, '7')
                              .replace(/111111/g, '6')
                              .replace(/11111/g, '5')
                              .replace(/1111/g, '4')
                              .replace(/111/g, '3')
                              .replace(/11/g, '2')
                        var g = Chess(f)

                        if (!g.in_check()) {
                            res.push(coor_to_square(1, 5))
                        }

                    }
                } else { // white
                    if (this.state[44] == "K" && this.board[0][4] == 1) {
                        res.push(coor_to_square(5, 0))
                    }
                    if (this.state[45] == "Q" && this.board[0][1] == 1 && this.board[0][2] == 1) {
                        var f = this.board.slice()
                        f = replace_at(f, 3, 0, "1")
                        f = replace_at(f, 0, 0, "1")
                        f = replace_at(f, 2, 0, "K")
                        f.reverse()
                        for (var i = 0; i < f.length; i++) {
                            f[i] = f[i] + "11"
                        }
                        f = "8/8/" + f.join("/") + " " + this.turn() + " - - 0 1"
                        f = f.replace(/11111111/g, '8')
                              .replace(/1111111/g, '7')
                              .replace(/111111/g, '6')
                              .replace(/11111/g, '5')
                              .replace(/1111/g, '4')
                              .replace(/111/g, '3')
                              .replace(/11/g, '2')
                        var g = Chess(f)

                        if (!g.in_check()) {
                            res.push(coor_to_square(1, 0))
                        }
                    }
                }
            }
            
            return this.filter_illegal(square, res)
        } else if (pp.toUpperCase() == "P") {
            if (pp == "P") {
                var ty = y + 1
            } else {
                var ty = y - 1
            }
            // Moving foward
            if (this.board[ty][x] == 1) { 
                res.push(coor_to_square(x, ty))
            }
            // taking on left side
            if (x != 0) {
                if (this.board[ty][x - 1] != "1" && !is_same_side(this.board[ty][x - 1], pp)) {
                    res.push(coor_to_square(x - 1, ty))
                }
            }
            
            // taking on right side
            if (x != 5) {
                if (this.board[ty][x + 1] != "1" && !is_same_side(this.board[ty][x + 1], pp)) {
                    res.push(coor_to_square(x + 1, ty))
                }
            }
            return this.filter_illegal(square, res)
        } else {
            var g = Chess(this.legit_fen())
            var moves = g.moves({
                square: square,
                verbose: true
            })
            
            for (var i = 0; i < moves.length; i++) {
                if (is_square_valid(moves[i].to)) {
                    res.push(moves[i].to)
                }
            }
        }
        
        return res
    }
    
    filter_illegal(ps, moves) {
        var filtered_moves = []
        var currently_in_check = this.is_check(this.turn())
        var x = COLUMNS.indexOf(ps[0])
        var y = parseInt(ps[1], 10) - 1
        var pp = this.board[y][x]
        
        for (var i = 0; i < moves.length; i++) {
            var new_game = new Chessgame()
            new_game.set_state(this.state)
            new_game.move_game(ps, moves[i])
            if (new_game.turn() == "w") {
                new_game.state = new_game.state.replaceAt(42, "b")
            } else {
                new_game.state = new_game.state.replaceAt(42, "w")
            }
            if (!new_game.is_check(new_game.turn() != "w" ? "b" : "w")) {
                filtered_moves.push(moves[i])
            }
        }
        return filtered_moves
    }
    
    game_over() {
        var f = false
        for (var x = 0; x < 6; x++) {
            for (var y = 0; y < 6; y++) {
                if ((this.board[y][x] == this.board[y][x].toUpperCase() && this.turn() == "w") || (this.board[y][x] != this.board[y][x].toUpperCase() && this.turn() == "b")) {
                    if (this.get_moves_from_square(coor_to_square(x, y)).length != 0) {
                        f = true
                        break
                    }
                }
            }
            if (f) { break }
        }
        return !f
    }
    
    check_for_game_over() {
        var f = false
        for (var x = 0; x < 6; x++) {
            for (var y = 0; y < 6; y++) {
                if ((this.board[y][x] == this.board[y][x].toUpperCase() && this.turn() == "w") || (this.board[y][x] != this.board[y][x].toUpperCase() && this.turn() == "b")) {
                    if (this.get_moves_from_square(coor_to_square(x, y)).length != 0) {
                        f = true
                        break
                    }
                }
            }
            if (f) { break }
        }
        if (!f) {
            // no moves
            if (this.is_check(this.turn())) {
                // Checkmate
                return "Checkmate"
            } else {
                // Stalemate
                return "Stalemate"
            }
        }
        return false
    }
    
    turn() {
        return this.state[42]
    }
    
    fen() {
        return this.state.replace(/6/g, '111111')
          .replace(/5/g, '11111')
          .replace(/4/g, '1111')
          .replace(/3/g, '111')
          .replace(/2/g, '11')
    }
    
    set_state(state) {
        this.state = state
        this.board = this.state.replace(/ .+$/, '').split("/").reverse()
    }
    
    move_game(ps, ts) {
        var px = COLUMNS.indexOf(ps[0])
        var py = parseInt(ps[1], 10) - 1
        var pp = this.board[py][px]
        
        var tx = COLUMNS.indexOf(ts[0])
        var ty = parseInt(ts[1], 10) - 1
        var tp = this.board[ty][tx]
        
        this.board = replace_at(this.board, px, py, "1")
        
        
        if (pp == "K") {  // if picked up white kingh
            // moved the king -> no more castling
            this.state = this.state.replaceAt(44, "-").replaceAt(45, "-")
            if (tx - px == 2) {
                // kingside
                this.board = replace_at(this.board, 5, 0, "1")
                this.board = replace_at(this.board, 3, 0, "R")
                this.board = replace_at(this.board, 4, 0, "K")
                // clear history if castled
            } else if (tx - px == -2) {
                // Queenside
                this.board = replace_at(this.board, 0, 0, "1")
                this.board = replace_at(this.board, 2, 0, "R")
                this.board = replace_at(this.board, 1, 0, "K")
            } else {
                // move normally
                if (tp != "1") {
                    // clear history if a piece is taken
                }
                this.board = replace_at(this.board, tx, ty, "K")
            }
        } else if (pp == "k") {  // sane with black king
            this.state = this.state.replaceAt(46, "-").replaceAt(47, "-")
            if (tx - px == 2) {
                this.board = replace_at(this.board, 5, 5, "1")
                this.board = replace_at(this.board, 3, 5, "r")
                this.board = replace_at(this.board, 4, 5, "k")
            } else if (tx - px == -2) {
                this.board = replace_at(this.board, 0, 5, "1")
                this.board = replace_at(this.board, 2, 5, "r")
                this.board = replace_at(this.board, 1, 5, "k")
            } else {
                if (tp != "1") {
                    // clear history if a piece is taken
                }
                this.board = replace_at(this.board, tx, ty, "k")
            }
        } else if (pp == "p" || pp == "P") {
            // clear history after a pawn move
            // move normally
            this.board = replace_at(this.board, tx, ty, pp)
        } else {
            if (tp != "1") {
                // clear history if a piece is taken
            }
            // move
            this.board = replace_at(this.board, tx, ty, pp)
            // moved the rook -> no more castle
            if (pp == "R") {
                if (px == 0) {
                    this.state = this.state.replaceAt(45, "-")
                } else if (px == 5) {
                    this.state = this.state.replaceAt(44, "-")
                }
            } else if (pp == "r") {
                if (px == 0) {
                    this.state = this.state.replaceAt(47, "-")
                } else if (px == 5) {
                    this.state = this.state.replaceAt(46, "-")
                }
            }
        }
        
        this.state = this.board.slice().reverse().join("/") + " " + this.state.slice(42)
        if (this.turn() == "w") {
            this.state = this.state.replaceAt(42, "b")
        } else {
            this.state = this.state.replaceAt(42, "w")
        }
    }
    
    is_check(side) {
        var f = this.board.slice().reverse()
        for (var i = 0; i < f.length; i++) {
            f[i] = f[i] + "11"
        }
        f = "8/8/" + f.join("/") + " " + side + " - - 0 1"
        f = f.replace(/11111111/g, '8')
              .replace(/1111111/g, '7')
              .replace(/111111/g, '6')
              .replace(/11111/g, '5')
              .replace(/1111/g, '4')
              .replace(/111/g, '3')
              .replace(/11/g, '2')
        var g = Chess(f)
        return g.in_check()
    }
    
    
    
    
    legit_fen() {
        var f = this.board.slice().reverse()
        for (var i = 0; i < f.length; i++) {
            f[i] = f[i] + "11"
        }
        f = "8/8/" + f.join("/") + " " + this.turn() + " - - 0 1"
        f = f.replace(/11111111/g, '8')
              .replace(/1111111/g, '7')
              .replace(/111111/g, '6')
              .replace(/11111/g, '5')
              .replace(/1111/g, '4')
              .replace(/111/g, '3')
              .replace(/11/g, '2')
        return f
    }
    
    add_pgn(ps, ts) {
        if (this.turn() == "w") {
            this.pgn += " " + this.pgn.split(".").length + "."
        }
        var px = COLUMNS.indexOf(ps[0])
        var py = parseInt(ps[1], 10) - 1
        var pp = this.board[py][px]
        
        var tx = COLUMNS.indexOf(ts[0])
        var ty = parseInt(ts[1], 10) - 1
        var tp = this.board[ty][tx]
        
        if (pp.toUpperCase() == "K" && tx - px == 2) {
            this.pgn += " O-O"
            var g = new Chessgame()
            g.set_state(this.state)
            g.move_game(ps, ts)
            if (g.is_check(g.turn())) {
                this.pgn += "+"
            }
        } else if (pp.toUpperCase() == "K" && px - tx == 2) {
            this.pgn += " O-O-O"
            var g = new Chessgame()
            g.set_state(this.state)
            g.move_game(ps, ts)
            if (g.is_check(g.turn())) {
                this.pgn += "+"
            }
        } else if (promoting.length == 1) {
            this.pgn += " " + ps[0]
            if (px != tx) {
                this.pgn += "x" + ts
            } else {
                this.pgn += ts[1]
            }
            this.pgn += "=" + promoting[0].toUpperCase()
        } else {
            var g = new Chess(this.legit_fen())
            g.move({from: ps, to: ts, promotion: 'q'})
            var m = g.pgn().split(" ")
            this.pgn += " " + m[m.length - 1]
        }
    }
}

function promotion(p, px, py, tx, ty) {
    function promote() {
        $('div#promotion-buttons-container').remove()
        $("#promotion-buttons-container").remove()
        promoting = [p]
        game.state = game.state.replaceAt(42, game.turn() == "w" ? "b" : "w")
        game.add_pgn(coor_to_square(px, py), coor_to_square(tx, ty))
        game.state = game.state.replaceAt(42, game.turn() == "w" ? "b" : "w")
        game.board = replace_at(game.board, tx, ty, p)
        game.state = game.board.slice().reverse().join("/") + " " + game.state.slice(42)
        board.position(game.fen())

        if (game.is_check(game.turn())) {
            game.pgn += "+"
        }
        update_pgn(game.pgn)
        
        // alert user if game over
        var x = game.check_for_game_over()
        if (x != false) {
            if (x == "Checkmate") {
                game.pgn = game.pgn.replaceAt(game.pgn.length - 1, "#")
                setTimeout(() => { alert((game.turn() == "w" ? "BLACK " : "WHITE ") + "WINS!") }, 150)
                
            } else {
                setTimeout(() => { alert("DRAW (STALEMATE)") }, 100)
            }
        }
        promoting = []
    }
    return promote
}

function removeGreySquares () {
  $('#myBoard .square-55d63').css('background', '')
}

function greySquare (square) {
  var $square = $('#myBoard .square-' + square)

  var background = whiteSquareGrey
  if ($square.hasClass('black-3c85d')) {
    background = blackSquareGrey
  }

  $square.css('background', background)
}

function onDragStart (source, piece) {
  // do not pick up pieces if the game is over
  if (game.game_over() || !onCurrentMove) return false
  // or if it's not that side's turn
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
    removeGreySquares()

    // see if the move is legal
    var moves = game.get_moves_from_square(source)

    // illegal move
    if (!moves.includes(target)) {
        return 'snapback'
    } else {
        var px = COLUMNS.indexOf(source[0])
        var py = parseInt(source[1], 10) - 1
        var pp = game.board[py][px]
        var tx = COLUMNS.indexOf(target[0])
        var ty = parseInt(target[1], 10) - 1

        if ((pp == "P" && py == 4) || (pp == "p" && py == 1)) {
            // promoting
            promoting = [game.state]
            game.move_game(source, target)
            
            var size = $board.find('.square-' + target)[0].getBoundingClientRect()
            var container = document.createElement("div")
            container.classList.add("promotion-buttons")
            container.id = "promotion-buttons-container"
            container.style.position = 'absolute'
            container.style.height = size.height * 3 + "px"
            container.style.width = size.width + "px"
            container.style.left = size.left + "px"
            
            var qp = document.createElement("button")
            var rp = document.createElement("button")
            var np = document.createElement("button")
            qp.classList.add("promotion")
            rp.classList.add("promotion")
            np.classList.add("promotion")
            
            qp.style.height = size.height + "px"
            qp.style.width = size.width + "px"
            
            rp.style.height = size.height + "px"
            rp.style.width = size.width + "px"

            np.style.height = size.height + "px"
            np.style.width = size.width + "px"
            
            if (pp == "P") {
                qp.classList.add("white-queen-promotion")
                rp.classList.add("white-rook-promotion")
                np.classList.add("white-knight-promotion")
                qp.addEventListener("click", promotion("Q", px, py, tx, ty))
                rp.addEventListener("click", promotion("R", px, py, tx, ty))
                np.addEventListener("click", promotion("N", px, py, tx, ty))
                if (board.orientation() == "white") {
                    container.style.top = size.top + "px"
                    container.appendChild(qp)
                    container.appendChild(rp)
                    container.appendChild(np)
                } else {
                    container.style.top = (size.top - size.height * 2) + "px"
                    container.appendChild(np)
                    container.appendChild(rp)
                    container.appendChild(qp)
                }
                
            } else {
                qp.classList.add("black-queen-promotion")
                rp.classList.add("black-rook-promotion")
                np.classList.add("black-knight-promotion")
                qp.addEventListener("click", promotion("q", px, py, tx, ty))
                rp.addEventListener("click", promotion("r", px, py, tx, ty))
                np.addEventListener("click", promotion("n", px, py, tx, ty))
                if (board.orientation() == "white") {
                    container.style.top = (size.top - size.height * 2) + "px"
                    container.appendChild(np)
                    container.appendChild(rp)
                    container.appendChild(qp)
                } else {
                    container.style.top = size.top + "px"
                    container.appendChild(qp)
                    container.appendChild(rp)
                    container.appendChild(np)
                }
                
            }

            document.body.appendChild(container)
            
        } else {
            // highlight
            $board.find('.' + squareClass).removeClass('highlight-white')
            $board.find('.' + squareClass).removeClass('highlight-black')
            var $ssquare = $board.find('.square-' + source)
            if ($ssquare.hasClass('black-3c85d')) {
                $ssquare.addClass('highlight-black')
            } else {
                $ssquare.addClass('highlight-white')
            }
            var $tsquare = $board.find('.square-' + target)
            if ($tsquare.hasClass('black-3c85d')) {
                $tsquare.addClass('highlight-black')
            } else {
                $tsquare.addClass('highlight-white')
            }
            // add pgn
            game.add_pgn(source, target)
            game.move_game(source, target)
            update_pgn(game.pgn)
            
        }
    }
}


function undo_promotion() {
    $('div#promotion-buttons-container').remove()
    $("#promotion-buttons-container").remove()
    game.set_state(promoting[0])
    board.position(game.fen())
    promoting = []
}


function onMouseoverSquare (square, piece) {
    if (game.game_over() || !onCurrentMove) return false
    if (!piece) return false
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false
    }
  // get list of possible moves for this square
  var moves = game.get_moves_from_square(square)

  // exit if there are no moves available for this square
  if (moves.length === 0) return

  // highlight the square they moused over
  greySquare(square)

  // highlight the possible squares for this piece
  for (var i = 0; i < moves.length; i++) {
      greySquare(moves[i])
  }
}

function onMouseoutSquare (square, piece) {
  removeGreySquares()
}

function onSnapEnd () {
    board.position(game.fen())
    // alert user if game over
    var x = game.check_for_game_over()
    if (x != false) {
        if (x == "Checkmate") {
            game.pgn = game.pgn.replaceAt(game.pgn.length - 1, "#")
            setTimeout(() => { alert((game.turn() == "w" ? "BLACK " : "WHITE ") + "WINS!") }, 100)
        } else {
            alert("DRAW (STALEMATE)")
        }
    }
}

document.body.onclick = function (evt) {
    if (detectLeftButton(evt)) {
        if (promoting.length == 2) {
            var target= 'target' in event? event.target : event.srcElement;
            if (!target.classList.contains("promotion")) {
                undo_promotion()
            }
        } else if (promoting.length == 1) {
            promoting.push(true)
        }
    }
} 

function detectLeftButton(e) {
    var isLeft;
    e = e || window.event;

    if ("which" in e)
        isLeft = e.which == 1
    else if ("button" in e)  // IE, Opera 
        isLeft = e.button == 1
    
    return isLeft
}

var config = {
    draggable: true,
    position: '6/6/6/6/6/6 w KQkq',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoutSquare: onMouseoutSquare,
    onMouseoverSquare: onMouseoverSquare,
    onSnapEnd: onSnapEnd,
    orientation: "white"
}

function init(color) {
    if (color == "random") {
        if (Math.random() < 0.5) {
            color = "white"
        } else {
            color = "black"
        }
    }
    board.position('rnqknr/pppppp/6/6/PPPPPP/RNQKNR w KQkq')
    board.orientation(color)
    
    var pv = document.getElementById("pgn-viewer")
    pv.innerHTML = ""
    pv.style.textAlign = "left"
}

var board = null

var promoting = []
var game = new Chessgame()
board = Chessboard('myBoard', config)

var whiteSquareGrey = '#a9a9a9'
var blackSquareGrey = '#696969'
var $board = $('#myBoard')
var squareClass = 'square-55d63'
var onCurrentMove = true

