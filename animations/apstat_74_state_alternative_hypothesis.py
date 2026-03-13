"""
Visualize how the alternative hypothesis changes with the research question.

Run with: manim -qm --format=mp4 animations/apstat_74_state_alternative_hypothesis.py MeanTestAlternativeHypothesis
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanTestAlternativeHypothesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Alternative Hypothesis Matches the Question", font_size=34, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        header = Text("Hₐ uses a strict inequality", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        header.shift(UP * 2.0)

        left_box = RoundedRectangle(corner_radius=0.2, width=3.9, height=2.4, stroke_color=BLUE_3B1B, stroke_width=4)
        left_box.set_fill(BLUE_3B1B, opacity=0.12)
        left_box.shift(LEFT * 4.2 + DOWN * 0.2)
        left_q = Text("Differs from 15?", font_size=24, color=BLUE_3B1B, weight=BOLD)
        left_q.move_to(left_box.get_center() + UP * 0.5)
        left_a = Text("Hₐ: μ ≠ 15", font_size=28, weight=BOLD)
        left_a.move_to(left_box.get_center() + DOWN * 0.35)

        mid_box = RoundedRectangle(corner_radius=0.2, width=3.9, height=2.4, stroke_color=TEAL_3B1B, stroke_width=4)
        mid_box.set_fill(TEAL_3B1B, opacity=0.12)
        mid_box.shift(DOWN * 0.2)
        mid_q = Text("More than 40,000?", font_size=24, color=TEAL_3B1B, weight=BOLD)
        mid_q.move_to(mid_box.get_center() + UP * 0.5)
        mid_a = Text("Hₐ: μ > 40,000", font_size=28, weight=BOLD)
        mid_a.move_to(mid_box.get_center() + DOWN * 0.35)

        right_box = RoundedRectangle(corner_radius=0.2, width=3.9, height=2.4, stroke_color=GREEN_3B1B, stroke_width=4)
        right_box.set_fill(GREEN_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 4.2 + DOWN * 0.2)
        right_q = Text("Less than 14?", font_size=24, color=GREEN_3B1B, weight=BOLD)
        right_q.move_to(right_box.get_center() + UP * 0.5)
        right_a = Text("Hₐ: μ < 14", font_size=28, weight=BOLD)
        right_a.move_to(right_box.get_center() + DOWN * 0.35)

        footer = Text("State the direction before collecting data", font_size=24, color=PINK_3B1B, weight=BOLD)
        footer.to_edge(DOWN, buff=0.5)

        self.play(Write(title), run_time=0.8)
        self.play(Write(header), run_time=0.7)
        self.play(Create(left_box), Write(left_q), Write(left_a), run_time=0.9)
        self.play(Create(mid_box), Write(mid_q), Write(mid_a), run_time=0.9)
        self.play(Create(right_box), Write(right_q), Write(right_a), run_time=0.9)
        self.play(Write(footer), run_time=0.8)
        self.wait(1.8)
