from math import sqrt
from random import choices
from collections import Counter

import numpy as np
from scipy.special import softmax

import NeuralNet
import chess_constants as constants
import chess_logic as logic


def backup(value, path):
    for node in path:
        node["w"] += value
        node["n"] += 1
        node["q"] = node["w"] / node["n"]


class TreeSearch:
    def __init__(self, game_state, num_search):
        self.last_node = {"Game state": game_state.copy(),
                          "history": Counter(),
                          "n": 0,  # number of visits to the node
                          "w": 0,  # total value of the node (sum of all values of child nodes)
                          "q": 0,  # mean value of the node (= w/n)
                          "p": 0,  # single real value: prior prob. (prob. of selecting this node)
                          "m": None,  # prior move to get to this node = (y, x, d)
                          "children": []  # children nodes
                          }

        # number of move to search
        self.num_search = num_search
        # hyperparameters / constants
        self.c_puct = 1.0  # determines exploration
        self.exploration = 1.0
        # assume we see ~64/16=4 moves per position that has an average of 16 leagal moves => alpha = 416=0.25
        self.dirichlet_alpha = 0.25
        self.dirichlet_weight = 0.25  # increases exploration for the first depth
        self.secondary_dirichlet_weight = 0.01  # incresases exploration for subsequent depths

    def get_pi(self, net, play_stochastically):
        if play_stochastically:
            pick_move = self.play_stochastically
        else:
            pick_move = self.play_deterministically

        for k in range(self.num_search):
            # --- SELECT --------------------------------------------------
            # reset the path
            path = []  # path from root to expanding node
            parent = self.last_node

            # go to leaf node
            while parent["children"]:  # while parent has children
                # PUCT
                n = sum([c["n"] for c in parent["children"]])
                ucb = [c["q"] + self.c_puct * c["p"] * (sqrt(n) / (1 + c["n"])) for c in parent["children"]]

                # pick node that has best ucb (parent will be the leaf node)
                parent = parent["children"][np.argmax(ucb)]
                path.append(parent)

            res = logic.evaluate(parent["Game state"][..., constants.BOARD_STATE_START:])
            # -1 = red won, 0 = draw, 1 = black won, 2 = nothing
            if not res:  # draw
                backup(0, path)
            elif not res == 2:  # game ends
                backup(res if self.last_node["Game state"][0, 0, constants.PLAYER_TO_MOVE_INDEX] else -res, path)
            else:
                # pool of legal moves for the parent's game state
                pool = logic.get_legal_moves(
                    parent["Game state"][..., constants.BOARD_STATE_START:],
                    parent["Game state"][0, 0, constants.PLAYER_TO_MOVE_INDEX]
                )

                # --- EXPAND ----------------------------------------------
                # value: probability of winning (1 = 100%, -1 = 0%) (v)
                # policy: probability of playing each legal move (p)
                value, policy = NeuralNet.get_output(net, parent["Game state"])

                # mask illegal moves from policy
                pool_mask = np.zeros(constants.MOVE_SHAPE, dtype=bool)
                pool_mask[tuple(zip(*pool))] = True
                policy = np.where(pool_mask, policy, -100)
                # re-normalize policy (softmax)
                policy = softmax(policy)

                # # add dirichlet noise:
                # dir_noise = np.random.dirichlet([self.dirichlet_alpha for _ in range(len(pool))])
                # dir_noise_mask = np.zeros(constants.MOVE_SHAPE)
                # for i in range(len(pool)):
                #     dir_noise_mask[pool[i]] = dir_noise[i]
                # dw = self.dirichlet_weight if k == 0 else self.secondary_dirichlet_weight
                # policy = (1 - dw) * policy + dw * dir_noise_mask

                # create children node
                for m in pool:
                    new_game_state = parent["Game state"].copy()
                    new_history = parent["history"].copy()
                    logic.move_game(new_game_state, m, new_history)

                    parent["children"].append({
                        "Game state": new_game_state,
                        "history": new_history,
                        "n": 0, "w": 0, "q": 0,
                        "p": policy[m],
                        "m": m,
                        "children": []
                    })

                # --- BACKUP ----------------------------------------------
                backup(value, path)

        # --- MOVE --------------------------------------------------------
        return pick_move()

    def play_deterministically(self):
        # Play the most visited move
        n = [c["n"] for c in self.last_node["children"]]
        best_move = self.last_node["children"][np.argmax(n)]

        # generating pi for training
        pi = np.zeros(constants.MOVE_SHAPE)
        for i in range(len(self.last_node["children"])):
            pi[self.last_node["children"][i]["m"]] = self.last_node["children"][i]["p"]

        # store picked node, forget the rest
        self.last_node = best_move

        return best_move["m"], pi

    def play_stochastically(self):
        # Play randomly based on # of visits (prefer moves that are visited more)
        n = np.array([c["n"] for c in self.last_node["children"]])
        print(n)
        sum_n = sum(n)
        p = (n / sum_n) ** (1 / self.exploration)
        best_move = choices(self.last_node["children"], weights=p, k=1)[0]
        # generating pi for training
        pi = np.zeros(constants.MOVE_SHAPE)
        for i in range(len(self.last_node["children"])):
            pi[self.last_node["children"][i]["m"]] = self.last_node["children"][i]["p"]

        # store picked node, forget the rest
        self.last_node = best_move

        return best_move["m"], pi
