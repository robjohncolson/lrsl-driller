"""
Visualize the large-counts check for a one-sample z-test for a proportion.

Run with: manim -qm --format=mp4 animations/apstat_64_large_counts.py LargeCounts64
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class LargeCounts64(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Check Large Counts with p₀", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        warning = Text("For a test, use the null value p₀.", font_size=30, color=YELLOW_3B1B, weight=BOLD)
        warning.shift(UP * 2.0)

        top_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.0,
            height=1.4,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        top_box.set_fill(GREEN_3B1B, opacity=0.12)
        top_box.shift(UP * 0.55)
        top_text = Text("np₀ = n x p₀", font_size=34, color=GREEN_3B1B, weight=BOLD).move_to(top_box.get_center())

        bottom_box = RoundedRectangle(
            corner_radius=0.2,
            width=8.0,
            height=1.4,
            stroke_color=BLUE_3B1B,
            stroke_width=4,
        )
        bottom_box.set_fill(BLUE_3B1B, opacity=0.12)
        bottom_box.shift(DOWN * 1.0)
        bottom_text = Text("n(1 - p₀) = n x (1 - p₀)", font_size=32, color=BLUE_3B1B, weight=BOLD).move_to(bottom_box.get_center())

        example_box = RoundedRectangle(
            corner_radius=0.2,
            width=10.2,
            height=1.8,
            stroke_color=TEAL_3B1B,
            stroke_width=4,
        )
        example_box.set_fill(TEAL_3B1B, opacity=0.12)
        example_box.shift(DOWN * 2.8)
        example_line_1 = Text("Example: n = 50, p₀ = 0.40", font_size=28, color=TEAL_3B1B, weight=BOLD)
        example_line_2 = Text("np₀ = 20 and n(1 - p₀) = 30", font_size=28, color=WHITE)
        example_group = VGroup(example_line_1, example_line_2).arrange(DOWN, buff=0.1).move_to(example_box.get_center())

        cutoff = Text("Both values must be at least 10.", font_size=28, color=PINK_3B1B, weight=BOLD)
        cutoff.next_to(example_box, DOWN, buff=0.35)

        self.play(FadeIn(title), FadeIn(warning))
        self.play(FadeIn(top_box), Write(top_text))
        self.play(FadeIn(bottom_box), Write(bottom_text))
        self.play(FadeIn(example_box), Write(example_group))
        self.play(FadeIn(cutoff))
        self.wait(2)
