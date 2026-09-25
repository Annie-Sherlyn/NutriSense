import os
import sys
import json
import argparse
from pathlib import Path
import numpy as np
import tensorflow as tf
import keras

from ssd_mobilenet import build_ssd_mobilenet, IMG_SIZE, NUM_CLASSES, ASPECT_RATIOS
from plate_synthesizer import PlateSynthesizer

CHECKPOINT_DIR = Path("d:/NutriSense/dl_service/checkpoints")
SSD_MODEL_PATH = CHECKPOINT_DIR / "best_ssd_food_model.keras"

def generate_default_anchors():
    """
    Computes normalized default anchor boxes [ymin, xmin, ymax, xmax] across the 5 feature maps.
    Returns: np.ndarray of shape (1738, 4)
    """
    fmap_sizes = [(19, 19), (10, 10), (5, 5), (3, 3), (1, 1)]
    scales = [0.10, 0.20, 0.37, 0.54, 0.71, 0.88]
    all_anchors = []

    for idx, (f_h, f_w) in enumerate(fmap_sizes):
        s_min = scales[idx]
        s_max = scales[idx + 1]
        step_y = 1.0 / f_h
        step_x = 1.0 / f_w
        ratios = ASPECT_RATIOS[idx]

        for i in range(f_h):
            cy = (i + 0.5) * step_y
            for j in range(f_w):
                cx = (j + 0.5) * step_x

                for r in ratios:
                    w = s_min * np.sqrt(r)
                    h = s_min / np.sqrt(r)
                    all_anchors.append([
                        max(0.0, cy - h / 2.0),
                        max(0.0, cx - w / 2.0),
                        min(1.0, cy + h / 2.0),
                        min(1.0, cx + w / 2.0)
                    ])

    return np.array(all_anchors, dtype=np.float32)

ANCHORS = generate_default_anchors()

def compute_iou_batch(boxesA, boxesB):
    """
    Computes pairwise IoU between boxesA (N, 4) and boxesB (M, 4).
    """
    # boxes: [ymin, xmin, ymax, xmax]
    yA1, xA1, yA2, xA2 = np.split(boxesA, 4, axis=-1)
    yB1, xB1, yB2, xB2 = np.split(boxesB, 4, axis=-1)

    inter_ymin = np.maximum(yA1, yB1.T)
    inter_xmin = np.maximum(xA1, xB1.T)
    inter_ymax = np.minimum(yA2, yB2.T)
    inter_xmax = np.minimum(xA2, xB2.T)

    inter_w = np.maximum(0.0, inter_xmax - inter_xmin)
    inter_h = np.maximum(0.0, inter_ymax - inter_ymin)
    inter_area = inter_w * inter_h

    areaA = (yA2 - yA1) * (xA2 - xA1)
    areaB = (yB2 - yB1) * (xB2 - xB1)
    union_area = areaA + areaB.T - inter_area
    union_area = np.maximum(union_area, 1e-8)

    return inter_area / union_area

def encode_targets(gt_boxes, gt_classes, anchors=ANCHORS):
    """
    Matches ground truth boxes to anchors.
    Returns:
        target_locs: (1738, 4) [dy, dx, dh, dw]
        target_classes: (1738,) int32 (0 for background, 1..28 for food)
    """
    num_anchors = len(anchors)
    target_locs = np.zeros((num_anchors, 4), dtype=np.float32)
    target_classes = np.zeros(num_anchors, dtype=np.int32)

    if len(gt_boxes) == 0:
        return target_locs, target_classes

    ious = compute_iou_batch(anchors, gt_boxes)  # (1738, num_gt)
    best_gt_idx = np.argmax(ious, axis=1)        # for each anchor, closest GT
    best_ious = np.max(ious, axis=1)             # for each anchor, highest IoU

    # Anchors with IoU >= 0.40 are assigned to the food class
    pos_mask = best_ious >= 0.40

    # Also assign each GT to its single highest-overlapping anchor (guarantee all GTs have >= 1 anchor)
    gt_best_anchor = np.argmax(ious, axis=0)
    for gt_i, a_idx in enumerate(gt_best_anchor):
        pos_mask[a_idx] = True
        best_gt_idx[a_idx] = gt_i

    # Encode targets
    for a_idx in np.where(pos_mask)[0]:
        gt_i = best_gt_idx[a_idx]
        gt_b = gt_boxes[gt_i]
        anc_b = anchors[a_idx]

        # Anchor center and size
        a_h = anc_b[2] - anc_b[0]
        a_w = anc_b[3] - anc_b[1]
        a_cy = anc_b[0] + a_h / 2.0
        a_cx = anc_b[1] + a_w / 2.0

        # GT center and size
        g_h = gt_b[2] - gt_b[0]
        g_w = gt_b[3] - gt_b[1]
        g_cy = gt_b[0] + g_h / 2.0
        g_cx = gt_b[1] + g_w / 2.0

        # Log-space offsets
        dy = (g_cy - a_cy) / (a_h + 1e-6)
        dx = (g_cx - a_cx) / (a_w + 1e-6)
        dh = np.log(max(g_h, 1e-4) / (a_h + 1e-6))
        dw = np.log(max(g_w, 1e-4) / (a_w + 1e-6))

        target_locs[a_idx] = [dy, dx, dh, dw]
        target_classes[a_idx] = gt_classes[gt_i]

    return target_locs, target_classes

def smooth_l1_loss(y_true, y_pred):
    diff = tf.abs(y_true - y_pred)
    less_than_one = tf.cast(tf.less(diff, 1.0), tf.float32)
    return tf.reduce_sum(less_than_one * 0.5 * diff ** 2 + (1.0 - less_than_one) * (diff - 0.5), axis=-1)

def train_ssd(epochs=5, steps_per_epoch=60, batch_size=16):
    print("=" * 70)
    print("NutriSense SSD MobileNet V2 Object Detection Training")
    print("=" * 70)

    synthesizer = PlateSynthesizer()
    model = build_ssd_mobilenet(num_classes=NUM_CLASSES)
    optimizer = keras.optimizers.Adam(learning_rate=1e-3)

    print(f"\nInitialized SSD MobileNet V2 with {len(ANCHORS)} anchors across 5 scales.")
    print(f"Training for {epochs} epochs ({steps_per_epoch} batches of size {batch_size} per epoch)...")

    for epoch in range(1, epochs + 1):
        epoch_loc_loss = 0.0
        epoch_cls_loss = 0.0

        for step in range(steps_per_epoch):
            batch_imgs = []
            batch_locs = []
            batch_cls = []

            for _ in range(batch_size):
                img, boxes, labels = synthesizer.generate_sample()
                t_loc, t_cls = encode_targets(boxes, labels)
                batch_imgs.append(img)
                batch_locs.append(t_loc)
                batch_cls.append(t_cls)

            x_batch = np.array(batch_imgs, dtype=np.float32)
            y_loc = np.array(batch_locs, dtype=np.float32)
            y_cls = np.array(batch_cls, dtype=np.int32)

            with tf.GradientTape() as tape:
                pred_loc, pred_cls = model(x_batch, training=True)

                # Positive mask (where target is not background 0)
                pos_mask = tf.cast(tf.greater(y_cls, 0), tf.float32)
                num_pos = tf.maximum(tf.reduce_sum(pos_mask), 1.0)

                # 1. Localization Loss (only on positives)
                loc_diff = smooth_l1_loss(y_loc, pred_loc)
                loc_loss = tf.reduce_sum(loc_diff * pos_mask) / num_pos

                # 2. Classification Loss (Focal / CrossEntropy with Hard Negative Mining)
                y_cls_one_hot = tf.one_hot(y_cls, depth=NUM_CLASSES)
                cross_entropy = -tf.reduce_sum(y_cls_one_hot * tf.math.log(pred_cls + 1e-8), axis=-1)

                # Hard negative mining: keep all positives + top 3x negatives
                pos_loss = cross_entropy * pos_mask
                neg_loss = cross_entropy * (1.0 - pos_mask)

                # Select hardest negatives
                num_neg = tf.cast(num_pos * 3.0, tf.int32)
                neg_loss_flat = tf.reshape(neg_loss, [-1])
                top_neg_loss, _ = tf.math.top_k(neg_loss_flat, k=tf.minimum(num_neg, tf.shape(neg_loss_flat)[0]))

                cls_loss = (tf.reduce_sum(pos_loss) + tf.reduce_sum(top_neg_loss)) / num_pos
                total_loss = loc_loss + cls_loss

            grads = tape.gradient(total_loss, model.trainable_variables)
            optimizer.apply_gradients(zip(grads, model.trainable_variables))

            epoch_loc_loss += float(loc_loss)
            epoch_cls_loss += float(cls_loss)

            if (step + 1) % 20 == 0 or (step + 1) == steps_per_epoch:
                print(f"  Epoch {epoch}/{epochs} | Step {step+1}/{steps_per_epoch} -> Loc Loss: {epoch_loc_loss/(step+1):.4f} | Cls Loss: {epoch_cls_loss/(step+1):.4f}")

        avg_loc = epoch_loc_loss / steps_per_epoch
        avg_cls = epoch_cls_loss / steps_per_epoch
        print(f"--> [Epoch {epoch} Completed] Total Loss: {avg_loc + avg_cls:.4f} (Loc: {avg_loc:.4f}, Cls: {avg_cls:.4f})")

    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    model.save(str(SSD_MODEL_PATH))
    print(f"\nSSD MobileNet V2 saved to: {SSD_MODEL_PATH}")
    return model

if __name__ == "__main__":
    train_ssd(epochs=3, steps_per_epoch=40, batch_size=8)
