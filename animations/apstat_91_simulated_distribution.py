"""
Simulated sampling distribution of slopes centred at 13.3, then show
the observed slope 7.79 is far in the tail (P ≈ 0).

Render:
manim -qm --format=mp4 animations/apstat_91_simulated_distribution.py SimulatedDistribution
"""
from manim import *
import random

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class SimulatedDistribution(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Simulated Sampling Distribution", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "200 simulated sample slopes from the population model",
            font_size=22, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Number line ---
        nl = NumberLine(
            x_range=[5, 21, 2],
            length=11.0,
            include_numbers=True,
            font_size=20,
            color=GRAY_B,
        )
        nl.move_to(DOWN * 0.8)

        nl_label = Text("Sample slope b\u2081", font_size=20, color=GRAY_B)
        nl_label.next_to(nl, DOWN, buff=0.25)

        # --- Build dot-plot histogram ---
        rng = random.Random(99)
        # Simulated slopes ~ N(13.3, 1.5)
        sim_slopes = [rng.gauss(13.3, 1.5) for _ in range(200)]

        # Bin slopes into 0.5-wide bins for stacking
        bin_width = 0.5
        bins = {}
        for s in sim_slopes:
            b = round(s / bin_width) * bin_width
            b = max(5.5, min(20.5, b))
            bins[b] = bins.get(b, 0) + 1

        dot_radius = 0.065
        dot_spacing = dot_radius * 2.2
        all_dots = VGroup()
        for b_val, count in sorted(bins.items()):
            for row in range(count):
                dot = Dot(
                    point=nl.n2p(b_val) + UP * (dot_spacing * (row + 1)),
                    radius=dot_radius,
                    color=TEAL_3B1B,
                    fill_opacity=0.7,
                )
                all_dots.add(dot)

        # --- Center label ---
        center_arrow = Arrow(
            nl.n2p(13.3) + UP * 3.2,
            nl.n2p(13.3) + UP * 2.4,
            buff=0, color=YELLOW_3B1B, stroke_width=3,
        )
        center_label = Text(
            "\u03b2\u2081 = 13.29", font_size=22, color=YELLOW_3B1B,
        )
        center_label.next_to(center_arrow, UP, buff=0.08)

        # --- Observed slope marker ---
        obs_arrow = Arrow(
            nl.n2p(7.79) + DOWN * 1.2,
            nl.n2p(7.79) + DOWN * 0.3,
            buff=0, color=PINK_3B1B, stroke_width=4,
        )
        obs_label = Text(
            "Observed slope = 7.79",
            font_size=24, color=PINK_3B1B, weight=BOLD,
        )
        obs_label.next_to(obs_arrow, DOWN, buff=0.08)

        p_label = Text(
            "P \u2248 0", font_size=30, color=PINK_3B1B, weight=BOLD,
        )
        p_label.next_to(obs_label, DOWN, buff=0.15)

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(Create(nl), FadeIn(nl_label, shift=UP * 0.1), run_time=0.8)

        # Dot histogram — appear in a wave
        self.play(
            LaggedStart(*[FadeIn(d, scale=0.4) for d in all_dots], lag_ratio=0.005),
            run_time=2.0,
        )

        # Center marker
        self.play(
            GrowArrow(center_arrow), FadeIn(center_label, shift=DOWN * 0.1),
            run_time=0.7,
        )

        # Observed slope
        self.play(
            GrowArrow(obs_arrow), FadeIn(obs_label, shift=UP * 0.2),
            run_time=1.0,
        )
        self.play(FadeIn(p_label, scale=1.3), run_time=0.8)
        self.wait(1.8)
