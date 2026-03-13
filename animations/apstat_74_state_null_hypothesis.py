"""
Visualize that the null hypothesis for a mean test uses equality and the parameter μ.

Run with: manim -qm --format=mp4 animations/apstat_74_state_null_hypothesis.py MeanTestNullHypothesis
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanTestNullHypothesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Null Hypothesis for a Mean Test", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        rule_box = RoundedRectangle(corner_radius=0.2, width=8.2, height=1.2, stroke_color=YELLOW_3B1B, stroke_width=4)
        rule_box.set_fill(YELLOW_3B1B, opacity=0.12)
        rule_box.shift(UP * 1.75)
        rule_text = Text("H₀ uses equality and the population mean μ", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        rule_text.move_to(rule_box.get_center())

        claim_box = RoundedRectangle(corner_radius=0.2, width=4.4, height=1.8, stroke_color=BLUE_3B1B, stroke_width=4)
        claim_box.set_fill(BLUE_3B1B, opacity=0.12)
        claim_box.shift(LEFT * 3.2 + DOWN * 0.15)
        claim_title = Text("Claim to Test", font_size=24, color=BLUE_3B1B, weight=BOLD)
        claim_title.move_to(claim_box.get_center() + UP * 0.42)
        claim_text = Text("Average jump is 15 inches", font_size=24)
        claim_text.move_to(claim_box.get_center() + DOWN * 0.25)

        null_box = RoundedRectangle(corner_radius=0.2, width=4.8, height=1.8, stroke_color=GREEN_3B1B, stroke_width=4)
        null_box.set_fill(GREEN_3B1B, opacity=0.12)
        null_box.shift(RIGHT * 3.0 + DOWN * 0.15)
        null_title = Text("Correct Null", font_size=24, color=GREEN_3B1B, weight=BOLD)
        null_title.move_to(null_box.get_center() + UP * 0.42)
        null_text = Text("H₀: μ = 15 inches", font_size=28, weight=BOLD)
        null_text.move_to(null_box.get_center() + DOWN * 0.25)

        arrow = Arrow(claim_box.get_right() + RIGHT * 0.12, null_box.get_left() + LEFT * 0.12, color=TEAL_3B1B, buff=0.1, stroke_width=6)
        arrow_label = Text("start with equality", font_size=22, color=TEAL_3B1B, weight=BOLD)
        arrow_label.next_to(arrow, UP, buff=0.12)

        bad_left = Text("Not H₀: μ > 15", font_size=24, color=PINK_3B1B, weight=BOLD)
        bad_left.shift(LEFT * 3.2 + DOWN * 2.35)
        bad_right = Text("Not H₀: x̄ = 15", font_size=24, color=PINK_3B1B, weight=BOLD)
        bad_right.shift(RIGHT * 3.0 + DOWN * 2.35)

        takeaway = Text("Null means no change or no difference from the benchmark", font_size=24, color=TEAL_3B1B, weight=BOLD)
        takeaway.to_edge(DOWN, buff=0.45)

        self.play(Write(title), run_time=0.8)
        self.play(Create(rule_box), Write(rule_text), run_time=0.9)
        self.play(Create(claim_box), Write(claim_title), Write(claim_text), run_time=0.9)
        self.play(GrowArrow(arrow), Write(arrow_label), run_time=0.8)
        self.play(Create(null_box), Write(null_title), Write(null_text), run_time=0.9)
        self.play(Write(bad_left), Write(bad_right), run_time=0.9)
        self.play(Write(takeaway), run_time=0.8)
        self.wait(1.8)
