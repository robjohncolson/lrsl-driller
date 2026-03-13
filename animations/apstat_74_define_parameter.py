"""
Visualize that μ represents the population mean, not a sample statistic or an individual value.

Run with: manim -qm --format=mp4 animations/apstat_74_define_parameter.py MeanTestDefineParameter
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanTestDefineParameter(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Define μ in Context", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        left_box = RoundedRectangle(corner_radius=0.2, width=4.5, height=3.0, stroke_color=BLUE_3B1B, stroke_width=4)
        left_box.set_fill(BLUE_3B1B, opacity=0.12)
        left_box.shift(LEFT * 3.3 + DOWN * 0.25)
        left_title = Text("Sample Facts", font_size=28, color=BLUE_3B1B, weight=BOLD)
        left_title.move_to(left_box.get_center() + UP * 0.95)
        left_line_1 = Text("20 students sampled", font_size=24)
        left_line_1.move_to(left_box.get_center() + UP * 0.25)
        left_line_2 = Text("x̄ is the sample mean", font_size=24, color=PINK_3B1B)
        left_line_2.move_to(left_box.get_center() + DOWN * 0.35)
        left_line_3 = Text("One jump is one observation", font_size=22, color=PINK_3B1B)
        left_line_3.move_to(left_box.get_center() + DOWN * 0.95)

        right_box = RoundedRectangle(corner_radius=0.2, width=5.3, height=3.0, stroke_color=GREEN_3B1B, stroke_width=4)
        right_box.set_fill(GREEN_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 2.8 + DOWN * 0.25)
        right_title = Text("Parameter", font_size=28, color=GREEN_3B1B, weight=BOLD)
        right_title.move_to(right_box.get_center() + UP * 0.95)
        right_line_1 = Text("μ = mean vertical jump", font_size=28, weight=BOLD)
        right_line_1.move_to(right_box.get_center() + UP * 0.2)
        right_line_2 = Text("for all students at the school", font_size=24)
        right_line_2.move_to(right_box.get_center() + DOWN * 0.45)

        arrow = Arrow(left_box.get_right() + RIGHT * 0.12, right_box.get_left() + LEFT * 0.12, color=TEAL_3B1B, buff=0.1, stroke_width=6)
        arrow_label = Text("sample informs the population mean", font_size=22, color=TEAL_3B1B, weight=BOLD)
        arrow_label.next_to(arrow, UP, buff=0.12)

        takeaway = Text("Always define μ for the whole population in context", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        takeaway.to_edge(DOWN, buff=0.45)

        self.play(Write(title), run_time=0.8)
        self.play(Create(left_box), Write(left_title), Write(left_line_1), Write(left_line_2), Write(left_line_3), run_time=1.0)
        self.play(GrowArrow(arrow), Write(arrow_label), run_time=0.8)
        self.play(Create(right_box), Write(right_title), Write(right_line_1), Write(right_line_2), run_time=0.9)
        self.play(Write(takeaway), run_time=0.8)
        self.wait(1.8)
