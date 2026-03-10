"""
Visualize how to define the parameter p with population language.

Run with: manim -qm --format=mp4 animations/apstat_64_parameter_definition.py ParameterDefinition64
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ParameterDefinition64(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Define p for the Population", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        good_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.8,
            height=1.75,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        good_box.set_fill(GREEN_3B1B, opacity=0.12)
        good_box.shift(UP * 1.0)
        good_line_1 = Text("Good: p = proportion of all students", font_size=30, color=GREEN_3B1B, weight=BOLD)
        good_line_2 = Text("who would choose the green cup.", font_size=28, color=WHITE)
        good_group = VGroup(good_line_1, good_line_2).arrange(DOWN, buff=0.1).move_to(good_box.get_center())

        bad_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.8,
            height=1.75,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        bad_box.set_fill(PINK_3B1B, opacity=0.12)
        bad_box.shift(DOWN * 1.05)
        bad_line_1 = Text("Not this: p̂ = proportion of the sample", font_size=30, color=PINK_3B1B, weight=BOLD)
        bad_line_2 = Text("who chose the green cup.", font_size=28, color=WHITE)
        bad_group = VGroup(bad_line_1, bad_line_2).arrange(DOWN, buff=0.1).move_to(bad_box.get_center())

        callout_all = Text("Use population words like all and would.", font_size=28, color=TEAL_3B1B, weight=BOLD)
        callout_all.next_to(good_box, DOWN, buff=0.35)

        callout_hat = Text("Do not put p̂ in the hypotheses.", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        callout_hat.next_to(bad_box, DOWN, buff=0.35)

        connector_1 = Arrow(callout_all.get_top() + LEFT * 1.7, good_box.get_bottom() + LEFT * 1.7, buff=0.12, color=TEAL_3B1B, stroke_width=6)
        connector_2 = Arrow(callout_hat.get_top() + RIGHT * 1.6, bad_box.get_bottom() + RIGHT * 1.6, buff=0.12, color=YELLOW_3B1B, stroke_width=6)

        self.play(FadeIn(title))
        self.play(FadeIn(good_box), Write(good_group))
        self.play(FadeIn(bad_box), Write(bad_group))
        self.play(GrowArrow(connector_1), FadeIn(callout_all))
        self.play(GrowArrow(connector_2), FadeIn(callout_hat))
        self.wait(2)
