"""
Visualize how to find t* for a confidence interval for a population mean.

Run with: manim -qm --format=mp4 animations/apstat_72_find_tstar.py MeanCITStar
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCITStar(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Find t*", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        step_1 = RoundedRectangle(corner_radius=0.18, width=3.7, height=1.4, stroke_color=BLUE_3B1B, stroke_width=4)
        step_1.set_fill(BLUE_3B1B, opacity=0.12)
        step_1.shift(LEFT * 4.0 + UP * 0.5)
        step_1_text = Text("Sample size\nn = 10", font_size=30, color=BLUE_3B1B, weight=BOLD).move_to(step_1.get_center())

        step_2 = RoundedRectangle(corner_radius=0.18, width=3.7, height=1.4, stroke_color=TEAL_3B1B, stroke_width=4)
        step_2.set_fill(TEAL_3B1B, opacity=0.12)
        step_2.move_to(ORIGIN + UP * 0.5)
        step_2_text = Text("Degrees of freedom\ndf = n - 1 = 9", font_size=28, color=TEAL_3B1B, weight=BOLD).move_to(step_2.get_center())

        step_3 = RoundedRectangle(corner_radius=0.18, width=4.0, height=1.4, stroke_color=YELLOW_3B1B, stroke_width=4)
        step_3.set_fill(YELLOW_3B1B, opacity=0.12)
        step_3.shift(RIGHT * 4.2 + UP * 0.5)
        step_3_text = Text("Confidence level\n95%", font_size=30, color=YELLOW_3B1B, weight=BOLD).move_to(step_3.get_center())

        arrow_1 = Arrow(step_1.get_right(), step_2.get_left(), buff=0.12, color=WHITE, stroke_width=5)
        arrow_2 = Arrow(step_3.get_left(), step_2.get_right(), buff=0.12, color=WHITE, stroke_width=5)

        curve = VMobject(color=PINK_3B1B, stroke_width=6)
        curve.set_points_smoothly([
            LEFT * 4.3 + DOWN * 1.45,
            LEFT * 2.6 + DOWN * 0.8,
            ORIGIN + DOWN * 0.2,
            RIGHT * 2.6 + DOWN * 0.8,
            RIGHT * 4.3 + DOWN * 1.45,
        ])

        mid_region = Polygon(
            LEFT * 2.15 + DOWN * 1.45,
            LEFT * 1.3 + DOWN * 0.88,
            LEFT * 0.2 + DOWN * 0.37,
            RIGHT * 0.2 + DOWN * 0.37,
            RIGHT * 1.3 + DOWN * 0.88,
            RIGHT * 2.15 + DOWN * 1.45,
            color=GREEN_3B1B,
            stroke_width=0,
        )
        mid_region.set_fill(GREEN_3B1B, opacity=0.24)

        center_text = Text("middle 95%", font_size=28, color=GREEN_3B1B, weight=BOLD)
        center_text.move_to(DOWN * 0.98)

        left_mark = Text("-2.262", font_size=24, color=WHITE)
        left_mark.move_to(LEFT * 2.25 + DOWN * 1.85)
        right_mark = Text("2.262", font_size=24, color=WHITE)
        right_mark.move_to(RIGHT * 2.2 + DOWN * 1.85)

        result_box = RoundedRectangle(corner_radius=0.18, width=4.6, height=1.15, stroke_color=GREEN_3B1B, stroke_width=5)
        result_box.set_fill(GREEN_3B1B, opacity=0.12)
        result_box.to_edge(DOWN, buff=0.45)
        result_text = Text("t* = 2.262", font_size=34, color=GREEN_3B1B, weight=BOLD).move_to(result_box.get_center())

        self.play(Write(title), run_time=0.8)
        self.play(Create(step_1), Write(step_1_text), run_time=0.7)
        self.play(Create(step_3), Write(step_3_text), run_time=0.7)
        self.play(Create(arrow_1), Create(arrow_2), Create(step_2), Write(step_2_text), run_time=0.8)
        self.wait(0.4)
        self.play(Create(curve), FadeIn(mid_region), Write(center_text), run_time=1.0)
        self.play(Write(left_mark), Write(right_mark), run_time=0.5)
        self.play(Create(result_box), Write(result_text), run_time=0.8)
        self.wait(1.8)
