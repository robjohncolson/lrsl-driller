"""
Visualize how changing confidence level changes the margin of error for a mean interval.

Run with: manim -qm --format=mp4 animations/apstat_73_confidence_level_margin_of_error.py MeanCIConfidenceLevelMarginOfError
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanCIConfidenceLevelMarginOfError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Confidence Level and Margin of Error", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        formula_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.6,
            height=1.4,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        formula_box.set_fill(YELLOW_3B1B, opacity=0.12)
        formula_box.shift(UP * 1.5)
        formula = Text("ME = t* × s / √n", font_size=36, color=YELLOW_3B1B, weight=BOLD)
        formula.move_to(formula_box.get_center())

        note = Text("Lower confidence -> smaller t* -> smaller ME", font_size=26, color=TEAL_3B1B, weight=BOLD)
        note.shift(UP * 0.55)

        center_line = Line(LEFT * 4.5, RIGHT * 4.5, color=WHITE, stroke_width=5)
        center_line.shift(DOWN * 0.7)
        center_tick = Line(UP * 0.3, DOWN * 0.3, color=WHITE, stroke_width=5).move_to(center_line.get_center())
        center_label = Text("x-bar", font_size=24).next_to(center_tick, DOWN, buff=0.2)

        wide_interval = Line(LEFT * 3.2, RIGHT * 3.2, color=BLUE_3B1B, stroke_width=14).shift(DOWN * 0.2)
        wide_label = Text("95% confidence", font_size=24, color=BLUE_3B1B, weight=BOLD).next_to(wide_interval, UP, buff=0.2)

        narrow_interval = Line(LEFT * 2.3, RIGHT * 2.3, color=GREEN_3B1B, stroke_width=14).shift(DOWN * 1.2)
        narrow_label = Text("90% confidence", font_size=24, color=GREEN_3B1B, weight=BOLD).next_to(narrow_interval, DOWN, buff=0.2)

        summary_box = RoundedRectangle(
            corner_radius=0.2,
            width=9.2,
            height=1.35,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        summary_box.set_fill(PINK_3B1B, opacity=0.12)
        summary_box.shift(DOWN * 2.6)
        summary_text = Text("Same center, same data, but lower confidence gives a narrower interval.", font_size=24)
        summary_text.move_to(summary_box.get_center())

        self.play(Write(title), run_time=0.8)
        self.play(Create(formula_box), Write(formula), run_time=0.9)
        self.play(Write(note), run_time=0.7)
        self.play(Create(center_line), Create(center_tick), Write(center_label), run_time=0.7)
        self.play(Create(wide_interval), Write(wide_label), run_time=0.8)
        self.play(Create(narrow_interval), Write(narrow_label), run_time=0.8)
        self.play(Create(summary_box), Write(summary_text), run_time=0.9)
        self.wait(1.8)
