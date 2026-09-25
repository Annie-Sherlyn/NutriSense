import tensorflow as tf
import keras
from keras import layers
from typing import Tuple, List, Dict, Any
import numpy as np

IMG_SIZE = (300, 300)
NUM_CLASSES = 28 + 1  # 28 food classes + 1 background class (index 0)

ASPECT_RATIOS = [
    [1.0, 2.0, 0.5],             # Map 1: 19x19
    [1.0, 2.0, 0.5, 3.0, 0.33],  # Map 2: 10x10
    [1.0, 2.0, 0.5, 3.0, 0.33],  # Map 3: 5x5
    [1.0, 2.0, 0.5],             # Map 4: 3x3
    [1.0, 2.0, 0.5],             # Map 5: 1x1
]

def build_ssd_mobilenet(
    num_classes: int = NUM_CLASSES,
    input_shape: Tuple[int, int, int] = (300, 300, 3)
) -> keras.Model:
    inputs = keras.Input(shape=input_shape, name="image_input")

    base = keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights="imagenet"
    )
    base.trainable = False

    # Create sub-model to extract intermediate feature maps
    fmap1_layer = base.get_layer("block_13_expand_relu")
    fmap2_layer = base.layers[-1]
    backbone_multi = keras.Model(
        inputs=base.input,
        outputs=[fmap1_layer.output, fmap2_layer.output],
        name="mobilenetv2_features"
    )

    fmap1, fmap2 = backbone_multi(inputs)

    # Extra SSD Feature Pyramid Layers
    # Layer 3: ~5x5
    x = layers.Conv2D(256, 1, padding="same", activation="relu")(fmap2)
    fmap3 = layers.Conv2D(512, 3, strides=2, padding="same", activation="relu", name="ssd_fmap3")(x)

    # Layer 4: ~3x3
    x = layers.Conv2D(128, 1, padding="same", activation="relu")(fmap3)
    fmap4 = layers.Conv2D(256, 3, strides=2, padding="same", activation="relu", name="ssd_fmap4")(x)

    # Layer 5: ~1x1
    x = layers.Conv2D(128, 1, padding="same", activation="relu")(fmap4)
    fmap5 = layers.Conv2D(256, 3, strides=2, padding="valid", activation="relu", name="ssd_fmap5")(x)

    feature_maps = [fmap1, fmap2, fmap3, fmap4, fmap5]

    loc_predictions = []
    cls_predictions = []

    for i, fmap in enumerate(feature_maps):
        n_anchors = len(ASPECT_RATIOS[i])
        # Box regression head: [dy, dx, dh, dw]
        loc = layers.Conv2D(n_anchors * 4, 3, padding="same", name=f"loc_head_{i}")(fmap)
        loc = layers.Reshape((-1, 4))(loc)
        loc_predictions.append(loc)

        # Class prediction head: 28 food classes + 1 background
        cls = layers.Conv2D(n_anchors * num_classes, 3, padding="same", name=f"cls_head_{i}")(fmap)
        cls = layers.Reshape((-1, num_classes))(cls)
        cls_predictions.append(cls)

    all_locs = layers.Concatenate(axis=1, name="box_predictions")(loc_predictions)
    all_cls_logits = layers.Concatenate(axis=1, name="class_logits")(cls_predictions)
    all_cls = layers.Softmax(axis=-1, name="class_predictions")(all_cls_logits)

    model = keras.Model(inputs=inputs, outputs=[all_locs, all_cls], name="ssd_mobilenet_v2_food")
    return model

if __name__ == "__main__":
    model = build_ssd_mobilenet()
    print("\nSSD MobileNet V2 built successfully!")
    print(f"Total anchors generated: {model.outputs[0].shape[1]}")
    print(f"Box output shape: {model.outputs[0].shape}")
    print(f"Class output shape: {model.outputs[1].shape}")
