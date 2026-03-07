"""
Visualize how to interpret a confidence interval for a difference in proportions.

Run with: manim -qm --format=mp4 animations/apstat_69_interval_interpretation.py TwoPropClaimIntervalInterpretation
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoPropClaimIntervalInterpretation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret the Interval", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        interval_box = RoundedRectangle(
            corner_radius=0.2,
            width=7.4,
            height=1.2,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        interval_box.set_fill(BLUE_3B1B, opacity=0.12)
        interval_box.shift(UP * 1.45)
        interval_text = Text(
            "95% CI: -0.291 to -0.034",
            font_size=30,
            color=BLUE_3B1B,
            weight=BOLD,
        ).move_to(interval_box.get_center())

        template = Text(
            "We are 95% confident that the interval captures",
            font_size=28,
        )
        template.shift(UP * 0.25)

        parameter_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.6,
            height=1.45,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        parameter_box.set_fill(TEAL_3B1B, opacity=0.12)
        parameter_box.shift(DOWN * 1.0)
        parameter_line_1 = Text(
            "the true difference (new minus old)",
            font_size=28,
            color=TEAL_3B1B,
            weight=BOLD,
        ).move_to(parameter_box.get_center() + UP * 0.23)
        parameter_line_2 = Text(
            "in the proportions of dogs that would get ticks.",
            font_size=26,
            color=WHITE,
        ).move_to(parameter_box.get_center() + DOWN * 0.28)

        note = Text(
            "Interpret the parameter, not a single sample.",
            font_size=24,
            color=PINK_3B1B,
            weight=BOLD,
        )
        note.next_to(parameter_box, DOWN, buff=0.38)

        arrow = Arrow(
            interval_box.get_bottom(),
            template.get_top(),
            buff=0.18,
            color=YELLOW_3B1B,
            stroke_width=6,
        )

        self.play(Write(title), run_time=0.8)
        self.play(Create(interval_box), Write(interval_text), run_time=0.9)
        self.play(Create(arrow), Write(template), run_time=0.8)
        self.play(
            Create(parameter_box),
            Write(parameter_line_1),
            Write(parameter_line_2),
            run_time=1.0,
        )
        self.play(FadeIn(note, shift=UP * 0.1), run_time=0.6)
        self.wait(2.6)
