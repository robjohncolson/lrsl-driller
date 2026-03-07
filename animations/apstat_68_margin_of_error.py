"""
Visualize margin of error for a difference in two proportions.

Run with: manim -qm --format=mp4 animations/apstat_68_margin_of_error.py TwoPropMarginOfError
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoPropMarginOfError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Margin of Error for p1 - p2", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        formula = Text("ME = z* x SE", font_size=42, color=YELLOW_3B1B, weight=BOLD)
        formula.shift(UP * 1.2)

        z_box = RoundedRectangle(corner_radius=0.18, width=3.2, height=1.65, stroke_color=BLUE_3B1B, stroke_width=4)
        z_box.set_fill(BLUE_3B1B, opacity=0.12)
        z_box.shift(LEFT * 3 + DOWN * 0.2)
        z_title = Text("critical value", font_size=22, color=BLUE_3B1B)
        z_title.next_to(z_box.get_top(), DOWN, buff=0.28)
        z_value = Text("z* = 1.645", font_size=28, color=BLUE_3B1B, weight=BOLD).move_to(z_box.get_center() + DOWN * 0.1)

        se_box = RoundedRectangle(corner_radius=0.18, width=3.4, height=1.65, stroke_color=TEAL_3B1B, stroke_width=4)
        se_box.set_fill(TEAL_3B1B, opacity=0.12)
        se_box.shift(RIGHT * 3 + DOWN * 0.2)
        se_title = Text("standard error", font_size=22, color=TEAL_3B1B)
        se_title.next_to(se_box.get_top(), DOWN, buff=0.28)
        se_value = Text("SE = 0.0328", font_size=28, color=TEAL_3B1B, weight=BOLD).move_to(se_box.get_center() + DOWN * 0.1)

        multiply = Text("1.645 x 0.0328", font_size=36, color=WHITE, weight=BOLD)
        multiply.shift(DOWN * 1.55)

        answer_box = RoundedRectangle(corner_radius=0.2, width=4.2, height=1.2, stroke_color=GREEN_3B1B, stroke_width=5)
        answer_box.set_fill(GREEN_3B1B, opacity=0.14)
        answer_box.next_to(multiply, DOWN, buff=0.45)
        answer = Text("ME = 0.0540", font_size=32, color=GREEN_3B1B, weight=BOLD).move_to(answer_box.get_center())

        arrows = VGroup(
            Arrow(formula.get_bottom() + LEFT * 1.25, z_box.get_top(), buff=0.15, color=BLUE_3B1B),
            Arrow(formula.get_bottom() + RIGHT * 1.25, se_box.get_top(), buff=0.15, color=TEAL_3B1B),
        )

        note = Text("The interval width is 2 x ME", font_size=24, color=PINK_3B1B, weight=BOLD)
        note.next_to(answer_box, DOWN, buff=0.35)

        self.play(Write(title), Write(formula))
        self.wait(0.5)
        self.play(Create(z_box), Write(z_title), Write(z_value), Create(arrows[0]), run_time=0.8)
        self.play(Create(se_box), Write(se_title), Write(se_value), Create(arrows[1]), run_time=0.8)
        self.wait(0.7)
        self.play(Write(multiply), run_time=0.7)
        self.play(Create(answer_box), Write(answer), run_time=0.8)
        self.play(FadeIn(note, shift=UP * 0.1), run_time=0.5)
        self.wait(2.5)
