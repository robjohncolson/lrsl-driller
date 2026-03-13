"""
Visualize how to interpret a confidence interval for a population mean.

Run with: manim -qm --format=mp4 animations/apstat_73_interpret_interval.py MeanCIInterpretInterval
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIInterpretInterval(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret the Interval", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        interval_box = RoundedRectangle(
            corner_radius=0.2,
            width=9.0,
            height=1.6,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        interval_box.set_fill(YELLOW_3B1B, opacity=0.12)
        interval_box.shift(UP * 1.1)

        interval_line_1 = Text("95% confidence interval", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        interval_line_1.move_to(interval_box.get_center() + UP * 0.28)
        interval_line_2 = Text("900.92 to 912.68 grams", font_size=34, color=WHITE, weight=BOLD)
        interval_line_2.move_to(interval_box.get_center() + DOWN * 0.28)

        template_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.8,
            height=2.7,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        template_box.set_fill(BLUE_3B1B, opacity=0.12)
        template_box.shift(DOWN * 1.1)

        template_title = Text("Interpretation template", font_size=26, color=BLUE_3B1B, weight=BOLD)
        template_title.move_to(template_box.get_center() + UP * 0.9)
        line_a = Text("We are 95% confident that the interval", font_size=26)
        line_a.move_to(template_box.get_center() + UP * 0.32)
        line_b = Text("from 900.92 to 912.68 grams captures the", font_size=26)
        line_b.move_to(template_box.get_center() + DOWN * 0.1)
        line_c = Text("mean weight of all bags from this wholesaler.", font_size=26, color=GREEN_3B1B)
        line_c.move_to(template_box.get_center() + DOWN * 0.55)

        wrong_note = Text("Not: 95% probability for one fixed interval", font_size=24, color=PINK_3B1B)
        wrong_note.to_edge(DOWN, buff=0.55)

        self.play(Write(title), run_time=0.8)
        self.play(Create(interval_box), Write(interval_line_1), Write(interval_line_2), run_time=1.0)
        self.wait(0.3)
        self.play(Create(template_box), Write(template_title), run_time=0.7)
        self.play(Write(line_a), run_time=0.6)
        self.play(Write(line_b), run_time=0.6)
        self.play(Write(line_c), run_time=0.6)
        self.wait(0.4)
        self.play(Write(wrong_note), run_time=0.7)
        self.wait(1.8)
