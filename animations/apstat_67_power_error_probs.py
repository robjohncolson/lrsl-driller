"""
Power and Error Probabilities (AP Stats Unit 6, Topic 6.7)

Visualizes the relationship between Type I error, Type II error, and power
using two overlapping normal distributions (null and alternative).
Shows alpha as the rejection region under H0, beta as the region under Ha
that falls in the fail-to-reject zone, and power = 1 - beta.

Run with: manim -qm --format=mp4 apstat_67_power_error_probs.py PowerAndErrorProbabilities
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


def normal_pdf(x, mu, sigma):
    return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma) ** 2)


class PowerAndErrorProbabilities(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Power and Error Probabilities", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== SETUP: Two distributions ==========
        p0 = 0.50   # null hypothesis value
        pa = 0.62   # true alternative value
        se = 0.05   # standard error

        axes = Axes(
            x_range=[0.25, 0.85, 0.05],
            y_range=[0, 10, 2],
            x_length=10,
            y_length=3.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.8)

        # Add axis labels as Text (no LaTeX)
        for val in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
            lbl = Text(str(val), font_size=14, color=GREY_B)
            lbl.next_to(axes.c2p(val, 0), DOWN, buff=0.1)
            axes.add(lbl)

        # Null distribution
        null_curve = axes.plot(
            lambda x: normal_pdf(x, p0, se),
            x_range=[0.3, 0.7],
            color=ManimColor(BLUE_3B1B),
        )
        null_label = Text("H\u2080: p = 0.50", font_size=18, color=BLUE_3B1B, weight=BOLD)
        null_label.next_to(axes.c2p(p0, normal_pdf(p0, p0, se)), UP, buff=0.15)

        # Alternative distribution
        alt_curve = axes.plot(
            lambda x: normal_pdf(x, pa, se),
            x_range=[0.4, 0.85],
            color=ManimColor(GREEN_3B1B),
        )
        alt_label = Text("True: p = 0.62", font_size=18, color=GREEN_3B1B, weight=BOLD)
        alt_label.next_to(axes.c2p(pa, normal_pdf(pa, pa, se)), UP, buff=0.15)

        self.play(Create(axes), run_time=0.5)
        self.play(Create(null_curve), Write(null_label), run_time=0.6)
        self.play(Create(alt_curve), Write(alt_label), run_time=0.6)
        self.wait(0.5)

        # ========== CRITICAL VALUE LINE ==========
        # For a one-sided test at alpha=0.05: z_crit = 1.645 -> p_crit = p0 + 1.645*se
        p_crit = p0 + 1.645 * se  # ~0.582

        crit_line = axes.get_vertical_line(
            axes.c2p(p_crit, normal_pdf(p_crit, p0, se)),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        crit_label = Text("Critical\nvalue", font_size=14, color=YELLOW_3B1B)
        crit_label.next_to(axes.c2p(p_crit, 0), DOWN, buff=0.15)

        self.play(Create(crit_line), Write(crit_label), run_time=0.5)
        self.wait(0.3)

        # ========== ALPHA REGION (Type I error) ==========
        alpha_region = axes.get_area(
            null_curve,
            x_range=[p_crit, 0.7],
            color=RED_3B1B,
            opacity=0.4,
        )
        alpha_label = Text("\u03b1", font_size=28, color=RED_3B1B, weight=BOLD)
        alpha_label.move_to(axes.c2p(0.65, 1.5))

        alpha_desc = Text(
            "P(Type I error) = \u03b1",
            font_size=18, color=RED_3B1B,
        )
        alpha_desc.next_to(axes, UP, buff=0.15).align_to(LEFT * 4, LEFT)

        self.play(FadeIn(alpha_region), Write(alpha_label), run_time=0.6)
        self.play(Write(alpha_desc), run_time=0.4)
        self.wait(0.8)

        # ========== BETA REGION (Type II error) ==========
        beta_region = axes.get_area(
            alt_curve,
            x_range=[0.4, p_crit],
            color=ORANGE_3B1B,
            opacity=0.35,
        )
        beta_label = Text("\u03b2", font_size=28, color=ORANGE_3B1B, weight=BOLD)
        beta_label.move_to(axes.c2p(0.52, 2.0))

        beta_desc = Text(
            "P(Type II error) = \u03b2",
            font_size=18, color=ORANGE_3B1B,
        )
        beta_desc.next_to(alpha_desc, RIGHT, buff=0.8)

        self.play(FadeIn(beta_region), Write(beta_label), run_time=0.6)
        self.play(Write(beta_desc), run_time=0.4)
        self.wait(0.8)

        # ========== POWER REGION ==========
        power_region = axes.get_area(
            alt_curve,
            x_range=[p_crit, 0.85],
            color=GREEN_3B1B,
            opacity=0.4,
        )
        power_label = Text("Power", font_size=20, color=GREEN_3B1B, weight=BOLD)
        power_label.move_to(axes.c2p(0.72, 2.5))

        power_desc = Text(
            "Power = 1 \u2212 \u03b2",
            font_size=18, color=GREEN_3B1B,
        )
        power_desc.next_to(beta_desc, RIGHT, buff=0.8)

        self.play(FadeIn(power_region), Write(power_label), run_time=0.6)
        self.play(Write(power_desc), run_time=0.4)
        self.wait(1.0)

        # ========== KEY DEFINITIONS ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects if mob is not title],
            run_time=0.5,
        )

        defs_title = Text("Key Definitions", font_size=28, weight=BOLD, color=TEAL_3B1B)
        defs_title.next_to(title, DOWN, buff=0.35)

        items = [
            ("\u03b1 = P(Type I error)", "Probability of rejecting a TRUE H\u2080", RED_3B1B),
            ("\u03b2 = P(Type II error)", "Probability of failing to reject a FALSE H\u2080", ORANGE_3B1B),
            ("Power = 1 \u2212 \u03b2", "Probability of correctly rejecting a FALSE H\u2080", GREEN_3B1B),
        ]

        prev = defs_title
        for sym, desc, color in items:
            sym_text = Text(sym, font_size=24, color=color, weight=BOLD)
            sym_text.next_to(prev, DOWN, buff=0.3).align_to(LEFT * 4.5, LEFT)
            desc_text = Text(desc, font_size=18, color=GREY_B)
            desc_text.next_to(sym_text, DOWN, buff=0.08, aligned_edge=LEFT)
            self.play(Write(sym_text), Write(desc_text), run_time=0.5)
            prev = desc_text

        self.wait(0.3)

        closing = Text(
            "Higher power = better chance of detecting a real effect",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.5)
        closing_box = SurroundingRectangle(closing, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
