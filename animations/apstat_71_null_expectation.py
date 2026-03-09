"""
Show that the expected difference is 0 when there is no treatment effect.

Run with: manim -qm --format=mp4 animations/apstat_71_null_expectation.py MeanDiffNullExpectation
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffNullExpectation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("No Effect Means Center at 0", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        premise = Text("If the wording makes no difference,", font_size=30, color=BLUE_3B1B)
        premise.shift(UP * 1.4)

        left_box = RoundedRectangle(corner_radius=0.18, width=3.2, height=1.4, stroke_color=TEAL_3B1B, stroke_width=4)
        left_box.set_fill(TEAL_3B1B, opacity=0.12)
        left_box.shift(LEFT * 2.5)
        left_text = Text("Group 1 mean", font_size=28).move_to(left_box.get_center())

        right_box = RoundedRectangle(corner_radius=0.18, width=3.2, height=1.4, stroke_color=TEAL_3B1B, stroke_width=4)
        right_box.set_fill(TEAL_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 2.5)
        right_text = Text("Group 2 mean", font_size=28).move_to(right_box.get_center())

        equal_text = Text("should be about the same", font_size=28, color=YELLOW_3B1B)
        equal_text.shift(DOWN * 0.75)

        result_box = RoundedRectangle(corner_radius=0.2, width=7.2, height=1.7, stroke_color=GREEN_3B1B, stroke_width=4)
        result_box.set_fill(GREEN_3B1B, opacity=0.12)
        result_box.shift(DOWN * 2.1)
        result_line_1 = Text("So the difference centers at", font_size=30)
        result_line_2 = Text("x̄1 - x̄2 = 0", font_size=34, color=GREEN_3B1B, weight=BOLD)
        result_text = VGroup(result_line_1, result_line_2).arrange(DOWN, buff=0.18).move_to(result_box.get_center())

        self.play(Write(title), run_time=0.8)
        self.play(Write(premise), run_time=0.7)
        self.play(Create(left_box), Write(left_text), Create(right_box), Write(right_text), run_time=0.9)
        self.play(Write(equal_text), run_time=0.7)
        self.play(Create(result_box), Write(result_text), run_time=0.9)
        self.wait(1.8)
