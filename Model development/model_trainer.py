import numpy as np
import tables

import NeuralNet

with tables.open_file("data/training_data.h5", mode="r") as f:
    state = np.asarray(f.root.state)
    policy = np.asarray(f.root.policy)
    value = np.asarray(f.root.value)

    print(f"NUMBER OF TRAINING DATA {state.shape[0]}")

    print("TRAINING MODEL")
    net = NeuralNet.get_model("models/AlphaLAZero")
    NeuralNet.training(net, "models/AlphaLAZero", state, policy, value, 256, 1)

    print("DONE!")
