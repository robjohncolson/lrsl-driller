"""
Define parameters as population means, not sample statistics.

Render:
manim -qm --format=mp4 animations/apstat_78_define_parameters.py MeanDiffTestDefineParameters
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestDefineParameters(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text(
            "Define the Parameters First",
            font_size=36,
            weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Hypotheses are about population means, not sample summaries",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        param_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.0,
            height=3.0,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        param_box.set_fill(GREEN_3B1B, opacity=0.12)
        param_box.shift(LEFT * 3.2 + DOWN * 0.15)
        param_text = VGroup(
            Text("Parameters", font_size=28, color=GREEN_3B1B, weight=BOLD),
            Text("mu1 = population mean for group 1", font_size=22),
            Text("mu2 = population mean for group 2", font_size=22),
        ).arrange(DOWN, buff=0.22).move_to(param_box.get_center())

        sample_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.0,
            height=3.0,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        sample_box.set_fill(PINK_3B1B, opacity=0.12)
        sample_box.shift(RIGHT * 3.2 + DOWN * 0.15)
        sample_text = VGroup(
            Text("Sample statistics", font_size=28, color=PINK_3B1B, weight=BOLD),
            Text("xbar1 = sample mean for group 1", font_size=22),
            Text("xbar2 = sample mean for group 2", font_size=22),
        ).arrange(DOWN, buff=0.22).move_to(sample_box.get_center())

        correct_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.8,
            height=1.9,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        correct_box.set_fill(BLUE_3B1B, opacity=0.12)
        correct_box.shift(DOWN * 2.45)
        correct_text = VGroup(
            Text("Correct setup for hypotheses", font_size=24, color=BLUE_3B1B, weight=BOLD),
            Text("H0: mu1 - mu2 = 0     Ha: mu1 - mu2 != 0", font_size=26, weight=BOLD),
        ).arrange(DOWN, buff=0.2).move_to(correct_box.get_center())

        reject_mark = Text("Do not write hypotheses with xbar values", font_size=24, color=PINK_3B1B, weight=BOLD)
        reject_mark.to_edge(DOWN, buff=0.4)

        param_highlight = SurroundingRectangle(param_text, color=YELLOW_3B1B, buff=0.18)
        sample_highlight = SurroundingRectangle(sample_text, color=YELLOW_3B1B, buff=0.18)

        self.play(Write(title), run_time=1.0)
        self.play(FadeIn(subtitle, shift=UP * 0.2), run_time=0.8)
        self.wait(0.8)

        self.play(Create(param_box), Write(param_text), run_time=1.1)
        self.wait(0.9)
        self.play(Create(param_highlight), run_time=0.8)
        self.wait(0.8)

        self.play(Create(sample_box), Write(sample_text), run_time=1.1)
        self.wait(0.9)
        self.play(Create(sample_highlight), run_time=0.8)
        self.wait(0.8)

        self.play(Create(correct_box), Write(correct_text), run_time=1.1)
        self.wait(0.9)

        self.play(Write(reject_mark), run_time=0.9)
        self.wait(3.5)
