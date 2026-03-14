"""
Equal Means Means 0 (AP Stats Unit 7, Topic 7.7)

Run with: manim -qm --format=mp4 apstat_77_equal_means_zero.py MeanDiffCIEqualMeansZero
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIEqualMeansZero(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Equal Means Means 0", font_size=42, weight=BOLD)
        subtitle = Text("For μ₁ − μ₂", font_size=28, color=TEAL_3B1B)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.6)

        left_box = RoundedRectangle(
            corner_radius=0.18,
            width=4.1,
            height=1.5,
            stroke_color=BLUE_3B1B,
            fill_color=BLUE_3B1B,
            fill_opacity=0.14,
        )
        left_text = VGroup(
            Text("Group 1 mean", font_size=26, weight=BOLD),
            Text("same value", font_size=24, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.12).move_to(left_box.get_center())
        left_group = VGroup(left_box, left_text).shift(LEFT * 3 + UP * 0.6)

        right_box = RoundedRectangle(
            corner_radius=0.18,
            width=4.1,
            height=1.5,
            stroke_color=TEAL_3B1B,
            fill_color=TEAL_3B1B,
            fill_opacity=0.14,
        )
        right_text = VGroup(
            Text("Group 2 mean", font_size=26, weight=BOLD),
            Text("same value", font_size=24, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.12).move_to(right_box.get_center())
        right_group = VGroup(right_box, right_text).shift(RIGHT * 3 + UP * 0.6)

        self.play(FadeIn(left_group, shift=RIGHT * 0.2), FadeIn(right_group, shift=LEFT * 0.2), run_time=1.0)
        self.wait(0.7)

        down_arrow = Arrow(start=UP * 0.5, end=DOWN * 1.0, buff=0.1, color=YELLOW_3B1B).move_to(DOWN * 0.15)
        diff_text = Text("Difference in means", font_size=28, color=WHITE, weight=BOLD).next_to(down_arrow, DOWN, buff=0.2)
        self.play(GrowArrow(down_arrow), FadeIn(diff_text, shift=UP * 0.2), run_time=0.9)
        self.wait(0.6)

        equation_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.6,
            height=1.7,
            stroke_color=GREEN_3B1B,
            fill_color=GREEN_3B1B,
            fill_opacity=0.12,
        ).shift(DOWN * 2.0)
        equation = VGroup(
            Text("μ₁ − μ₂", font_size=34, color=BLUE_3B1B, weight=BOLD),
            Text("=", font_size=32),
            Text("0", font_size=40, color=YELLOW_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=0.2).move_to(equation_box.get_center())
        self.play(FadeIn(equation_box, shift=UP * 0.2), Write(equation), run_time=1.0)
        self.wait(0.8)

        note = Text("Equal population means use 0 as the benchmark", font_size=24, color=PINK_3B1B)
        note.next_to(equation_box, DOWN, buff=0.35)
        self.play(Write(note), run_time=0.8)
        self.wait(2.4)
