"""
Population regression model vs sample regression line — the sample slope
estimates the population slope but will differ due to sampling variability.

Render:
manim -qm --format=mp4 animations/apstat_91_population_vs_sample.py PopulationVsSample
"""
from manim import *
import random

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class PopulationVsSample(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Population Model vs Sample", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "The sample slope estimates the population slope",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Left panel: Population ---
        pop_box = RoundedRectangle(
            corner_radius=0.15, width=5.8, height=4.2,
            stroke_color=BLUE_3B1B, stroke_width=3,
        )
        pop_box.set_fill(BLUE_3B1B, opacity=0.04)
        pop_box.shift(LEFT * 3.4 + DOWN * 0.7)

        pop_label = Text(
            "Population Model", font_size=26, color=BLUE_3B1B, weight=BOLD,
        )
        pop_label.next_to(pop_box, UP, buff=0.12)

        # Scatter dots — population (many dots)
        rng = random.Random(42)
        pop_dots = VGroup()
        for _ in range(55):
            x = rng.uniform(-2.4, 2.4)
            y = 0.55 * x + rng.gauss(0, 0.6)
            y = max(-1.6, min(1.6, y))
            dot = Dot(
                point=pop_box.get_center() + np.array([x, y, 0]),
                radius=0.04, color=BLUE_3B1B, fill_opacity=0.45,
            )
            pop_dots.add(dot)

        pop_line = Line(
            pop_box.get_center() + LEFT * 2.5 + DOWN * 1.375,
            pop_box.get_center() + RIGHT * 2.5 + UP * 1.375,
            color=YELLOW_3B1B, stroke_width=3,
        )

        pop_info = Text(
            "N = 262,  slope \u03b2\u2081 = 13.29",
            font_size=22, color=YELLOW_3B1B,
        )
        pop_info.next_to(pop_box, DOWN, buff=0.12)

        # --- Right panel: Sample ---
        samp_box = RoundedRectangle(
            corner_radius=0.15, width=5.8, height=4.2,
            stroke_color=GREEN_3B1B, stroke_width=3,
        )
        samp_box.set_fill(GREEN_3B1B, opacity=0.04)
        samp_box.shift(RIGHT * 3.4 + DOWN * 0.7)

        samp_label = Text(
            "Sample", font_size=26, color=GREEN_3B1B, weight=BOLD,
        )
        samp_label.next_to(samp_box, UP, buff=0.12)

        samp_dots = VGroup()
        for _ in range(18):
            x = rng.uniform(-2.4, 2.4)
            y = 0.32 * x + rng.gauss(0, 0.7)
            y = max(-1.6, min(1.6, y))
            dot = Dot(
                point=samp_box.get_center() + np.array([x, y, 0]),
                radius=0.055, color=GREEN_3B1B, fill_opacity=0.7,
            )
            samp_dots.add(dot)

        samp_line = Line(
            samp_box.get_center() + LEFT * 2.5 + DOWN * 0.8,
            samp_box.get_center() + RIGHT * 2.5 + UP * 0.8,
            color=PINK_3B1B, stroke_width=3,
        )

        samp_info = Text(
            "n = 25,  slope b\u2081 = 7.79",
            font_size=22, color=PINK_3B1B,
        )
        samp_info.next_to(samp_box, DOWN, buff=0.12)

        # --- Bottom callout ---
        callout = RoundedRectangle(
            corner_radius=0.2, width=10.5, height=0.75,
            stroke_color=TEAL_3B1B, stroke_width=4,
        )
        callout.set_fill(TEAL_3B1B, opacity=0.08)
        callout.to_edge(DOWN, buff=0.25)
        callout_text = Text(
            "b\u2081 estimates \u03b2\u2081 — but how far off can it be?",
            font_size=24, color=WHITE,
        )
        callout_text.move_to(callout.get_center())

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)

        # Population panel
        self.play(
            DrawBorderThenFill(pop_box), FadeIn(pop_label, shift=DOWN * 0.1),
            run_time=0.8,
        )
        self.play(
            LaggedStart(*[FadeIn(d, scale=0.5) for d in pop_dots], lag_ratio=0.02),
            run_time=1.2,
        )
        self.play(Create(pop_line), FadeIn(pop_info, shift=UP * 0.1), run_time=1.0)

        # Sample panel
        self.play(
            DrawBorderThenFill(samp_box), FadeIn(samp_label, shift=DOWN * 0.1),
            run_time=0.8,
        )
        self.play(
            LaggedStart(*[FadeIn(d, scale=0.5) for d in samp_dots], lag_ratio=0.04),
            run_time=1.0,
        )
        self.play(Create(samp_line), FadeIn(samp_info, shift=UP * 0.1), run_time=1.0)

        # Callout
        self.play(DrawBorderThenFill(callout), Write(callout_text), run_time=1.2)
        self.wait(1.8)
