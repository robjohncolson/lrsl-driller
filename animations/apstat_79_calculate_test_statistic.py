"""
Compute the two-sample t statistic for a test about a difference in means.

Render:
manim -qm --format=mp4 animations/apstat_79_calculate_test_statistic.py MeanDiffTestStatistic
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestStatistic(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Two-Sample Test Statistic", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Standardize the observed difference in sample means",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.7,
            height=1.5,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(BLUE_3B1B, opacity=0.12)
        formula_box.shift(UP * 1.0)

        formula = Text(
            "t = ((x-bar1 - x-bar2) - 0) / SE",
            font_size=31,
            weight=BOLD,
            color=BLUE_3B1B,
        )
        formula.move_to(formula_box.get_center())

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.8,
            height=2.4,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(TEAL_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.1 + DOWN * 1.1)
        left_text = VGroup(
            Text("Numerator", font_size=24, color=TEAL_3B1B, weight=BOLD),
            Text("x-bar1 - x-bar2", font_size=28, weight=BOLD),
            Text("then subtract the null value 0", font_size=20),
        ).arrange(DOWN, buff=0.15).move_to(left_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.8,
            height=2.4,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(GREEN_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.1 + DOWN * 1.1)
        right_text = VGroup(
            Text("Denominator", font_size=24, color=GREEN_3B1B, weight=BOLD),
            Text("SE", font_size=30, weight=BOLD),
            Text("sqrt((s1^2 / n1) + (s2^2 / n2))", font_size=18),
        ).arrange(DOWN, buff=0.15).move_to(right_box.get_center())

        join_arrow = DoubleArrow(
            left_box.get_right() + RIGHT * 0.15,
            right_box.get_left() + LEFT * 0.15,
            color=YELLOW_3B1B,
            stroke_width=6,
            buff=0.05,
        )

        final_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.8,
            height=1.7,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        final_box.set_fill(PINK_3B1B, opacity=0.12)
        final_box.shift(DOWN * 3.0)
        final_text = VGroup(
            Text("Large positive t", font_size=24, color=PINK_3B1B, weight=BOLD),
            Text("group 1 looks above group 2 relative to the noise", font_size=22),
        ).arrange(DOWN, buff=0.12).move_to(final_box.get_center())

        zero_highlight = SurroundingRectangle(
            Text("- 0", font_size=30),
            color=YELLOW_3B1B,
            buff=0.12,
            corner_radius=0.12,
        )
        zero_highlight.move_to(formula_box.get_center() + LEFT * 0.25)

        se_highlight = SurroundingRectangle(
            Text("SE", font_size=30),
            color=GREEN_3B1B,
            buff=0.18,
            corner_radius=0.12,
        )
        se_highlight.move_to(formula_box.get_center() + RIGHT * 3.45)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.6)
        self.play(DrawBorderThenFill(formula_box), Write(formula))
        self.wait(0.8)
        self.play(FadeIn(left_box, shift=UP * 0.2), Write(left_text))
        self.wait(0.7)
        self.play(FadeIn(right_box, shift=UP * 0.2), Write(right_text))
        self.play(GrowArrow(join_arrow))
        self.wait(0.7)
        self.play(Create(zero_highlight))
        self.wait(0.8)
        self.play(ReplacementTransform(zero_highlight, se_highlight))
        self.wait(0.8)
        self.play(FadeIn(final_box, shift=UP * 0.2), Write(final_text))
        self.wait(2)
