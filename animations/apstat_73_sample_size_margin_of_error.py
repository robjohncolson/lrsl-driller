"""
Visualize how increasing sample size changes the margin of error for a mean interval.

Run with: manim -qm --format=mp4 animations/apstat_73_sample_size_margin_of_error.py MeanCISampleSizeMarginOfError
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCISampleSizeMarginOfError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Sample Size and Margin of Error", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.6,
            height=1.4,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(YELLOW_3B1B, opacity=0.12)
        formula_box.shift(UP * 1.45)
        formula = Text("ME = t* × s / √n", font_size=36, color=YELLOW_3B1B, weight=BOLD)
        formula.move_to(formula_box.get_center())

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.4,
            height=2.6,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(BLUE_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.1 + DOWN * 0.45)
        left_title = Text("Original", font_size=28, color=BLUE_3B1B, weight=BOLD)
        left_title.move_to(left_box.get_center() + UP * 0.72)
        left_line_1 = Text("n = 25", font_size=30)
        left_line_1.move_to(left_box.get_center() + UP * 0.15)
        left_line_2 = Text("ME = 8", font_size=30, color=WHITE)
        left_line_2.move_to(left_box.get_center() + DOWN * 0.45)

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.4,
            height=2.6,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(TEAL_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.1 + DOWN * 0.45)
        right_title = Text("Larger Sample", font_size=28, color=TEAL_3B1B, weight=BOLD)
        right_title.move_to(right_box.get_center() + UP * 0.72)
        right_line_1 = Text("n = 100", font_size=30)
        right_line_1.move_to(right_box.get_center() + UP * 0.15)
        right_line_2 = Text("ME = 4", font_size=30, color=WHITE)
        right_line_2.move_to(right_box.get_center() + DOWN * 0.45)

        arrow = Arrow(left_box.get_right() + RIGHT * 0.1, right_box.get_left() + LEFT * 0.1, color=GREEN_3B1B, buff=0.15, stroke_width=6)
        arrow_label = Text("quadruple n", font_size=24, color=GREEN_3B1B, weight=BOLD)
        arrow_label.next_to(arrow, UP, buff=0.15)

        takeaway = Text("1 / √n means 4 times the sample size cuts ME about in half", font_size=25, color=PINK_3B1B, weight=BOLD)
        takeaway.to_edge(DOWN, buff=0.5)

        self.play(Write(title), run_time=0.8)
        self.play(Create(formula_box), Write(formula), run_time=0.9)
        self.play(Create(left_box), Write(left_title), Write(left_line_1), Write(left_line_2), run_time=0.9)
        self.play(Create(right_box), Write(right_title), Write(right_line_1), Write(right_line_2), run_time=0.9)
        self.play(GrowArrow(arrow), Write(arrow_label), run_time=0.8)
        self.play(Write(takeaway), run_time=0.8)
        self.wait(1.8)
