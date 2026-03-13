"""
Visualize the conditions for a one-sample t-test for a population mean.

Run with: manim -qm --format=mp4 animations/apstat_74_check_test_conditions.py MeanTestConditions
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanTestConditions(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Check Conditions for the Mean Test", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        checklist = VGroup()
        checklist_specs = [
            ("Random sample or random assignment", BLUE_3B1B),
            ("Sample is less than 10% of the population", TEAL_3B1B),
            ("n ≥ 30 or no strong skewness or outliers", YELLOW_3B1B),
        ]

        for index, (label, color) in enumerate(checklist_specs):
            row_box = RoundedRectangle(corner_radius=0.18, width=7.2, height=1.0, stroke_color=color, stroke_width=4)
            row_box.set_fill(color, opacity=0.12)
            row_box.shift(LEFT * 2.2 + UP * (0.95 - index * 1.35))
            row_text = Text(label, font_size=23, color=color, weight=BOLD)
            row_text.move_to(row_box.get_center())
            row_check = Text("✓", font_size=36, color=GREEN_3B1B, weight=BOLD)
            row_check.next_to(row_box, RIGHT, buff=0.25)
            checklist.add(VGroup(row_box, row_text, row_check))

        example_box = RoundedRectangle(corner_radius=0.2, width=4.0, height=3.0, stroke_color=PINK_3B1B, stroke_width=4)
        example_box.set_fill(PINK_3B1B, opacity=0.12)
        example_box.shift(RIGHT * 4.2 + DOWN * 0.25)
        example_title = Text("Got Hops?", font_size=28, color=PINK_3B1B, weight=BOLD)
        example_title.move_to(example_box.get_center() + UP * 0.95)
        example_line_1 = Text("random sample", font_size=22)
        example_line_1.move_to(example_box.get_center() + UP * 0.25)
        example_line_2 = Text("n = 20 and less than 10%", font_size=22)
        example_line_2.move_to(example_box.get_center() + DOWN * 0.3)
        example_line_3 = Text("no strong skew or outliers", font_size=22)
        example_line_3.move_to(example_box.get_center() + DOWN * 0.85)

        takeaway = Text("Same checks as a one-sample t-interval for μ", font_size=24, color=GREEN_3B1B, weight=BOLD)
        takeaway.to_edge(DOWN, buff=0.45)

        self.play(Write(title), run_time=0.8)
        for row in checklist:
            self.play(Create(row[0]), Write(row[1]), Write(row[2]), run_time=0.7)
        self.play(Create(example_box), Write(example_title), Write(example_line_1), Write(example_line_2), Write(example_line_3), run_time=1.0)
        self.play(Write(takeaway), run_time=0.8)
        self.wait(1.8)
