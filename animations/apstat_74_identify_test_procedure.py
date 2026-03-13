"""
Visualize how to identify a one-sample t-test for a population mean.

Run with: manim -qm --format=mp4 animations/apstat_74_identify_test_procedure.py MeanTestProcedure
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanTestProcedure(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Identify the Test Procedure", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        box_1 = RoundedRectangle(corner_radius=0.2, width=3.2, height=1.5, stroke_color=BLUE_3B1B, stroke_width=4)
        box_1.set_fill(BLUE_3B1B, opacity=0.12)
        box_1.shift(LEFT * 4.3 + DOWN * 0.1)
        text_1 = Text("One sample", font_size=28, color=BLUE_3B1B, weight=BOLD)
        text_1.move_to(box_1.get_center())

        box_2 = RoundedRectangle(corner_radius=0.2, width=3.2, height=1.5, stroke_color=TEAL_3B1B, stroke_width=4)
        box_2.set_fill(TEAL_3B1B, opacity=0.12)
        box_2.shift(LEFT * 0.5 + DOWN * 0.1)
        text_2 = Text("Quantitative data", font_size=28, color=TEAL_3B1B, weight=BOLD)
        text_2.move_to(box_2.get_center())

        box_3 = RoundedRectangle(corner_radius=0.2, width=4.0, height=1.5, stroke_color=YELLOW_3B1B, stroke_width=4)
        box_3.set_fill(YELLOW_3B1B, opacity=0.12)
        box_3.shift(RIGHT * 4.0 + DOWN * 0.1)
        text_3 = Text("Testing a claim about μ", font_size=26, color=YELLOW_3B1B, weight=BOLD)
        text_3.move_to(box_3.get_center())

        arrow_1 = Arrow(box_1.get_bottom(), DOWN * 1.25 + LEFT * 4.3, color=GREEN_3B1B, buff=0.1, stroke_width=6)
        arrow_2 = Arrow(box_2.get_bottom(), DOWN * 1.25 + LEFT * 0.5, color=GREEN_3B1B, buff=0.1, stroke_width=6)
        arrow_3 = Arrow(box_3.get_bottom(), DOWN * 1.25 + RIGHT * 4.0, color=GREEN_3B1B, buff=0.1, stroke_width=6)

        result_box = RoundedRectangle(corner_radius=0.2, width=8.6, height=1.8, stroke_color=PINK_3B1B, stroke_width=4)
        result_box.set_fill(PINK_3B1B, opacity=0.12)
        result_box.shift(DOWN * 2.35)
        result_text = Text("Use a one-sample t-test for a population mean", font_size=30, color=PINK_3B1B, weight=BOLD)
        result_text.move_to(result_box.get_center())

        self.play(Write(title), run_time=0.8)
        self.play(Create(box_1), Write(text_1), run_time=0.8)
        self.play(Create(box_2), Write(text_2), run_time=0.8)
        self.play(Create(box_3), Write(text_3), run_time=0.8)
        self.play(GrowArrow(arrow_1), GrowArrow(arrow_2), GrowArrow(arrow_3), run_time=0.9)
        self.play(Create(result_box), Write(result_text), run_time=0.9)
        self.wait(1.8)
