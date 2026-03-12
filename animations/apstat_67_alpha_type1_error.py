"""
Type I Error and Alpha (AP Stats Unit 6, Topic 6.7e)

Shows that the significance level alpha equals the probability of a
Type I error: rejecting a true null hypothesis.

Run with: manim -qm --format=mp4 apstat_67_alpha_type1_error.py AlphaType1Error
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


class AlphaType1Error(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Type I Error and Alpha", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== SCENARIO ==========
        scenario = Text(
            "Suppose H\u2080 is actually TRUE.",
            font_size=24, color=BLUE_3B1B,
        )
        scenario.next_to(title, DOWN, buff=0.3)
        self.play(Write(scenario), run_time=0.5)
        self.wait(0.5)

        # ========== NULL DISTRIBUTION ==========
        mu = 0.5
        se = 0.05
        axes = Axes(
            x_range=[0.3, 0.7, 0.05],
            y_range=[0, 9, 2],
            x_length=9,
            y_length=3.0,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.5)

        for val in [0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65]:
            lbl = Text(str(val), font_size=14, color=GREY_B)
            lbl.next_to(axes.c2p(val, 0), DOWN, buff=0.1)
            axes.add(lbl)

        curve = axes.plot(
            lambda x: normal_pdf(x, mu, se),
            x_range=[0.3, 0.7],
            color=ManimColor(BLUE_3B1B),
        )
        h0_label = Text("H\u2080 is true: p = 0.50", font_size=18, color=BLUE_3B1B, weight=BOLD)
        h0_label.next_to(axes.c2p(mu, normal_pdf(mu, mu, se)), UP, buff=0.15)

        self.play(Create(axes), run_time=0.4)
        self.play(Create(curve), Write(h0_label), run_time=0.5)
        self.wait(0.5)

        # ========== CRITICAL VALUE + ALPHA REGION ==========
        p_crit = mu + 1.645 * se

        crit_line = axes.get_vertical_line(
            axes.c2p(p_crit, normal_pdf(p_crit, mu, se)),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        crit_text = Text("Reject H\u2080\n\u2192", font_size=14, color=YELLOW_3B1B)
        crit_text.next_to(axes.c2p(p_crit, 0), DOWN, buff=0.15)

        alpha_region = axes.get_area(
            curve, x_range=[p_crit, 0.7],
            color=RED_3B1B, opacity=0.5,
        )
        alpha_label = Text("\u03b1", font_size=32, color=RED_3B1B, weight=BOLD)
        alpha_label.move_to(axes.c2p(0.64, 1.2))

        self.play(Create(crit_line), Write(crit_text), run_time=0.4)
        self.play(FadeIn(alpha_region), Write(alpha_label), run_time=0.5)
        self.wait(0.5)

        # ========== TYPE I ERROR DEFINITION ==========
        defn = Text(
            "Type I error = rejecting H\u2080 when H\u2080 is true",
            font_size=22, color=RED_3B1B,
        )
        defn.to_edge(DOWN, buff=1.2)
        self.play(Write(defn), run_time=0.5)
        self.wait(0.5)

        # ========== KEY EQUATION ==========
        equation = Text(
            "\u03b1 = P(Type I error)",
            font_size=28, color=YELLOW_3B1B, weight=BOLD,
        )
        equation.to_edge(DOWN, buff=0.4)
        eq_box = SurroundingRectangle(equation, color=YELLOW_3B1B, buff=0.12, corner_radius=0.1)

        self.play(Write(equation), Create(eq_box), run_time=0.5)
        self.wait(0.8)

        # ========== SECOND SCENE: ALPHA VALUES ==========
        self.play(*[FadeOut(m) for m in self.mobjects if m is not title], run_time=0.5)

        rows = [
            ("\u03b1 = 0.05", "5% chance of rejecting a true H\u2080", "Most common choice"),
            ("\u03b1 = 0.01", "1% chance — stricter, fewer false rejections", "Medical / high-stakes"),
            ("\u03b1 = 0.10", "10% chance — more lenient", "Exploratory research"),
        ]

        prev = title
        for sym, desc, note in rows:
            sym_t = Text(sym, font_size=24, color=RED_3B1B, weight=BOLD)
            sym_t.next_to(prev, DOWN, buff=0.35).align_to(LEFT * 5, LEFT)
            desc_t = Text(desc, font_size=18, color=GREY_B)
            desc_t.next_to(sym_t, RIGHT, buff=0.3)
            note_t = Text(note, font_size=14, color=TEAL_3B1B)
            note_t.next_to(sym_t, DOWN, buff=0.06, aligned_edge=LEFT)
            self.play(Write(sym_t), Write(desc_t), Write(note_t), run_time=0.5)
            prev = note_t

        self.wait(0.3)

        closing = Text(
            "The significance level \u03b1 IS the probability of a Type I error",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.5)
        closing_box = SurroundingRectangle(closing, color=YELLOW_3B1B, buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
