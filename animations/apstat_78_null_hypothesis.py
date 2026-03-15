"""
Null hypothesis for a difference in means uses zero.

Render:
manim -qm --format=mp4 animations/apstat_78_null_hypothesis.py MeanDiffTestNullHypothesis
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestNullHypothesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text(
            "Null Hypothesis: No Difference Means 0",
            font_size=34,
            weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "For a mean difference test, the benchmark is zero",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.2,
            height=2.0,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(BLUE_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.3 + UP * 0.7)
        left_label = VGroup(
            Text("Population 1", font_size=24, color=BLUE_3B1B, weight=BOLD),
            Text("mean = same level", font_size=24),
        ).arrange(DOWN, buff=0.18).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.2,
            height=2.0,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(TEAL_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.3 + UP * 0.7)
        right_label = VGroup(
            Text("Population 2", font_size=24, color=TEAL_3B1B, weight=BOLD),
            Text("mean = same level", font_size=24),
        ).arrange(DOWN, buff=0.18).move_to(right_box.get_center())

        compare_arrow = Arrow(
            left_box.get_right() + RIGHT * 0.15,
            right_box.get_left() + LEFT * 0.15,
            buff=0.05,
            color=YELLOW_3B1B,
            stroke_width=6,
        )
        compare_text = Text(
            "compare the two population means",
            font_size=22,
            color=YELLOW_3B1B,
            weight=BOLD,
        )
        compare_text.next_to(compare_arrow, UP, buff=0.15)

        meaning_text = Text(
            "If they are equal, the difference is no gap at all",
            font_size=24,
            color=WHITE,
        )
        meaning_text.shift(DOWN * 0.8)

        equation_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.8,
            height=1.9,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        equation_box.set_fill(GREEN_3B1B, opacity=0.12)
        equation_box.shift(DOWN * 2.15)

        null_title = Text("Null hypothesis", font_size=24, color=GREEN_3B1B, weight=BOLD)
        null_title.move_to(equation_box.get_center() + UP * 0.4)

        null_equation = Text("H0: mu1 - mu2 = 0", font_size=32, weight=BOLD)
        null_equation.move_to(equation_box.get_center() + DOWN * 0.2)

        zero_focus = SurroundingRectangle(
            Text("0", font_size=32),
            corner_radius=0.12,
            color=YELLOW_3B1B,
            buff=0.15,
        )
        zero_focus.move_to(null_equation.get_right() + LEFT * 0.45)

        takeaway = Text(
            "No difference in means becomes a difference of zero",
            font_size=24,
            color=PINK_3B1B,
            weight=BOLD,
        )
        takeaway.to_edge(DOWN, buff=0.45)

        self.play(Write(title), run_time=1.0)
        self.play(FadeIn(subtitle, shift=UP * 0.2), run_time=0.9)
        self.wait(0.8)

        self.play(Create(left_box), Write(left_label), run_time=1.1)
        self.play(Create(right_box), Write(right_label), run_time=1.1)
        self.wait(1.0)

        self.play(GrowArrow(compare_arrow), Write(compare_text), run_time=1.0)
        self.wait(0.8)

        self.play(Write(meaning_text), run_time=0.9)
        self.wait(1.0)

        self.play(Create(equation_box), Write(null_title), run_time=1.0)
        self.play(Write(null_equation), run_time=1.1)
        self.wait(1.0)

        self.play(Create(zero_focus), run_time=0.9)
        self.wait(1.1)

        self.play(Write(takeaway), run_time=0.9)
        self.wait(3.0)
