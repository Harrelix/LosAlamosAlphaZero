/* global tf */

const COLUMNS = "abcdef".split("");
const NUMBERS = "0123456789".split("");

const CHAR_TO_IND = {
  R: 0,
  N: 1,
  Q: 2,
  K: 3,
  P: 4,
  r: 5,
  n: 6,
  q: 7,
  k: 8,
  p: 9
};

const INDEX_TO_NOTATION = ["R", "N", "Q", "K", "P", "r", "n", "q", "k", "p"];

var MODEL = null;
async function init_model() {
  MODEL = await tf.loadGraphModel("./static/model/model.json");
}
init_model();

const MOVE_TO_INDEX = {
  "0": {},
  "1": {},
  "2": {},
  "3": {},
  "4": {},
  "5": {},
  "-1": {},
  "-2": {},
  "-3": {},
  "-4": {},
  "-5": {}
};
// knight move
MOVE_TO_INDEX[1][-2] = 40;
MOVE_TO_INDEX[2][-1] = 41;
MOVE_TO_INDEX[2][1] = 42;
MOVE_TO_INDEX[1][2] = 43;
MOVE_TO_INDEX[-1][2] = 44;
MOVE_TO_INDEX[-2][1] = 45;
MOVE_TO_INDEX[-2][-1] = 46;
MOVE_TO_INDEX[-1][-2] = 47;
// underpromotion
MOVE_TO_INDEX[48] = 48;
MOVE_TO_INDEX[49] = 49;
MOVE_TO_INDEX[50] = 50;
MOVE_TO_INDEX[51] = 51;
MOVE_TO_INDEX[52] = 52;
MOVE_TO_INDEX[53] = 53;

for (let dist = 1; dist < 6; dist++) {
  MOVE_TO_INDEX[dist][0] = dist * 8 - 8;
  MOVE_TO_INDEX[dist][-dist] = dist * 8 - 7;
  MOVE_TO_INDEX[0][-dist] = dist * 8 - 6;
  MOVE_TO_INDEX[-dist][-dist] = dist * 8 - 5;
  MOVE_TO_INDEX[-dist][0] = dist * 8 - 4;
  MOVE_TO_INDEX[-dist][dist] = dist * 8 - 3;
  MOVE_TO_INDEX[0][dist] = dist * 8 - 2;
  MOVE_TO_INDEX[dist][dist] = dist * 8 - 1;
}

const INDEX_TO_MOVE = {};
for (let dx in MOVE_TO_INDEX) {
  for (let dy in MOVE_TO_INDEX[dx]) {
    INDEX_TO_MOVE[MOVE_TO_INDEX[dx][dy]] = [parseInt(dx, 10), parseInt(dy, 10)];
  }
}
INDEX_TO_MOVE[48] = [-1, 0];
INDEX_TO_MOVE[49] = [0, 0];
INDEX_TO_MOVE[50] = [1, 0];
INDEX_TO_MOVE[51] = [-1, 0];
INDEX_TO_MOVE[52] = [0, 0];
INDEX_TO_MOVE[53] = [1, 0];
