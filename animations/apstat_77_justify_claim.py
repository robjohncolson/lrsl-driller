"""
Justify a Claim with the Interval (AP Stats Unit 7, Topic 7.7)

Run with: manim -qm --format=mp4 apstat_77_justify_claim.py MeanDiffCIJustifyClaim
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIJustifyClaim(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Justify the Claim", font_size=42, weight=BOLD)
        subtitle = Text("Use 0 as the no-difference value", font_size=26, color=TEAL_3B1B)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.5)

        claim_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.6,
            height=1.4,
            stroke_color=BLUE_3B1B,
            fill_color=BLUE_3B1B,
            fill_opacity=0.12,
        ).shift(UP * 1.9)
        claim_text = Text("If means are equal, then μ₁ − μ₂ = 0", font_size=28, color=WHITE, weight=BOLD).move_to(claim_box.get_center())
        self.play(FadeIn(claim_box, shift=UP * 0.2), Write(claim_text), run_time=1.0)
        self.wait(0.7)

        axis = Line(LEFT * 4.6, RIGHT * 4.6, color=GRAY_B)
        zero_dot = Dot(axis.get_center(), color=YELLOW_3B1B, radius=0.09)
        zero_label = Text("0", font_size=24, color=YELLOW_3B1B).next_to(zero_dot, DOWN, buff=0.22)
        interval = Line(RIGHT * 1.2, RIGHT * 3.9, color=GREEN_3B1B, stroke_width=10).move_to(axis)
        interval_label = Text("(7.956, 12.129)", font_size=28, color=WHITE).next_to(axis, UP, buff=0.2)

        self.play(Create(axis), FadeIn(zero_dot), Write(zero_label), run_time=0.8)
        self.play(FadeIn(interval), Write(interval_label), run_time=0.9)
        self.wait(0.7)

        not_plausible = Text("0 is not plausible", font_size=30, color=PINK_3B1B, weight=BOLD).next_to(axis, DOWN, buff=0.5)
        arrow = Arrow(start=not_plausible.get_bottom() + DOWN * 0.1, end=not_plausible.get_bottom() + DOWN * 1.0, buff=0.1, color=YELLOW_3B1B)
        conclusion = Text("Support the claim: females are larger on average", font_size=28, color=GREEN_3B1B, weight=BOLD).next_to(arrow, DOWN, buff=0.2)

        self.play(Write(not_plausible), run_time=0.8)
        self.play(GrowArrow(arrow), FadeIn(conclusion, shift=UP * 0.2), run_time=0.9)
        self.wait(2.8)
