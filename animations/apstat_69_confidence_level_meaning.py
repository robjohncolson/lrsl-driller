"""
Visualize the repeated-sampling meaning of a confidence level for p1 - p2.

Run with: manim -qm --format=mp4 animations/apstat_69_confidence_level_meaning.py TwoPropConfidenceLevelMeaning
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoPropConfidenceLevelMeaning(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Confidence Level Meaning", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text("Repeated samples -> repeated intervals", font_size=26, color=TEAL_3B1B, weight=BOLD)
        subtitle.next_to(title, DOWN, buff=0.25)

        true_line = Line(UP * 2.2, DOWN * 2.3, color=YELLOW_3B1B, stroke_width=6)
        true_line.shift(RIGHT * 1.1 + DOWN * 0.15)
        true_label = Text("true difference", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        true_label.next_to(true_line, UP, buff=0.2)

        intervals = VGroup(
            Line(LEFT * 3.8, RIGHT * 1.9, color=GREEN_3B1B, stroke_width=10).shift(UP * 1.2),
            Line(LEFT * 3.2, RIGHT * 2.2, color=GREEN_3B1B, stroke_width=10).shift(UP * 0.3),
            Line(LEFT * 1.8, RIGHT * 3.7, color=PINK_3B1B, stroke_width=10).shift(DOWN * 0.6),
            Line(LEFT * 4.0, RIGHT * 1.6, color=GREEN_3B1B, stroke_width=10).shift(DOWN * 1.5),
        )

        left_labels = VGroup(
            Text("sample 1", font_size=20, color=WHITE).next_to(intervals[0], LEFT, buff=0.25),
            Text("sample 2", font_size=20, color=WHITE).next_to(intervals[1], LEFT, buff=0.25),
            Text("sample 3", font_size=20, color=WHITE).next_to(intervals[2], LEFT, buff=0.25),
            Text("sample 4", font_size=20, color=WHITE).next_to(intervals[3], LEFT, buff=0.25),
        )

        capture_note = Text("Most intervals capture the true difference.", font_size=24, color=GREEN_3B1B, weight=BOLD)
        capture_note.to_edge(DOWN, buff=0.7)
        miss_note = Text("The confidence level is a long-run capture rate.", font_size=24, color=PINK_3B1B, weight=BOLD)
        miss_note.next_to(capture_note, UP, buff=0.22)

        self.play(Write(title), Write(subtitle), run_time=0.9)
        self.play(Create(true_line), Write(true_label), run_time=0.8)
        for interval, label in zip(intervals, left_labels):
            self.play(Create(interval), Write(label), run_time=0.45)
        self.play(FadeIn(miss_note, shift=UP * 0.1), FadeIn(capture_note, shift=UP * 0.1), run_time=0.7)
        self.wait(2.8)
