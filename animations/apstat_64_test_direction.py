"""
Visualize how question wording determines a one-sided or two-sided alternative.

Run with: manim -qm --format=mp4 animations/apstat_64_test_direction.py TestDirection64
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TestDirection64(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Choose the Direction of Hₐ", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.4)

        center_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.4,
            height=1.0,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        center_box.set_fill(BLUE_3B1B, opacity=0.12)
        center_box.shift(UP * 1.7)
        center_text = Text("Start with the wording", font_size=28, color=BLUE_3B1B, weight=BOLD)
        center_text.move_to(center_box.get_center())

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.8,
            height=1.35,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(PINK_3B1B, opacity=0.14)
        left_box.shift(LEFT * 4.15 + DOWN * 0.3)
        left_text_1 = Text("less, lower,", font_size=28, color=PINK_3B1B, weight=BOLD)
        left_text_2 = Text("fewer", font_size=28, color=WHITE)
        left_group = VGroup(left_text_1, left_text_2).arrange(DOWN, buff=0.08).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.8,
            height=1.35,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(GREEN_3B1B, opacity=0.14)
        right_box.shift(RIGHT * 4.15 + DOWN * 0.3)
        right_text_1 = Text("more, higher,", font_size=28, color=GREEN_3B1B, weight=BOLD)
        right_text_2 = Text("greater", font_size=28, color=WHITE)
        right_group = VGroup(right_text_1, right_text_2).arrange(DOWN, buff=0.08).move_to(right_box.get_center())

        bottom_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.0,
            height=1.35,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        bottom_box.set_fill(YELLOW_3B1B, opacity=0.12)
        bottom_box.shift(DOWN * 2.45)
        bottom_text_1 = Text("differs, changed,", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        bottom_text_2 = Text("different", font_size=28, color=WHITE)
        bottom_group = VGroup(bottom_text_1, bottom_text_2).arrange(DOWN, buff=0.08).move_to(bottom_box.get_center())

        left_arrow = Arrow(center_box.get_bottom() + LEFT * 1.2, left_box.get_top(), buff=0.15, color=PINK_3B1B, stroke_width=6)
        right_arrow = Arrow(center_box.get_bottom() + RIGHT * 1.2, right_box.get_top(), buff=0.15, color=GREEN_3B1B, stroke_width=6)
        down_arrow = Arrow(center_box.get_bottom(), bottom_box.get_top(), buff=0.15, color=YELLOW_3B1B, stroke_width=6)

        left_result = Text("Hₐ: p < p₀", font_size=30, color=PINK_3B1B, weight=BOLD).next_to(left_box, DOWN, buff=0.3)
        right_result = Text("Hₐ: p > p₀", font_size=30, color=GREEN_3B1B, weight=BOLD).next_to(right_box, DOWN, buff=0.3)
        bottom_result = Text("Hₐ: p ≠ p₀", font_size=30, color=YELLOW_3B1B, weight=BOLD).next_to(bottom_box, DOWN, buff=0.3)

        note = Text("Pick the direction before collecting data.", font_size=26, color=TEAL_3B1B, weight=BOLD)
        note.to_edge(DOWN, buff=0.45)

        self.play(FadeIn(title), FadeIn(center_box), Write(center_text))
        self.play(GrowArrow(left_arrow), GrowArrow(right_arrow), GrowArrow(down_arrow))
        self.play(FadeIn(left_box), FadeIn(right_box), FadeIn(bottom_box))
        self.play(Write(left_group), Write(right_group), Write(bottom_group))
        self.play(FadeIn(left_result), FadeIn(right_result), FadeIn(bottom_result))
        self.play(FadeIn(note))
        self.wait(2)
