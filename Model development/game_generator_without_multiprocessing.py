from collections import Counter
import MCTS
import NeuralNet
import chess_constants as constants
import chess_logic as logic
import random

num_predict = 4
num_game = 4


def generate_games(games):
    net = NeuralNet.get_model("models\\AlphaLAZero")
    for g in range(games):
        random.seed(7568216857281110751)
        c = 0
        game_state = constants.init_state()
        board_state = game_state[..., constants.BOARD_STATE_START:]

        history = Counter()
        history[logic.hash_board(board_state)] += 1

        tree_search = MCTS.TreeSearch(game_state, num_predict)

        training_data = []  # a list of [game_state, pi, result]

        while True:
            res = logic.evaluate(board_state)  # - 1 = red wins, 0 = draws, 1 = black wins, 2 = nothing
            if not res:  # game ends as a draw
                break
            if not res == 2:
                break
            if c == 10:
                assert True
            (y, x, d), pi = tree_search.get_pi(net, play_stochastically=(c < 32))


            training_data.append([
                logic.format_state(game_state),
                logic.format_pi(pi, game_state[0, 0, constants.PLAYER_TO_MOVE_INDEX]),
                (0,)
            ])
            print(logic.move_to_notation(board_state, (y, x, d)))
            # 1 data = [game state, pi, result]
            logic.move_game(game_state, (y, x, d), history)
            c += 1


if __name__ == "__main__":
    generate_games(num_game)
