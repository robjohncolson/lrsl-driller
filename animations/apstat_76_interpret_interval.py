"""
Interpret a Difference in Two Means Interval (AP Stats Unit 7, Topic 7.6)

Run with: manim -qm --format=mp4 apstat_76_interpret_interval.py MeanDiffCIInterpretInterval
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIInterpretInterval(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret in Context", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))

        interval_box = RoundedRectangle(corner_radius=0.18, width=4.6, height=1.2, stroke_color=BLUE_3B1B, fill_color=BLUE_3B1B, fill_opacity=0.12)
        interval_text = Text("7.96 to 12.13 mm", font_size=30, color=WHITE, weight=BOLD).move_to(interval_box.get_center())
        interval_group = VGroup(interval_box, interval_text).next_to(title, DOWN, buff=0.65)
        self.play(FadeIn(interval_group, shift=UP * 0.2))
        self.wait(0.5)

        statement = VGroup(
            Text("We are 95% confident that", font_size=28, color=TEAL_3B1B),
            Text("the population mean difference", font_size=30, color=WHITE, weight=BOLD),
            Text("(female minus male)", font_size=28, color=YELLOW_3B1B, weight=BOLD),
            Text("is between 7.96 and 12.13 mm.", font_size=30, color=GREEN_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.16).next_to(interval_group, DOWN, buff=0.7)
        self.play(LaggedStart(*[Write(line) for line in statement], lag_ratio=0.15), run_time=1.6)
        self.wait(0.8)

        bad_box = RoundedRectangle(corner_radius=0.18, width=8.8, height=1.35, stroke_color=PINK_3B1B, fill_color=PINK_3B1B, fill_opacity=0.1)
        bad_text = Text("Not: 95% probability the parameter is in this interval", font_size=24, color=WHITE).move_to(bad_box.get_center())
        bad_group = VGroup(bad_box, bad_text).next_to(statement, DOWN, buff=0.55)

        x_mark = VGroup(
            Line(LEFT * 0.22 + UP * 0.22, RIGHT * 0.22 + DOWN * 0.22, color=PINK_3B1B, stroke_width=8),
            Line(LEFT * 0.22 + DOWN * 0.22, RIGHT * 0.22 + UP * 0.22, color=PINK_3B1B, stroke_width=8),
        ).next_to(bad_box, LEFT, buff=0.25)

        self.play(FadeIn(bad_group, shift=UP * 0.2), Create(x_mark), run_time=0.9)
        self.wait(2.2)
