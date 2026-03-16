"""
Show how the largest contribution supports a contextual claim in a chi-square GOF setting.

Render:
manim -qm --format=mp4 animations/apstat_83_explain_contribution_context.py ChiSquareContributionContext
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ChiSquareContributionContext(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Use the Largest Contribution", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "The category farthest below or above expected helps explain the real pattern",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.7,
            height=4.2,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(BLUE_3B1B, opacity=0.08)
        left_box.shift(LEFT * 3.0 + DOWN * 0.25)
        left_title = Text("High-income bracket", font_size=28, color=BLUE_3B1B, weight=BOLD)
        left_title.move_to(left_box.get_top() + DOWN * 0.42)

        expected_bar = Rectangle(width=0.9, height=2.1, stroke_color=TEAL_3B1B, stroke_width=4)
        expected_bar.set_fill(TEAL_3B1B, opacity=0.18)
        expected_bar.move_to(left_box.get_center() + LEFT * 0.85 + DOWN * 0.3)
        observed_bar = Rectangle(width=0.9, height=0.62, stroke_color=PINK_3B1B, stroke_width=4)
        observed_bar.set_fill(PINK_3B1B, opacity=0.35)
        observed_bar.move_to(left_box.get_center() + RIGHT * 0.85 + DOWN * 1.04)

        expected_label = Text("Expected\n10.24", font_size=24, color=TEAL_3B1B, line_spacing=0.9)
        expected_label.next_to(expected_bar, DOWN, buff=0.18)
        observed_label = Text("Observed\n3", font_size=24, color=PINK_3B1B, line_spacing=0.9)
        observed_label.next_to(observed_bar, DOWN, buff=0.18)

        gap_arrow = DoubleArrow(
            observed_bar.get_top() + RIGHT * 0.65,
            expected_bar.get_top() + RIGHT * 0.65,
            color=YELLOW_3B1B,
            stroke_width=5,
            buff=0.05,
        )
        gap_text = Text("Big shortfall", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        gap_text.next_to(gap_arrow, RIGHT, buff=0.2)

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.2,
            height=4.2,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(GREEN_3B1B, opacity=0.08)
        right_box.shift(RIGHT * 3.1 + DOWN * 0.25)
        right_title = Text("What that suggests", font_size=28, color=GREEN_3B1B, weight=BOLD)
        right_title.move_to(right_box.get_top() + DOWN * 0.42)

        reasoning = Text(
            "Far fewer businesses than\nexpected appear in the\nhighest income regions",
            font_size=25,
            color=WHITE,
            line_spacing=0.9,
        )
        reasoning.move_to(right_box.get_center() + UP * 0.55)

        conclusion = Text(
            "So the businesses are\nconcentrated more in\nlower-income regions",
            font_size=27,
            color=GREEN_3B1B,
            weight=BOLD,
            line_spacing=0.9,
        )
        conclusion.move_to(right_box.get_center() + DOWN * 1.0)

        bridge = Arrow(
            left_box.get_right() + RIGHT * 0.08,
            right_box.get_left() + LEFT * 0.08,
            buff=0.2,
            color=YELLOW_3B1B,
            stroke_width=5,
        )

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.2)
        self.play(DrawBorderThenFill(left_box), Write(left_title), run_time=1.0)
        self.play(GrowFromEdge(expected_bar, DOWN), GrowFromEdge(observed_bar, DOWN), run_time=1.4)
        self.play(FadeIn(expected_label), FadeIn(observed_label), run_time=0.8)
        self.play(GrowArrow(gap_arrow), Write(gap_text), run_time=1.1)
        self.play(GrowArrow(bridge), DrawBorderThenFill(right_box), Write(right_title), run_time=1.3)
        self.play(Write(reasoning), run_time=1.2)
        self.play(Write(conclusion), run_time=1.2)
        self.wait(1.8)
