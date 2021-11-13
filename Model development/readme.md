# LOS ALAMOS CHESS AI
***BASED ON ALPHAZERO PAPER: https://arxiv.org/pdf/1712.01815.pdf*** <br/>
Los Alamos chess is a chess variant played on a 6×6 board without bishops. This was the first chess-like game played by a computer program. The reduction of the board size and the number of pieces from standard chess was due to the very limited capacity of computers at the time: https://en.wikipedia.org/wiki/Los_Alamos_chess <br/>
I made the AI to play Los Alamos chess variant instead of standard chess as in the original paper because my computing power is not as good as Google DeepMind's. <br/>
Packages used: Numpy, PyQt5, Tensorflow

# How it works
To find the best move (move that maximizes winning probability), given a game state, the AI will expand and explore a tree of possible moves/scenarios originated from that original game state.
Paths (list of moves from the starting state to a different state) can be evaluated using a deep residual network, which will get better over time.
When done evaluating, the path value (winning probability/how favourable the path is) will be updated. Paths with higher values will be prioritized and consequently be explored more often. Therefore, the best move can be determined as it is the most explore one.
## The learning process:
The AI will play a game with itself, from start to finish. At the end of several games, the neural network will be trained, which encourages it to play the winning side's moves and avoid playing the losing side's moves.
After some time of self-playing, the neural network will get better and eventually play the best moves.
## Game states and moves representation
A single board state are represented using a stack of 11 planes with dimension 6 x 6 (size of the board). 5 planes are used to store information about the white pieces, 5 are for storing black's pieces, and 1 plane for repetition.<br/>
Game states are represented using a stack 44 planes to encode the current and 3 prev. boards, plus 7 planes for additional repetition count, player to move, total move count, legality of castling, a total of 51 6x6 planes.<br/>
A move is represented by a stack of 54 10x9 planes (20 orthogonal moves, 20 diagonal moves, 8 knight moves, 6 underpromotion moves). Position on the plane is the position of the piece to "pick up", and position on the stack can be interpret as the target position.
## Network configuration 
Input -> Convolution Block -> 7 Residual Blocks -> (Policy head, Value head)<br/>
Input: shape = (51, 6, 6), the game state to evaluate<br/>
Convolution Block: Conv layer (48 filters, 3x3 kernel, stride 1)-> batch normalisation -> GELU<br/>
Residual Block: Conv block -> conv -> skip connection -> GELU<br/>
Value head: Conv layer (filter 1x1) -> batch normalisation -> GELU -> Dense 128 -> GELU -> Dense 1 Tanh; output shape = (1, 1)<br/>
Policy head: Conv block -> Conv layer (54 filter 1x1); output shape = (54, 6, 6)<br/>
## Tree search method (Monte Carlo Tree Search)
Each node will hold these information:
- Game State
- *n* - number of visits to the node
- *w* - total value of the node
- *q* - mean value of the node (= w/n)
- *p* - prior probability (probability of selecting this node earlier)
- *m* - prior move to get to this node<br/><br/>

**The explore loop:**
- Start with a single node for the current game state (root node)
- **Evaluation:** Use the neural network to get value of the game as well as probabilities of playing moves from that game state
- **Expansion:** From the selected node, create child nodes for all the possible move, then update their prior probability using the output of the neural network
- **Backup** Update *n* and *w* of all node in the path
- **Selection** Create a new path (list of nodes) that starts from the root node and ends on a leaf (unexpanded) node. When selecting a single node from many child nodes, it will take into consideration *n* and *w* of all those child nodes. When trying to explore new and uncommon moves (like in the early game), it'll choose nodes that has relatively low *n* (not visited often).And when playing accurately (end game), it'll prioritze *w*. After it has finish selecting a path, the leaf node will be expanded in Expansion and begin a new cycle.

After running a certain number of cycles, the node that was in a selected path most often will be choose and the AI will play the corresponding move.

# Context
When entering my new school, I noticed that several of my classmates played chess and were even members of their former school's competitive team. I just understood how the pieces moved at the time and had always wanted to learn how to play properly, so one day I approached the chessboard where they were playing and asked if they could teach me how to play. Things were a little overwhelming at first, and I lost every match to them. I would look up openings, tactics, tips, and professional game analyses whenever I was at home, and that's how I discovered Alpha Zero, a chess-AI recently developed to play chess better than any human or computer ever could. The astonishing thing that truly blew my mind was that it mastered the game entirely on its own, without any human guidance or influence. It would sometimes plays seemingly nonsensical moves, sacrificing pieces as if they were nothing, and ends up winning effortlessly, whereas other grandmasters would calculate ten or more moves ahead only to avoid losing a single pond. Some analysts and avid chess masters said that the AI is unquestionably creative, which piqued my interest to the point where I spent an entire night reading papers to figure out how Alpha Zero works. Since there is no official open-source of it available online and I wanted to play with it, I set myself the challenge of recreating Alpha Zero just from their papers. So I told my friends about my little project, saying that if I couldn't defeat them in chess, I’d write a program that could. This assignment turned out to be, predictably, easier said than done, and I had to self-learn a wide range of topics, including the mechanics of neural networks, reinforcement learning, coding, etc., which took me far longer than planned. Soon enough, I realized the task I embarked on was too much, as it would require more than a year of uninterrupted processing on my cheap laptop to let the AI teach itself, so I had to compromise by having it play a variant of chess with a smaller board and fewer pieces. I also had to reduce the size of the model and the number of simulations. On top of that, I encountered countless errors after errors, failed attempts after failed attempts, some of which were only apparent after weeks of training. Eventually, my perseverance paid off, and I managed to put together a semi-functional system.
