import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, regularizers, optimizers
import numpy as np
import chess_logic as logic
import chess_constants as constants


# network = input -> conv -> 10 res -> [policy head, value head]
# conv = 128 filters, 3x3 kernel, stride 1 -> batch normalisation -> ReLU
# res = conv -> conv w/o ReLU -> skip connection -> ReLU
# value head = conv filter 1x1 -> batch normalisation -> ReLU -> Dense 128
# -> ReLU -> Dense 1 ->
# policy head = conv -> 50

def softmax_cross_entropy_with_masking(y_true, y_pred):
    p = y_pred
    pi = y_true

    # mask output where prob < 0.05 (likely illegal moves)
    zero = tf.fill(tf.shape(pi), 0.05)
    where = tf.less(pi, zero)
    negatives = tf.fill(tf.shape(pi), -100.0)
    p = tf.where(where, negatives, p)

    loss = tf.nn.softmax_cross_entropy_with_logits(labels=pi, logits=p)

    return loss


def get_output(net, game_state):
    # format game state into input to the neural network
    inp = logic.format_state(game_state)

    # pass input into net and get outputs
    value, policy = net.predict(np.asarray([inp]))

    # format ouputs
    value = value[0][0]
    policy = logic.format_policy(game_state, policy[0])

    return value, policy


class ResidualCnn:

    def __init__(self, hidden_layers, learning_rate=0.01, momentum=0.9, reg_const=0.0001):
        self.learning_rate = 0.01
        self.momentum = 0.9
        self.reg_const = reg_const

        self.hidden_layers = hidden_layers
        self.num_layers = len(hidden_layers)
        self.model = self.build_model()

    def residual_layer(self, input_block, filters, kernel_size):
        x = self.conv_layer(input_block, filters, kernel_size)

        x = layers.Conv2D(filters=filters,
                          kernel_size=kernel_size,
                          data_format="channels_last",
                          padding='same', use_bias=False,
                          activation='linear',
                          kernel_regularizer=regularizers.l2(self.reg_const))(x)

        x = layers.BatchNormalization(axis=3)(x)

        x = layers.add([input_block, x])

        x = layers.Activation(lambda x: tf.nn.gelu(x, approximate=True))(x)

        return x

    def conv_layer(self, x, filters, kernel_size):
        x = layers.Conv2D(filters=filters,
                          kernel_size=kernel_size,
                          data_format="channels_last",
                          padding='same',
                          use_bias=False,
                          activation='linear',
                          kernel_regularizer=regularizers.l2(self.reg_const))(x)

        x = layers.BatchNormalization(axis=3)(x)

        x = layers.Activation(lambda x: tf.nn.gelu(x, approximate=True))(x)

        return x

    def value_head(self, x):

        x = layers.Conv2D(filters=1,
                          kernel_size=(1, 1),
                          data_format="channels_last",
                          padding='same',
                          use_bias=False,
                          activation='linear',
                          kernel_regularizer=regularizers.l2(self.reg_const)
                          )(x)

        x = layers.BatchNormalization(axis=3)(x)
        x = layers.Activation(lambda x: tf.nn.gelu(x, approximate=True))(x)

        x = layers.Flatten()(x)

        x = layers.Dense(128,
                         use_bias=False,
                         activation='linear',
                         kernel_regularizer=regularizers.l2(self.reg_const)
                         )(x)

        x = layers.Activation(lambda x: tf.nn.gelu(x, approximate=True))(x)

        x = layers.Dense(1,
                         use_bias=False,
                         activation='tanh',
                         kernel_regularizer=regularizers.l2(self.reg_const),
                         name='value_head'
                         )(x)

        return x

    def policy_head(self, x):

        x = self.conv_layer(x, 128, (3, 3))

        x = layers.Conv2D(filters=constants.MOVE_SHAPE[-1],
                          kernel_size=(1, 1),
                          data_format="channels_last",
                          padding='same',
                          use_bias=False,
                          activation='linear',
                          kernel_regularizer=regularizers.l2(self.reg_const)
                          )(x)

        x = layers.BatchNormalization(axis=3, name='policy_head')(x)

        return x

    def build_model(self):
        main_input = keras.Input(shape=constants.GAME_STATE_SHAPE, name='main_input')

        x = self.conv_layer(main_input, self.hidden_layers[0]['filters'],
                            self.hidden_layers[0]['kernel_size'])

        if len(self.hidden_layers) > 1:
            for h in self.hidden_layers[1:]:
                x = self.residual_layer(x, h['filters'], h['kernel_size'])

        vh = self.value_head(x)
        ph = self.policy_head(x)

        model = keras.Model(inputs=main_input, outputs=[vh, ph])
        model.compile(loss={'value_head': 'mean_squared_error',
                            'policy_head': softmax_cross_entropy_with_masking},
                      metrics={'value_head': 'binary_accuracy',
                               'policy_head': "categorical_accuracy"},
                      optimizer=optimizers.SGD(learning_rate=self.learning_rate,
                                               momentum=self.momentum),
                      loss_weights={'value_head': 0.5, 'policy_head': 0.5},
                      )

        return model


def get_model(path):
    model = keras.models.load_model(
        path,
        custom_objects={'softmax_cross_entropy_with_masking': softmax_cross_entropy_with_masking}
    )

    return model


def save_model(model, path):
    model.save(path)


def training(net, path, state, policy, value, mini_batch, num_epoch):
    history = net.fit({"main_input": state},
                      {"value_head": value, "policy_head": policy},
                      epochs=num_epoch, batch_size=mini_batch, shuffle=True)

    save_model(net, path)
    return history
