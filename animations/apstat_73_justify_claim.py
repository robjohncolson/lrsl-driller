"""
Visualize how to justify a claim about a population mean from a confidence interval.

Run with: manim -qm --format=mp4 animations/apstat_73_justify_claim.py MeanCIJustifyClaim
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIJustifyClaim(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Use the Interval to Judge a Claim", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        claim_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.8,
            height=1.3,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        claim_box.set_fill(BLUE_3B1B, opacity=0.12)
        claim_box.shift(UP * 1.35)
        claim_text = Text("Claim to check: mean bag weight is less than 907 g", font_size=26, color=BLUE_3B1B, weight=BOLD)
        claim_text.move_to(claim_box.get_center())

        baseline = Line(LEFT * 4.4, RIGHT * 4.4, color=WHITE, stroke_width=5)
        baseline.shift(DOWN * 0.1)

        interval = Line(LEFT * 2.5, RIGHT * 2.7, color=YELLOW_3B1B, stroke_width=18)
        interval.shift(DOWN * 0.1)
        left_tick = Line(UP * 0.25, DOWN * 0.25, color=YELLOW_3B1B, stroke_width=6).move_to(interval.get_start())
        right_tick = Line(UP * 0.25, DOWN * 0.25, color=YELLOW_3B1B, stroke_width=6).move_to(interval.get_end())

        left_label = Text("900.92", font_size=24, color=YELLOW_3B1B).next_to(left_tick, DOWN, buff=0.2)
        right_label = Text("912.68", font_size=24, color=YELLOW_3B1B).next_to(right_tick, DOWN, buff=0.2)

        claim_tick = Line(UP * 0.45, DOWN * 0.45, color=TEAL_3B1B, stroke_width=6)
        claim_tick.move_to(interval.point_from_proportion(0.52))
        claim_label = Text("907", font_size=28, color=TEAL_3B1B, weight=BOLD).next_to(claim_tick, UP, buff=0.15)

        reason_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.8,
            height=1.9,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        reason_box.set_fill(GREEN_3B1B, opacity=0.12)
        reason_box.shift(DOWN * 2.2)
        reason_line_1 = Text("907 is inside the interval", font_size=30, color=GREEN_3B1B, weight=BOLD)
        reason_line_1.move_to(reason_box.get_center() + UP * 0.32)
        reason_line_2 = Text("So 907 grams is still plausible for μ", font_size=26)
        reason_line_2.move_to(reason_box.get_center() + DOWN * 0.28)

        conclusion = Text("Conclusion: not convincing evidence of underfilling", font_size=28, color=PINK_3B1B, weight=BOLD)
        conclusion.to_edge(DOWN, buff=0.45)

        self.play(Write(title), run_time=0.8)
        self.play(Create(claim_box), Write(claim_text), run_time=0.9)
        self.play(Create(baseline), run_time=0.5)
        self.play(Create(interval), Create(left_tick), Create(right_tick), run_time=0.9)
        self.play(Write(left_label), Write(right_label), run_time=0.6)
        self.play(Create(claim_tick), Write(claim_label), run_time=0.7)
        self.wait(0.3)
        self.play(Create(reason_box), Write(reason_line_1), Write(reason_line_2), run_time=1.0)
        self.play(Write(conclusion), run_time=0.8)
        self.wait(1.8)
