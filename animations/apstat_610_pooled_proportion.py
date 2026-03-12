"""
Visualize computing the pooled sample proportion for a two-sample z test.

Run with: manim -qm --format=mp4 animations/apstat_610_pooled_proportion.py Pooled610
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Pooled610(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("6.10 — Pooled Proportion", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        # Why pool?
        why_text = Text("Under H0, p1 = p2, so we combine the samples", font_size=24, color=YELLOW_3B1B)
        why_text.next_to(title, DOWN, buff=0.45)

        # Formula display
        formula_label = Text("Pooled proportion:", font_size=26, color=TEAL_3B1B, weight=BOLD)
        formula_label.shift(UP * 0.8 + LEFT * 0.5)

        # Build the formula with Text objects (no LaTeX)
        formula_top = Text("x1 + x2", font_size=30, color=WHITE, weight=BOLD)
        formula_line = Line(LEFT * 1.2, RIGHT * 1.2, stroke_width=4, color=WHITE)
        formula_bot = Text("n1 + n2", font_size=30, color=WHITE, weight=BOLD)
        p_hat_c = Text("p\u0302c  =", font_size=30, color=GREEN_3B1B, weight=BOLD)

        formula_top.next_to(formula_line, UP, buff=0.1)
        formula_bot.next_to(formula_line, DOWN, buff=0.1)
        fraction = VGroup(formula_top, formula_line, formula_bot)
        fraction.move_to(ORIGIN + RIGHT * 0.5)
        p_hat_c.next_to(fraction, LEFT, buff=0.25)
        formula_label.next_to(VGroup(p_hat_c, fraction), UP, buff=0.4)

        # Worked example
        example_panel = RoundedRectangle(
            corner_radius=0.18, width=10.0, height=2.5,
            stroke_color=BLUE_3B1B, stroke_width=4,
        )
        example_panel.set_fill(BLUE_3B1B, opacity=0.08)
        example_panel.shift(DOWN * 1.7)

        example_title = Text("Example", font_size=26, color=BLUE_3B1B, weight=BOLD)
        example_title.move_to(example_panel.get_top() + DOWN * 0.35)

        data = VGroup(
            Text("Sample 1:  x1 = 36,  n1 = 240", font_size=22),
            Text("Sample 2:  x2 = 25,  n2 = 200", font_size=22),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        data.next_to(example_title, DOWN, buff=0.3).shift(LEFT * 1.5)

        calc = VGroup(
            Text("p\u0302c = (36 + 25) / (240 + 200)", font_size=22, color=TEAL_3B1B),
            Text("p\u0302c = 61 / 440 = 0.139", font_size=22, color=GREEN_3B1B, weight=BOLD),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        calc.next_to(data, RIGHT, buff=1.2).align_to(data, UP)

        # Animate
        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(why_text, shift=UP * 0.1), run_time=0.6)
        self.play(Write(formula_label), run_time=0.5)
        self.play(Write(p_hat_c), Create(formula_line), run_time=0.5)
        self.play(Write(formula_top), Write(formula_bot), run_time=0.7)
        self.wait(0.8)
        self.play(Create(example_panel), Write(example_title), run_time=0.6)
        self.play(
            LaggedStart(
                *[FadeIn(d, shift=RIGHT * 0.1) for d in data],
                lag_ratio=0.2,
            ),
            run_time=0.7,
        )
        self.play(
            LaggedStart(
                *[FadeIn(c, shift=RIGHT * 0.1) for c in calc],
                lag_ratio=0.3,
            ),
            run_time=0.8,
        )
        self.wait(2.5)
