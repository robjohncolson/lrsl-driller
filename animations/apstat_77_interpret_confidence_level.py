"""
Interpret the Confidence Level for a Difference in Means (AP Stats Unit 7, Topic 7.7)

Run with: manim -qm --format=mp4 apstat_77_interpret_confidence_level.py MeanDiffCIInterpretConfidenceLevel
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffCIInterpretConfidenceLevel(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret the Confidence Level", font_size=40, weight=BOLD)
        subtitle = Text("Repeated random sample pairs", font_size=26, color=TEAL_3B1B)
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.5)

        true_line = DashedLine(UP * 2.2, DOWN * 2.2, color=YELLOW_3B1B).shift(RIGHT * 0.8)
        true_label = Text("true μ₁ − μ₂", font_size=24, color=YELLOW_3B1B, weight=BOLD).next_to(true_line, UP, buff=0.18)
        self.play(Create(true_line), Write(true_label), run_time=0.8)

        intervals = VGroup(
            Line(LEFT * 3.5, RIGHT * 1.8, color=GREEN_3B1B, stroke_width=8).shift(UP * 1.5),
            Line(LEFT * 2.6, RIGHT * 2.7, color=GREEN_3B1B, stroke_width=8).shift(UP * 0.7),
            Line(LEFT * 3.0, RIGHT * 2.1, color=GREEN_3B1B, stroke_width=8).shift(DOWN * 0.1),
            Line(LEFT * 1.8, RIGHT * 3.7, color=PINK_3B1B, stroke_width=8).shift(DOWN * 0.9),
            Line(LEFT * 2.9, RIGHT * 1.9, color=GREEN_3B1B, stroke_width=8).shift(DOWN * 1.7),
        )
        sample_labels = VGroup(
            Text("sample 1", font_size=20, color=WHITE),
            Text("sample 2", font_size=20, color=WHITE),
            Text("sample 3", font_size=20, color=WHITE),
            Text("sample 4", font_size=20, color=WHITE),
            Text("sample 5", font_size=20, color=WHITE),
        )
        for label, interval in zip(sample_labels, intervals):
            label.next_to(interval, LEFT, buff=0.35)

        self.play(LaggedStart(*[FadeIn(mob, shift=UP * 0.1) for mob in intervals], lag_ratio=0.15), run_time=1.2)
        self.play(LaggedStart(*[Write(label) for label in sample_labels], lag_ratio=0.12), run_time=1.0)
        self.wait(0.8)

        takeaway_box = RoundedRectangle(
            corner_radius=0.2,
            width=11.2,
            height=1.5,
            stroke_color=BLUE_3B1B,
            fill_color=BLUE_3B1B,
            fill_opacity=0.12,
        ).shift(DOWN * 3.0)
        takeaway = Text("About 95% of intervals capture the true difference", font_size=28, color=WHITE, weight=BOLD).move_to(takeaway_box.get_center())
        self.play(FadeIn(takeaway_box, shift=UP * 0.2), Write(takeaway), run_time=1.0)
        self.wait(2.6)
