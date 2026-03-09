"""
Visualize how to construct a confidence interval for a population mean from x̄ ± ME.

Run with: manim -qm --format=mp4 animations/apstat_72_construct_interval.py MeanCIConstructInterval
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIConstructInterval(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Construct the Interval", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.4,
            height=1.35,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(TEAL_3B1B, opacity=0.12)
        formula_box.shift(UP * 1.2)
        formula_text = Text("x̄ ± ME = 906.8 ± 5.88", font_size=34, color=TEAL_3B1B, weight=BOLD)
        formula_text.move_to(formula_box.get_center())

        line = Line(LEFT * 4.9 + DOWN * 0.45, RIGHT * 4.9 + DOWN * 0.45, color=WHITE, stroke_width=4)
        center_tick = Line(UP * 0.18 + DOWN * 0.45, DOWN * 0.18 + DOWN * 0.45, color=TEAL_3B1B, stroke_width=5)
        left_tick = Line(LEFT * 2.35 + UP * 0.18 + DOWN * 0.45, LEFT * 2.35 + DOWN * 0.18 + DOWN * 0.45, color=GREEN_3B1B, stroke_width=5)
        right_tick = Line(RIGHT * 2.35 + UP * 0.18 + DOWN * 0.45, RIGHT * 2.35 + DOWN * 0.18 + DOWN * 0.45, color=GREEN_3B1B, stroke_width=5)

        center_label = Text("906.8", font_size=26, color=TEAL_3B1B, weight=BOLD)
        center_label.next_to(center_tick, DOWN, buff=0.18)
        left_label = Text("900.92", font_size=26, color=GREEN_3B1B, weight=BOLD)
        left_label.next_to(left_tick, DOWN, buff=0.18)
        right_label = Text("912.68", font_size=26, color=GREEN_3B1B, weight=BOLD)
        right_label.next_to(right_tick, DOWN, buff=0.18)

        left_arrow = Arrow(center_tick.get_left() + DOWN * 0.65, left_tick.get_right() + DOWN * 0.65, buff=0.0, color=YELLOW_3B1B, stroke_width=5)
        right_arrow = Arrow(center_tick.get_right() + DOWN * 0.65, right_tick.get_left() + DOWN * 0.65, buff=0.0, color=YELLOW_3B1B, stroke_width=5)
        left_me = Text("-5.88", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        left_me.next_to(left_arrow, UP, buff=0.08)
        right_me = Text("+5.88", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        right_me.next_to(right_arrow, UP, buff=0.08)

        interval_bar = Line(LEFT * 2.35 + DOWN * 0.45, RIGHT * 2.35 + DOWN * 0.45, color=GREEN_3B1B, stroke_width=12)

        summary_box = RoundedRectangle(
            corner_radius=0.2,
            width=7.0,
            height=1.45,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        summary_box.set_fill(GREEN_3B1B, opacity=0.12)
        summary_box.to_edge(DOWN, buff=0.45)
        summary_text = Text("95% CI: 900.92 to 912.68", font_size=32, color=GREEN_3B1B, weight=BOLD)
        summary_text.move_to(summary_box.get_center())

        self.play(Write(title), run_time=0.8)
        self.play(Create(formula_box), Write(formula_text), run_time=0.9)
        self.wait(0.4)
        self.play(Create(line), run_time=0.6)
        self.play(Create(center_tick), Write(center_label), run_time=0.5)
        self.play(Create(left_arrow), Create(right_arrow), Write(left_me), Write(right_me), run_time=0.8)
        self.play(Create(interval_bar), Create(left_tick), Create(right_tick), Write(left_label), Write(right_label), run_time=0.9)
        self.wait(0.5)
        self.play(Create(summary_box), Write(summary_text), run_time=0.8)
        self.wait(1.8)
