"""
Visualize the repeated-sampling meaning of confidence level.

Run with: manim -qm --format=mp4 animations/apstat_73_interpret_confidence_level.py MeanCIInterpretConfidenceLevel
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIInterpretConfidenceLevel(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("What 95% Confidence Means", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        mean_line = DashedLine(UP * 2.4, DOWN * 2.2, color=YELLOW_3B1B, stroke_width=4)
        mean_line.shift(RIGHT * 0.2)
        mean_label = Text("μ = 98.6", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        mean_label.next_to(mean_line, UP, buff=0.2)

        bars = VGroup(
            Line(LEFT * 2.7, RIGHT * 1.7, color=BLUE_3B1B, stroke_width=14).shift(UP * 1.3),
            Line(LEFT * 2.0, RIGHT * 2.4, color=BLUE_3B1B, stroke_width=14).shift(UP * 0.55),
            Line(LEFT * 3.0, LEFT * 0.15, color=PINK_3B1B, stroke_width=14).shift(DOWN * 0.2),
            Line(LEFT * 2.3, RIGHT * 1.8, color=BLUE_3B1B, stroke_width=14).shift(DOWN * 0.95),
            Line(LEFT * 1.8, RIGHT * 2.6, color=BLUE_3B1B, stroke_width=14).shift(DOWN * 1.7),
        )
        bars.shift(RIGHT * 0.2)

        sample_note = Text("Repeated random samples produce many intervals", font_size=26, color=TEAL_3B1B)
        sample_note.move_to(UP * 2.6 + LEFT * 2.5)

        capture_note = Text("Most intervals capture μ", font_size=28, color=GREEN_3B1B, weight=BOLD)
        capture_note.to_edge(DOWN, buff=0.85)
        red_note = Text("A few will miss μ", font_size=26, color=PINK_3B1B)
        red_note.to_edge(DOWN, buff=0.35)

        summary_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.6,
            height=1.35,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        summary_box.set_fill(BLUE_3B1B, opacity=0.12)
        summary_box.shift(DOWN * 2.75)
        summary_text = Text("In many samples, about 95% of 95% intervals capture the population mean.", font_size=24)
        summary_text.move_to(summary_box.get_center())

        self.play(Write(title), run_time=0.8)
        self.play(Write(sample_note), Create(mean_line), Write(mean_label), run_time=0.9)
        self.play(LaggedStart(*[Create(bar) for bar in bars], lag_ratio=0.15), run_time=1.8)
        self.play(Write(capture_note), Write(red_note), run_time=0.8)
        self.play(Create(summary_box), Write(summary_text), run_time=0.9)
        self.wait(1.8)
