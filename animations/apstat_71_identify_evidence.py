"""
Show that the observed difference in sample means is the evidence.

Run with: manim -qm --format=mp4 animations/apstat_71_identify_evidence.py MeanDiffIdentifyEvidence
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffIdentifyEvidence(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Evidence in a Randomized Study", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        null_box = RoundedRectangle(corner_radius=0.18, width=5.7, height=1.6, stroke_color=BLUE_3B1B, stroke_width=4)
        null_box.set_fill(BLUE_3B1B, opacity=0.12)
        null_box.shift(LEFT * 3.1 + UP * 0.6)
        null_line_1 = Text("If no effect:", font_size=28, color=BLUE_3B1B, weight=BOLD)
        null_line_2 = Text("expected x̄1 - x̄2 = 0", font_size=28)
        null_text = VGroup(null_line_1, null_line_2).arrange(DOWN, buff=0.18).move_to(null_box.get_center())

        obs_box = RoundedRectangle(corner_radius=0.18, width=5.9, height=1.8, stroke_color=YELLOW_3B1B, stroke_width=4)
        obs_box.set_fill(YELLOW_3B1B, opacity=0.12)
        obs_box.shift(RIGHT * 3.1 + UP * 0.55)
        obs_line_1 = Text("Observed in the study:", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        obs_line_2 = Text("22.04 - 9.55 = 12.49", font_size=30, weight=BOLD)
        obs_text = VGroup(obs_line_1, obs_line_2).arrange(DOWN, buff=0.18).move_to(obs_box.get_center())

        arrow = Arrow(null_box.get_right() + RIGHT * 0.15, obs_box.get_left() + LEFT * 0.15, buff=0.15, color=TEAL_3B1B, stroke_width=6)
        arrow_label = Text("compare", font_size=24, color=TEAL_3B1B).next_to(arrow, UP, buff=0.12)

        footer = Text("The observed difference is the evidence.", font_size=30, color=GREEN_3B1B, weight=BOLD)
        footer.shift(DOWN * 2.2)

        self.play(Write(title), run_time=0.8)
        self.play(Create(null_box), Write(null_text), run_time=0.9)
        self.play(Create(obs_box), Write(obs_text), run_time=0.9)
        self.play(GrowArrow(arrow), Write(arrow_label), run_time=0.7)
        self.play(Write(footer), run_time=0.8)
        self.wait(1.8)
