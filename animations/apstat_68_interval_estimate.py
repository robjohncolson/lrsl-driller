"""
Interpret a confidence interval for the difference in two proportions in context.

Run with: manim -qm --format=mp4 animations/apstat_68_interval_estimate.py TwoPropIntervalEstimate
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoPropIntervalEstimate(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret the Interval Estimate", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        interval_box = RoundedRectangle(corner_radius=0.2, width=6.2, height=1.2, stroke_color=YELLOW_3B1B, stroke_width=4)
        interval_box.set_fill(YELLOW_3B1B, opacity=0.10)
        interval_box.shift(UP * 1.15)
        interval_text = Text("95% CI: (-0.291, -0.034)", font_size=32, color=YELLOW_3B1B, weight=BOLD)
        interval_text.move_to(interval_box.get_center())

        left_arrow = Arrow(interval_box.get_bottom() + LEFT * 1.35, LEFT * 3.6 + DOWN * 0.2, buff=0.15, color=BLUE_3B1B)
        right_arrow = Arrow(interval_box.get_bottom() + RIGHT * 1.35, RIGHT * 3.6 + DOWN * 0.2, buff=0.15, color=TEAL_3B1B)

        lower_box = RoundedRectangle(corner_radius=0.18, width=3.6, height=1.4, stroke_color=BLUE_3B1B, stroke_width=4)
        lower_box.set_fill(BLUE_3B1B, opacity=0.12)
        lower_box.move_to(LEFT * 3.6 + DOWN * 1.0)
        lower_text = Text("29.1 points lower", font_size=28, color=BLUE_3B1B, weight=BOLD)
        lower_text.move_to(lower_box.get_center())

        upper_box = RoundedRectangle(corner_radius=0.18, width=3.6, height=1.4, stroke_color=TEAL_3B1B, stroke_width=4)
        upper_box.set_fill(TEAL_3B1B, opacity=0.12)
        upper_box.move_to(RIGHT * 3.6 + DOWN * 1.0)
        upper_text = Text("3.4 points lower", font_size=28, color=TEAL_3B1B, weight=BOLD)
        upper_text.move_to(upper_box.get_center())

        statement = RoundedRectangle(corner_radius=0.2, width=11.0, height=1.75, stroke_color=GREEN_3B1B, stroke_width=4)
        statement.set_fill(GREEN_3B1B, opacity=0.10)
        statement.shift(DOWN * 2.6)
        statement_text = Text(
            "The new formula rate is between\n3.4 and 29.1 percentage points lower",
            font_size=28,
            color=GREEN_3B1B,
            weight=BOLD,
            line_spacing=0.82,
        )
        statement_text.move_to(statement.get_center())

        context = Text("Interpret p_new - p_old in context", font_size=24, color=PINK_3B1B, weight=BOLD)
        context.next_to(statement, DOWN, buff=0.3)

        self.play(Write(title))
        self.wait(0.3)
        self.play(Create(interval_box), Write(interval_text), run_time=0.8)
        self.wait(0.4)
        self.play(Create(left_arrow), Create(right_arrow), run_time=0.6)
        self.play(Create(lower_box), Write(lower_text), Create(upper_box), Write(upper_text), run_time=1.0)
        self.wait(0.6)
        self.play(Create(statement), Write(statement_text), run_time=1.0)
        self.play(FadeIn(context, shift=UP * 0.12), run_time=0.5)
        self.wait(2.5)
