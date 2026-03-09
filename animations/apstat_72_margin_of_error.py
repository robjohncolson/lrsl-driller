"""
Visualize the margin of error formula for a confidence interval for a population mean.

Run with: manim -qm --format=mp4 animations/apstat_72_margin_of_error.py MeanCIMarginOfError
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIMarginOfError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Margin of Error", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.7,
            height=1.5,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(YELLOW_3B1B, opacity=0.12)
        formula_box.shift(UP * 1.1)
        formula = Text("ME = t* × s / √n", font_size=38, color=YELLOW_3B1B, weight=BOLD)
        formula.move_to(formula_box.get_center())

        factor_1 = Text("t* sets the confidence level", font_size=26, color=PINK_3B1B)
        factor_1.move_to(LEFT * 4.0 + DOWN * 0.15)
        factor_2 = Text("s measures sample spread", font_size=26, color=BLUE_3B1B)
        factor_2.move_to(LEFT * 3.65 + DOWN * 0.8)
        factor_3 = Text("larger n makes ME smaller", font_size=26, color=TEAL_3B1B)
        factor_3.move_to(LEFT * 3.45 + DOWN * 1.45)

        example_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.8,
            height=2.4,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        example_box.set_fill(GREEN_3B1B, opacity=0.12)
        example_box.shift(RIGHT * 3.0 + DOWN * 0.55)
        example_title = Text("Powdered sugar example", font_size=26, color=GREEN_3B1B, weight=BOLD)
        example_title.move_to(example_box.get_center() + UP * 0.78)
        example_line_1 = Text("t* = 2.262   s = 8.22   n = 10", font_size=24)
        example_line_1.move_to(example_box.get_center() + UP * 0.12)
        example_line_2 = Text("ME = 2.262 × 8.22 / √10", font_size=24, color=WHITE)
        example_line_2.move_to(example_box.get_center() + DOWN * 0.45)
        example_line_3 = Text("ME = 5.88", font_size=30, color=GREEN_3B1B, weight=BOLD)
        example_line_3.move_to(example_box.get_center() + DOWN * 1.0)

        self.play(Write(title), run_time=0.8)
        self.play(Create(formula_box), Write(formula), run_time=0.9)
        self.wait(0.4)
        self.play(Write(factor_1), run_time=0.5)
        self.play(Write(factor_2), run_time=0.5)
        self.play(Write(factor_3), run_time=0.5)
        self.wait(0.3)
        self.play(Create(example_box), Write(example_title), run_time=0.7)
        self.play(Write(example_line_1), Write(example_line_2), run_time=0.9)
        self.play(Write(example_line_3), run_time=0.6)
        self.wait(1.8)
