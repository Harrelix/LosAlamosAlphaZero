import logging
import multiprocessing
import sys
import os
from collections import Counter
import random
import time

import tables

import MCTS
import NeuralNet
import chess_constants as constants
import chess_logic as logic

num_predict = 4
num_game = 4
num_process = multiprocessing.cpu_count()


def setup_logger(name, log_file, level=logging.DEBUG):
    handler = logging.FileHandler(log_file)
    handler.setFormatter(logging.Formatter('%(message)s'))

    log = logging.getLogger(name)
    log.setLevel(level)
    log.addHandler(handler)

    return log


def update_progress(progress, process_index, game, move):
    games = progress["Game"]
    if game == -1:
        games[process_index] = 0
    else:
        games[process_index] += game
    moves = progress["Move"]
    if move == -1:
        moves[process_index] = 0
    else:
        moves[process_index] += move
    progress["Game"] = games
    progress["Move"] = moves

    for i in range(num_process):
        game_at = str(progress["Game"][i]).ljust(2, " ")
        move_at = str(progress["Move"][i]).ljust(3, " ")
        sys.stdout.write(f"{i}: {game_at}/{move_at}|")
    sys.stdout.write("\r")
    sys.stdout.flush()


def listen_and_write(queue):
    # listens for data on queue, then save them
    while True:
        data = queue.get()
        if data == "kill":
            break

        dump_training_data(data, "data/training_data.h5")


def dump_training_data(data, path):
    state, policy, value = zip(*data)

    with tables.open_file(path, mode="a") as f:
        f.root.state.append(state)
        f.root.policy.append(policy)
        f.root.value.append(value)


def generate_games(games, progress, process_index, queue, logging_path):
    net = NeuralNet.get_model("models\\AlphaLAZero")
    logger = setup_logger(f'logger {process_index}', f'{logging_path}/logfile #{process_index}.log')
    for g in range(games):
        progress["Game"][process_index] = 1
        progress["Move"][process_index] = 0
        update_progress(progress, process_index, 1, -1)

        seed = random.randrange(sys.maxsize)
        random.seed(seed)
        logger.info(f"GENERATING GAME NUMBER {g} with seed {seed}")

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
                logger.info('\nDraws in {} moves'.format(c))
                logger.info("SAVING DATA")
                queue.put(training_data)
                break
            if not res == 2:
                logger.info("\n{0} wins in {1} moves".format("Red" if res == -1 else "Black", c))

                for i in range(len(training_data)):
                    training_data[i][2] = (-res if i % 2 == 0 else res,)

                logger.info("SAVING DATA")
                q.put(training_data)
                break

            (y, x, d), pi = tree_search.get_pi(net, play_stochastically=(c < 32))

            training_data.append([
                logic.format_state(game_state),
                logic.format_pi(pi, game_state[0, 0, constants.PLAYER_TO_MOVE_INDEX]),
                (0,)
            ])
            # 1 data = [game state, pi, result]

            # log move
            logger.info(logic.move_to_notation(board_state, (y, x, d)))
            logic.move_game(game_state, (y, x, d), history)

            c += 1

            update_progress(progress, process_index, 0, 1)


if __name__ == "__main__":
    timestart = time.time()
    procs = []
    manager = multiprocessing.Manager()
    Progress = manager.dict()
    Progress["Game"] = [0 for _ in range(num_process)]
    Progress["Move"] = [0 for _ in range(num_process)]

    counter = 1
    log_path = "session log/session #{}"
    while os.path.exists(log_path.format(counter)):
        counter += 1
    log_path = log_path.format(counter)
    os.mkdir(log_path)

    q = manager.Queue()
    writer = multiprocessing.Process(target=listen_and_write, args=(q,))
    writer.start()

    print("STARTING")
    for k in range(num_process):
        proc = multiprocessing.Process(target=generate_games, args=(num_game, Progress, k, q, log_path))
        procs.append(proc)
        proc.start()

    for proc in procs:
        proc.join()

    q.put("kill")
    writer.join()

    timeend = time.time()
    print()
    print(f"time elapsed: {timeend - timestart}")
