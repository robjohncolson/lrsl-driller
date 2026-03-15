"""
Reversing subtraction order flips the inequality for one-sided tests.

Render:
manim -qm --format=mp4 animations/apstat_78_reverse_order.py MeanDiffTestReverseOrder
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestReverseOrder(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text(
            "Reverse the Order, Reverse the Sign",
            font_size=35,
            weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)

        prompt = Text(
            "Suppose population 1 is expected to have the larger mean",
            font_size=24,
            color=YELLOW_3B1B,
        )
        prompt.next_to(title, DOWN, buff=0.18)

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.6,
            height=2.0,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(BLUE_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.2 + UP * 0.45)
        left_text = VGroup(
            Text("Keep the original order", font_size=24, color=BLUE_3B1B, weight=BOLD),
            Text("Ha: mu1 - mu2 > 0", font_size=28, weight=BOLD),
        ).arrange(DOWN, buff=0.2).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.6,
            height=2.0,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(TEAL_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.2 + UP * 0.45)
        right_text = VGroup(
            Text("Reverse the subtraction", font_size=24, color=TEAL_3B1B, weight=BOLD),
            Text("Ha: mu2 - mu1 < 0", font_size=28, weight=BOLD),
        ).arrange(DOWN, buff=0.2).move_to(right_box.get_center())

        swap_arrow = DoubleArrow(
            left_box.get_right() + RIGHT * 0.12,
            right_box.get_left() + LEFT * 0.12,
            color=YELLOW_3B1B,
            buff=0.05,
            stroke_width=6,
        )
        swap_label = Text("same idea, opposite sign", font_size=22, color=YELLOW_3B1B, weight=BOLD)
        swap_label.next_to(swap_arrow, UP, buff=0.12)

        bottom_box = RoundedRectangle(
            corner_radius=0.2,
            width=9.0,
            height=2.3,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        bottom_box.set_fill(GREEN_3B1B, opacity=0.12)
        bottom_box.shift(DOWN * 2.2)
        bottom_text = VGroup(
            Text("One-sided tests depend on order", font_size=26, color=GREEN_3B1B, weight=BOLD),
            Text("mu1 - mu2 > 0   becomes   mu2 - mu1 < 0", font_size=26, weight=BOLD),
            Text("Reverse the subtraction and flip the inequality", font_size=22),
        ).arrange(DOWN, buff=0.18).move_to(bottom_box.get_center())

        sign_focus_left = SurroundingRectangle(left_text[1], color=PINK_3B1B, buff=0.16)
        sign_focus_right = SurroundingRectangle(right_text[1], color=PINK_3B1B, buff=0.16)

        self.play(Write(title), run_time=1.0)
        self.play(FadeIn(prompt, shift=UP * 0.2), run_time=0.8)
        self.wait(0.8)

        self.play(Create(left_box), Write(left_text), run_time=1.1)
        self.wait(0.9)

        self.play(GrowArrow(swap_arrow), Write(swap_label), run_time=1.0)
        self.play(Create(right_box), Write(right_text), run_time=1.1)
        self.wait(1.0)

        self.play(Create(sign_focus_left), run_time=0.8)
        self.wait(0.7)
        self.play(ReplacementTransform(sign_focus_left, sign_focus_right), run_time=0.9)
        self.wait(0.9)

        self.play(Create(bottom_box), Write(bottom_text), run_time=1.1)
        self.wait(3.5)
