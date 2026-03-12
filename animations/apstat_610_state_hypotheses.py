"""
Visualize stating null and alternative hypotheses for a two-sample z test for p1 - p2.

Run with: manim -qm --format=mp4 animations/apstat_610_state_hypotheses.py Hypotheses610
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Hypotheses610(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("6.10 — Two-Sample z Test Hypotheses", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        # Null hypothesis panel
        null_panel = RoundedRectangle(
            corner_radius=0.18, width=5.6, height=3.2,
            stroke_color=BLUE_3B1B, stroke_width=4,
        )
        null_panel.set_fill(BLUE_3B1B, opacity=0.10)
        null_panel.shift(LEFT * 3.2 + DOWN * 0.1)

        null_title = Text("Null Hypothesis", font_size=28, color=BLUE_3B1B, weight=BOLD)
        null_title.move_to(null_panel.get_top() + DOWN * 0.45)

        null_symbol = Text("H0: p1 = p2", font_size=32, color=WHITE, weight=BOLD)
        null_symbol.next_to(null_title, DOWN, buff=0.4)

        null_equiv = Text("equivalently: p1 - p2 = 0", font_size=22, color=GRAY_B)
        null_equiv.next_to(null_symbol, DOWN, buff=0.2)

        null_meaning = Text('"No difference between\nthe two populations"', font_size=22, color=YELLOW_3B1B)
        null_meaning.next_to(null_equiv, DOWN, buff=0.35)

        # Alternative hypothesis panel
        alt_panel = RoundedRectangle(
            corner_radius=0.18, width=5.6, height=3.2,
            stroke_color=TEAL_3B1B, stroke_width=4,
        )
        alt_panel.set_fill(TEAL_3B1B, opacity=0.10)
        alt_panel.shift(RIGHT * 3.2 + DOWN * 0.1)

        alt_title = Text("Alternative Hypothesis", font_size=28, color=TEAL_3B1B, weight=BOLD)
        alt_title.move_to(alt_panel.get_top() + DOWN * 0.45)

        alt_options = VGroup(
            Text("Ha: p1 < p2   (left-tailed)", font_size=24, color=PINK_3B1B),
            Text("Ha: p1 > p2   (right-tailed)", font_size=24, color=GREEN_3B1B),
            Text("Ha: p1 \u2260 p2   (two-tailed)", font_size=24, color=YELLOW_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.28)
        alt_options.next_to(alt_title, DOWN, buff=0.45)

        alt_note = Text("Direction comes from\nthe research question", font_size=20, color=GRAY_B)
        alt_note.next_to(alt_options, DOWN, buff=0.35)

        # Summary bar
        summary = RoundedRectangle(
            corner_radius=0.18, width=11.0, height=0.85,
            stroke_color=PINK_3B1B, stroke_width=4,
        )
        summary.set_fill(PINK_3B1B, opacity=0.10)
        summary.shift(DOWN * 3.05)
        summary_text = Text(
            "Always define p1 and p2 in context before writing the hypotheses",
            font_size=22, color=PINK_3B1B, weight=BOLD,
        )
        summary_text.move_to(summary.get_center())

        # Animate
        self.play(Write(title), run_time=0.8)
        self.play(Create(null_panel), Create(alt_panel), run_time=0.7)
        self.play(Write(null_title), Write(alt_title), run_time=0.6)
        self.play(Write(null_symbol), run_time=0.6)
        self.play(FadeIn(null_equiv, shift=UP * 0.1), run_time=0.5)
        self.play(FadeIn(null_meaning, shift=UP * 0.1), run_time=0.6)
        self.wait(0.5)
        self.play(
            LaggedStart(
                *[FadeIn(opt, shift=RIGHT * 0.15) for opt in alt_options],
                lag_ratio=0.25,
            ),
            run_time=1.0,
        )
        self.play(FadeIn(alt_note, shift=UP * 0.1), run_time=0.5)
        self.wait(0.5)
        self.play(Create(summary), Write(summary_text), run_time=0.8)
        self.wait(2.5)
