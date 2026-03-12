"""
Define Power (AP Stats Unit 6, Topic 6.7f)

Defines statistical power as the probability of correctly rejecting
a false null hypothesis.  Power = 1 - beta.

Run with: manim -qm --format=mp4 apstat_67_power_definition.py PowerDefinition
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


def normal_pdf(x, mu, sigma):
    return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma) ** 2)


class PowerDefinition(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("What Is Statistical Power?", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== TWO DISTRIBUTIONS ==========
        p0 = 0.50
        pa = 0.62
        se = 0.05
        p_crit = p0 + 1.645 * se

        axes = Axes(
            x_range=[0.25, 0.85, 0.05],
            y_range=[0, 10, 2],
            x_length=10,
            y_length=3.2,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.6)

        for val in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
            lbl = Text(str(val), font_size=14, color=GREY_B)
            lbl.next_to(axes.c2p(val, 0), DOWN, buff=0.1)
            axes.add(lbl)

        null_curve = axes.plot(lambda x: normal_pdf(x, p0, se), x_range=[0.3, 0.7], color=ManimColor(BLUE_3B1B))
        alt_curve = axes.plot(lambda x: normal_pdf(x, pa, se), x_range=[0.4, 0.85], color=ManimColor(GREEN_3B1B))

        null_lbl = Text("H\u2080 (false)", font_size=16, color=BLUE_3B1B, weight=BOLD)
        null_lbl.next_to(axes.c2p(p0, normal_pdf(p0, p0, se)), UP, buff=0.1)
        alt_lbl = Text("True p", font_size=16, color=GREEN_3B1B, weight=BOLD)
        alt_lbl.next_to(axes.c2p(pa, normal_pdf(pa, pa, se)), UP, buff=0.1)

        crit_line = axes.get_vertical_line(
            axes.c2p(p_crit, max(normal_pdf(p_crit, p0, se), normal_pdf(p_crit, pa, se))),
            line_config={"color": YELLOW_3B1B, "stroke_width": 2},
        )

        self.play(Create(axes), run_time=0.4)
        self.play(Create(null_curve), Write(null_lbl), Create(alt_curve), Write(alt_lbl), run_time=0.6)
        self.play(Create(crit_line), run_time=0.3)
        self.wait(0.3)

        # ========== STEP 1: Show beta ==========
        beta_region = axes.get_area(alt_curve, x_range=[0.4, p_crit], color=ORANGE_3B1B, opacity=0.35)
        beta_lbl = Text("\u03b2", font_size=28, color=ORANGE_3B1B, weight=BOLD)
        beta_lbl.move_to(axes.c2p(0.53, 2.0))

        beta_desc = Text("Fail to reject H\u2080\n(Type II error)", font_size=14, color=ORANGE_3B1B)
        beta_desc.next_to(beta_lbl, DOWN, buff=0.1)

        self.play(FadeIn(beta_region), Write(beta_lbl), run_time=0.5)
        self.play(Write(beta_desc), run_time=0.4)
        self.wait(0.5)

        # ========== STEP 2: Show power ==========
        power_region = axes.get_area(alt_curve, x_range=[p_crit, 0.85], color=GREEN_3B1B, opacity=0.5)
        power_lbl = Text("Power", font_size=22, color=GREEN_3B1B, weight=BOLD)
        power_lbl.move_to(axes.c2p(0.72, 2.5))

        self.play(FadeIn(power_region), Write(power_lbl), run_time=0.5)
        self.wait(0.5)

        # ========== KEY DEFINITION ==========
        defn_box_items = VGroup()

        d1 = Text("Power = P(reject H\u2080 | H\u2080 is false)", font_size=24, color=GREEN_3B1B, weight=BOLD)
        d2 = Text("Power = 1 \u2212 \u03b2", font_size=24, color=GREEN_3B1B, weight=BOLD)
        d2.next_to(d1, DOWN, buff=0.15)
        defn_box_items.add(d1, d2)
        defn_box_items.to_edge(DOWN, buff=0.35)

        box = SurroundingRectangle(defn_box_items, color=GREEN_3B1B, buff=0.15, corner_radius=0.1)
        self.play(Write(d1), run_time=0.5)
        self.play(Write(d2), Create(box), run_time=0.5)
        self.wait(0.5)

        # ========== PLAIN ENGLISH ==========
        plain = Text(
            "Power is the chance of detecting a real effect when one exists.",
            font_size=18, color=YELLOW_3B1B,
        )
        plain.next_to(box, DOWN, buff=0.2)
        self.play(Write(plain), run_time=0.5)
        self.wait(1.5)
