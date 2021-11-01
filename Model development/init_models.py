import NeuralNet

hidden_cnn_layers = []
for i in range(1 + 7):
    hidden_cnn_layers.append({'filters': 48, 'kernel_size': (3, 3)})

net = NeuralNet.ResidualCnn(hidden_layers=hidden_cnn_layers).model
# import tensorflow as tf
# tf.keras.utils.plot_model(net, "graph.png", show_shapes=True)
NeuralNet.save_model(net, "models\\AlphaLAZero")
