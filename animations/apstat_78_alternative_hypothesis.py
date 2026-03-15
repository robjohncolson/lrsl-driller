"""
Alternative hypotheses use strict inequalities that match the claim.

Render:
manim -qm --format=mp4 animations/apstat_78_alternative_hypothesis.py MeanDiffTestAlternativeHypothesis
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestAlternativeHypothesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text(
            "Alternative Hypothesis Uses a Strict Symbol",
            font_size=34,
            weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)

        banner = RoundedRectangle(
            corner_radius=0.18,
            width=8.6,
            height=1.0,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        banner.set_fill(YELLOW_3B1B, opacity=0.12)
        banner.shift(UP * 2.05)
        banner_text = Text(
            "Ha never uses equals; it matches the wording of the claim",
            font_size=24,
            color=YELLOW_3B1B,
            weight=BOLD,
        )
        banner_text.move_to(banner.get_center())

        left_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.9,
            height=2.6,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        left_box.set_fill(BLUE_3B1B, opacity=0.12)
        left_box.shift(LEFT * 4.2 + DOWN * 0.25)
        left_text = VGroup(
            Text("Question:", font_size=22, color=BLUE_3B1B, weight=BOLD),
            Text("Is there any difference?", font_size=22),
            Text("Ha: mu1 - mu2 != 0", font_size=26, weight=BOLD),
        ).arrange(DOWN, buff=0.2).move_to(left_box.get_center())

        mid_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.9,
            height=2.6,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        mid_box.set_fill(TEAL_3B1B, opacity=0.12)
        mid_box.shift(DOWN * 0.25)
        mid_text = VGroup(
            Text("Question:", font_size=22, color=TEAL_3B1B, weight=BOLD),
            Text("Is mean 1 greater?", font_size=22),
            Text("Ha: mu1 - mu2 > 0", font_size=26, weight=BOLD),
        ).arrange(DOWN, buff=0.2).move_to(mid_box.get_center())

        right_box = RoundedRectangle(
            corner_radius=0.2,
            width=3.9,
            height=2.6,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        right_box.set_fill(GREEN_3B1B, opacity=0.12)
        right_box.shift(RIGHT * 4.2 + DOWN * 0.25)
        right_text = VGroup(
            Text("Question:", font_size=22, color=GREEN_3B1B, weight=BOLD),
            Text("Is mean 1 smaller?", font_size=22),
            Text("Ha: mu1 - mu2 < 0", font_size=26, weight=BOLD),
        ).arrange(DOWN, buff=0.2).move_to(right_box.get_center())

        strict_note = Text(
            "Different -> !=    Greater -> >    Less -> <",
            font_size=24,
            color=PINK_3B1B,
            weight=BOLD,
        )
        strict_note.to_edge(DOWN, buff=0.5)

        left_highlight = SurroundingRectangle(left_text[2], color=YELLOW_3B1B, buff=0.16)
        mid_highlight = SurroundingRectangle(mid_text[2], color=YELLOW_3B1B, buff=0.16)
        right_highlight = SurroundingRectangle(right_text[2], color=YELLOW_3B1B, buff=0.16)

        self.play(Write(title), run_time=1.0)
        self.play(Create(banner), Write(banner_text), run_time=1.0)
        self.wait(0.8)

        self.play(Create(left_box), Write(left_text), run_time=1.1)
        self.wait(0.7)
        self.play(Create(left_highlight), run_time=0.7)
        self.wait(0.7)

        self.play(Create(mid_box), Write(mid_text), run_time=1.1)
        self.wait(0.7)
        self.play(Create(mid_highlight), run_time=0.7)
        self.wait(0.7)

        self.play(Create(right_box), Write(right_text), run_time=1.1)
        self.wait(0.7)
        self.play(Create(right_highlight), run_time=0.7)
        self.wait(0.9)

        self.play(Write(strict_note), run_time=0.9)
        self.wait(3.0)
