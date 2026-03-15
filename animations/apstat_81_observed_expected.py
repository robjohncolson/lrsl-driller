"""
Observed counts versus expected counts for Topic 8.1.

Render:
manim -qm --format=mp4 animations/apstat_81_observed_expected.py Topic81ObservedExpected
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Topic81ObservedExpected(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Observed vs Expected", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Topic 8.1 starts with two different counts",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        observed_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.2,
            height=2.5,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        observed_box.set_fill(BLUE_3B1B, opacity=0.12)
        observed_box.shift(LEFT * 3.2 + UP * 0.25)
        observed_text = VGroup(
            Text("Observed", font_size=28, color=BLUE_3B1B, weight=BOLD),
            Text("what actually happened", font_size=22),
            Text("sample count from the table", font_size=20),
        ).arrange(DOWN, buff=0.14).move_to(observed_box.get_center())

        expected_box = RoundedRectangle(
            corner_radius=0.2,
            width=5.2,
            height=2.5,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        expected_box.set_fill(TEAL_3B1B, opacity=0.12)
        expected_box.shift(RIGHT * 3.2 + UP * 0.25)
        expected_text = VGroup(
            Text("Expected", font_size=28, color=TEAL_3B1B, weight=BOLD),
            Text("what the model predicts", font_size=22),
            Text("before comparing to data", font_size=20),
        ).arrange(DOWN, buff=0.14).move_to(expected_box.get_center())

        example_panel = RoundedRectangle(
            corner_radius=0.2,
            width=10.6,
            height=2.2,
            stroke_color=YELLOW_3B1B,
            stroke_width=3,
        )
        example_panel.set_fill(YELLOW_3B1B, opacity=0.09)
        example_panel.shift(DOWN * 2.0)

        example_title = Text("Example: fair 10-sided die rolled 100 times", font_size=24, color=YELLOW_3B1B)
        example_title.move_to(example_panel.get_center() + UP * 0.55)

        observed_note = Text("Observed for face 9: 13", font_size=24, color=BLUE_3B1B, weight=BOLD)
        observed_note.move_to(example_panel.get_center() + LEFT * 2.7 + DOWN * 0.25)

        expected_note = Text("Expected for face 9: 10", font_size=24, color=TEAL_3B1B, weight=BOLD)
        expected_note.move_to(example_panel.get_center() + RIGHT * 2.7 + DOWN * 0.25)

        observed_arrow = Arrow(
            observed_note.get_top() + UP * 0.1,
            observed_box.get_bottom() + DOWN * 0.05,
            buff=0.15,
            color=BLUE_3B1B,
            stroke_width=6,
        )
        expected_arrow = Arrow(
            expected_note.get_top() + UP * 0.1,
            expected_box.get_bottom() + DOWN * 0.05,
            buff=0.15,
            color=TEAL_3B1B,
            stroke_width=6,
        )

        footer = Text(
            "Compare observed counts to expected counts before asking if results are surprising.",
            font_size=22,
            color=GREEN_3B1B,
        )
        footer.to_edge(DOWN, buff=0.45)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.5)
        self.play(FadeIn(observed_box), Write(observed_text), run_time=1.4)
        self.play(FadeIn(expected_box), Write(expected_text), run_time=1.4)
        self.wait(0.4)
        self.play(Create(example_panel), Write(example_title), run_time=1.4)
        self.play(Write(observed_note), Write(expected_note), run_time=1.3)
        self.play(Create(observed_arrow), Create(expected_arrow), run_time=1.2)
        self.play(Write(footer), run_time=1.2)
        self.wait(2.0)
