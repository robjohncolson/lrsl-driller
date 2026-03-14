"""
Decide Whether 0 Is Plausible (AP Stats Unit 7, Topic 7.7)

Run with: manim -qm --format=mp4 apstat_77_zero_plausible.py MeanDiffCIZeroPlausible
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIZeroPlausible(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Is 0 Plausible?", font_size=42, weight=BOLD)
        subtitle = Text("Check whether 0 is in the interval", font_size=26, color=TEAL_3B1B)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.6)

        top_line = Line(LEFT * 4.5, RIGHT * 4.5, color=GRAY_B).shift(UP * 1.0)
        top_interval = Line(LEFT * 2.1, RIGHT * 0.3, color=GREEN_3B1B, stroke_width=10).move_to(top_line)
        top_zero = Dot(top_line.get_center(), color=YELLOW_3B1B, radius=0.09)
        top_label = Text("(-2.37, 0.37)", font_size=28, color=WHITE).next_to(top_line, UP, buff=0.2)
        top_note = Text("0 is inside", font_size=24, color=GREEN_3B1B, weight=BOLD).next_to(top_line, DOWN, buff=0.2)

        bottom_line = Line(LEFT * 4.5, RIGHT * 4.5, color=GRAY_B).shift(DOWN * 1.25)
        bottom_interval = Line(RIGHT * 1.0, RIGHT * 3.8, color=PINK_3B1B, stroke_width=10).move_to(bottom_line)
        bottom_zero = Dot(bottom_line.get_center(), color=YELLOW_3B1B, radius=0.09)
        bottom_label = Text("(7.956, 12.129)", font_size=28, color=WHITE).next_to(bottom_line, UP, buff=0.2)
        bottom_note = Text("0 is outside", font_size=24, color=PINK_3B1B, weight=BOLD).next_to(bottom_line, DOWN, buff=0.2)

        zero_top = Text("0", font_size=24, color=YELLOW_3B1B).next_to(top_zero, DOWN, buff=0.22)
        zero_bottom = Text("0", font_size=24, color=YELLOW_3B1B).next_to(bottom_zero, DOWN, buff=0.22)

        self.play(Create(top_line), Create(bottom_line), run_time=0.8)
        self.play(FadeIn(top_interval), FadeIn(bottom_interval), run_time=0.8)
        self.play(FadeIn(top_zero), FadeIn(bottom_zero), Write(zero_top), Write(zero_bottom), run_time=0.7)
        self.play(Write(top_label), Write(bottom_label), run_time=0.8)
        self.play(FadeIn(top_note, shift=UP * 0.1), FadeIn(bottom_note, shift=UP * 0.1), run_time=0.8)
        self.wait(0.8)

        takeaway_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.5,
            height=1.4,
            stroke_color=BLUE_3B1B,
            fill_color=BLUE_3B1B,
            fill_opacity=0.12,
        ).shift(DOWN * 3.0)
        takeaway = Text("0 in interval → no difference is plausible", font_size=28, color=WHITE, weight=BOLD).move_to(takeaway_box.get_center())
        self.play(FadeIn(takeaway_box, shift=UP * 0.2), Write(takeaway), run_time=1.0)
        self.wait(2.5)
