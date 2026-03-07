"""
Visualize how to decide whether a confidence interval supports a claim.

Run with: manim -qm --format=mp4 animations/apstat_69_claim_decision.py TwoPropClaimDecision
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoPropClaimDecision(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Does the Interval Support the Claim?", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        axis_left = Text("less than 0", font_size=22, color=TEAL_3B1B)
        axis_right = Text("greater than 0", font_size=22, color=TEAL_3B1B)
        zero_label = Text("0", font_size=28, color=YELLOW_3B1B, weight=BOLD)

        line = Line(LEFT * 4.8, RIGHT * 4.8, stroke_width=6, color=GRAY_B)
        line.shift(UP * 1.05)
        tick = Line(UP * 0.28, DOWN * 0.28, stroke_width=6, color=YELLOW_3B1B).move_to(line.get_center())
        zero_label.next_to(tick, DOWN, buff=0.18)
        axis_left.next_to(line.get_left(), DOWN, buff=0.55)
        axis_right.next_to(line.get_right(), DOWN, buff=0.55)

        red_interval = Line(line.get_center() + LEFT * 1.9, line.get_center() + RIGHT * 1.7, stroke_width=14, color=PINK_3B1B)
        red_interval.shift(UP * 0.05)
        red_text = Text("0 is inside the interval", font_size=26, color=PINK_3B1B, weight=BOLD)
        red_text.next_to(line, DOWN, buff=1.35)
        red_conclusion = Text("No convincing evidence for a difference", font_size=24, color=WHITE)
        red_conclusion.next_to(red_text, DOWN, buff=0.18)

        green_interval = Line(line.get_center() + LEFT * 3.6, line.get_center() + LEFT * 0.9, stroke_width=14, color=GREEN_3B1B)
        green_interval.shift(DOWN * 2.2)
        green_tick = Line(UP * 0.28, DOWN * 0.28, stroke_width=6, color=YELLOW_3B1B).move_to(line.get_center() + DOWN * 2.25)
        green_zero = Text("0", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        green_zero.next_to(green_tick, DOWN, buff=0.18)
        green_axis = Line(LEFT * 4.8, RIGHT * 4.8, stroke_width=6, color=GRAY_B).shift(DOWN * 2.2)
        green_text = Text("Entire interval stays below 0", font_size=26, color=GREEN_3B1B, weight=BOLD)
        green_text.next_to(green_axis, DOWN, buff=1.0)
        green_conclusion = Text("Convincing evidence for p1 < p2", font_size=24, color=WHITE)
        green_conclusion.next_to(green_text, DOWN, buff=0.18)

        self.play(Write(title), run_time=0.8)
        self.play(Create(line), Create(tick), Write(zero_label), Write(axis_left), Write(axis_right), run_time=0.9)
        self.play(Create(red_interval), Write(red_text), FadeIn(red_conclusion, shift=UP * 0.1), run_time=1.0)
        self.wait(1.0)
        self.play(Create(green_axis), Create(green_tick), Write(green_zero), run_time=0.7)
        self.play(Create(green_interval), Write(green_text), FadeIn(green_conclusion, shift=UP * 0.1), run_time=1.0)
        self.wait(2.5)
