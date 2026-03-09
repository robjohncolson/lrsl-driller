"""
Show the two explanations for an observed difference and highlight chance variation.

Run with: manim -qm --format=mp4 animations/apstat_71_chance_explanation.py MeanDiffChanceExplanation
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffChanceExplanation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Two Explanations", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        left_box = RoundedRectangle(corner_radius=0.2, width=5.8, height=3.2, stroke_color=BLUE_3B1B, stroke_width=4)
        left_box.set_fill(BLUE_3B1B, opacity=0.14)
        left_box.shift(LEFT * 3.25 + DOWN * 0.1)
        left_title = Text("Explanation 1", font_size=30, color=BLUE_3B1B, weight=BOLD)
        left_body = Text("No real effect.\nThe difference came from\nchance variation in\nrandom assignment.", font_size=26, line_spacing=0.8)
        left_group = VGroup(left_title, left_body).arrange(DOWN, buff=0.22).move_to(left_box.get_center())

        right_box = RoundedRectangle(corner_radius=0.2, width=5.8, height=3.2, stroke_color=PINK_3B1B, stroke_width=4)
        right_box.set_fill(PINK_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 3.25 + DOWN * 0.1)
        right_title = Text("Explanation 2", font_size=30, color=PINK_3B1B, weight=BOLD)
        right_body = Text("A real treatment effect\ncaused the means\nto be different.", font_size=26, line_spacing=0.85)
        right_group = VGroup(right_title, right_body).arrange(DOWN, buff=0.25).move_to(right_box.get_center())

        footer = Text("Simulation tests whether Explanation 1 is plausible.", font_size=28, color=YELLOW_3B1B)
        footer.shift(DOWN * 2.55)

        self.play(Write(title), run_time=0.8)
        self.play(Create(left_box), Write(left_group), run_time=1.0)
        self.play(Create(right_box), Write(right_group), run_time=1.0)
        self.play(left_box.animate.set_stroke(color=GREEN_3B1B, width=6), run_time=0.5)
        self.play(Write(footer), run_time=0.7)
        self.wait(1.8)
