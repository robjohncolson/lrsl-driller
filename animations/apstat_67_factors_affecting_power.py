"""
Factors Affecting Power (AP Stats Unit 6, Topic 6.7)

Demonstrates the four main factors that affect the power of a test:
1. Sample size (larger n -> narrower curves -> more power)
2. Significance level (larger alpha -> more power but more Type I risk)
3. True parameter distance (further from p0 -> more power)
4. Variability (less variability -> more power)

Uses animated normal distributions to show each factor visually.

Run with: manim -qm --format=mp4 apstat_67_factors_affecting_power.py FactorsAffectingPower
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


class FactorsAffectingPower(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Factors That Affect Power", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "What makes a test better at detecting a real effect?",
            font_size=22, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== FACTOR 1: SAMPLE SIZE ==========
        f1_title = Text(
            "1. Increase Sample Size (n)",
            font_size=28, color=YELLOW_3B1B, weight=BOLD,
        )
        f1_title.next_to(title, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
        self.play(Write(f1_title), run_time=0.4)

        axes1 = Axes(
            x_range=[0.3, 0.8, 0.1],
            y_range=[0, 12, 3],
            x_length=8, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.6)

        p0, pa = 0.50, 0.62

        # Small n (wide curves)
        se_small = 0.07
        null_wide = axes1.plot(
            lambda x: normal_pdf(x, p0, se_small), x_range=[0.25, 0.75],
            color=ManimColor(BLUE_3B1B), stroke_opacity=0.4,
        )
        alt_wide = axes1.plot(
            lambda x: normal_pdf(x, pa, se_small), x_range=[0.35, 0.85],
            color=ManimColor(GREEN_3B1B), stroke_opacity=0.4,
        )
        small_label = Text("Small n (wide, overlapping)", font_size=14, color=GREY_B)
        small_label.next_to(axes1, DOWN, buff=0.1)

        self.play(Create(axes1), Create(null_wide), Create(alt_wide), Write(small_label), run_time=0.6)
        self.wait(0.5)

        # Large n (narrow curves)
        se_large = 0.035
        null_narrow = axes1.plot(
            lambda x: normal_pdf(x, p0, se_large), x_range=[0.35, 0.65],
            color=ManimColor(BLUE_3B1B),
        )
        alt_narrow = axes1.plot(
            lambda x: normal_pdf(x, pa, se_large), x_range=[0.50, 0.78],
            color=ManimColor(GREEN_3B1B),
        )
        large_label = Text("Large n (narrow, separated) = MORE POWER", font_size=14, color=GREEN_3B1B)
        large_label.next_to(axes1, DOWN, buff=0.1)

        self.play(
            Transform(null_wide, null_narrow),
            Transform(alt_wide, alt_narrow),
            Transform(small_label, large_label),
            run_time=1.0,
        )
        self.wait(0.8)

        self.play(
            FadeOut(axes1), FadeOut(null_wide), FadeOut(alt_wide),
            FadeOut(small_label), FadeOut(f1_title),
            run_time=0.4,
        )

        # ========== FACTOR 2: SIGNIFICANCE LEVEL ==========
        f2_title = Text(
            "2. Increase Significance Level (\u03b1)",
            font_size=28, color=YELLOW_3B1B, weight=BOLD,
        )
        f2_title.next_to(title, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
        self.play(Write(f2_title), run_time=0.4)

        f2_desc = Text(
            "\u03b1 = 0.01  \u2192  \u03b1 = 0.05  \u2192  \u03b1 = 0.10",
            font_size=22, color=WHITE,
        )
        f2_desc.next_to(f2_title, DOWN, buff=0.3)

        f2_arrow = Text(
            "Larger \u03b1 = bigger rejection region = MORE POWER",
            font_size=20, color=GREEN_3B1B,
        )
        f2_arrow.next_to(f2_desc, DOWN, buff=0.2)

        f2_warn = Text(
            "But also increases P(Type I error)!",
            font_size=18, color=RED_3B1B,
        )
        f2_warn.next_to(f2_arrow, DOWN, buff=0.15)

        self.play(Write(f2_desc), run_time=0.5)
        self.play(Write(f2_arrow), run_time=0.5)
        self.play(Write(f2_warn), run_time=0.4)
        self.wait(0.8)

        self.play(
            FadeOut(f2_title), FadeOut(f2_desc), FadeOut(f2_arrow), FadeOut(f2_warn),
            run_time=0.4,
        )

        # ========== FACTOR 3: TRUE PARAMETER DISTANCE ==========
        f3_title = Text(
            "3. True Value Further from p\u2080",
            font_size=28, color=YELLOW_3B1B, weight=BOLD,
        )
        f3_title.next_to(title, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
        self.play(Write(f3_title), run_time=0.4)

        axes3 = Axes(
            x_range=[0.3, 0.85, 0.1],
            y_range=[0, 10, 2],
            x_length=8, y_length=2.5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.6)

        se3 = 0.05
        null3 = axes3.plot(
            lambda x: normal_pdf(x, p0, se3), x_range=[0.3, 0.7],
            color=ManimColor(BLUE_3B1B),
        )

        # Close alternative
        pa_close = 0.55
        alt_close = axes3.plot(
            lambda x: normal_pdf(x, pa_close, se3), x_range=[0.35, 0.75],
            color=ManimColor(ORANGE_3B1B), stroke_opacity=0.5,
        )
        close_label = Text("p = 0.55 (close to p\u2080)", font_size=14, color=ORANGE_3B1B)
        close_label.next_to(axes3.c2p(pa_close, normal_pdf(pa_close, pa_close, se3)), UR, buff=0.1)

        # Far alternative
        pa_far = 0.70
        alt_far = axes3.plot(
            lambda x: normal_pdf(x, pa_far, se3), x_range=[0.5, 0.85],
            color=ManimColor(GREEN_3B1B),
        )
        far_label = Text("p = 0.70 (far from p\u2080) = MORE POWER", font_size=14, color=GREEN_3B1B)
        far_label.next_to(axes3.c2p(pa_far, normal_pdf(pa_far, pa_far, se3)), UR, buff=0.1)

        self.play(Create(axes3), Create(null3), run_time=0.5)
        self.play(Create(alt_close), Write(close_label), run_time=0.5)
        self.play(Create(alt_far), Write(far_label), run_time=0.5)
        self.wait(0.8)

        self.play(
            FadeOut(axes3), FadeOut(null3), FadeOut(alt_close),
            FadeOut(alt_far), FadeOut(close_label), FadeOut(far_label),
            FadeOut(f3_title),
            run_time=0.4,
        )

        # ========== SUMMARY ==========
        summary_title = Text("Summary: Increase Power By...", font_size=28, weight=BOLD, color=TEAL_3B1B)
        summary_title.next_to(title, DOWN, buff=0.35)

        factors = [
            ("Increasing sample size (n)", GREEN_3B1B),
            ("Increasing significance level (\u03b1)", GREEN_3B1B),
            ("Larger true effect (p further from p\u2080)", GREEN_3B1B),
            ("Decreasing variability", GREEN_3B1B),
        ]

        self.play(Write(summary_title), run_time=0.4)

        prev = summary_title
        for text, color in factors:
            item = Text(f"\u2713 {text}", font_size=22, color=color)
            item.next_to(prev, DOWN, buff=0.25).align_to(LEFT * 4, LEFT)
            self.play(Write(item), run_time=0.4)
            prev = item

        self.wait(0.3)

        tradeoff = Text(
            "Trade-off: Increasing \u03b1 boosts power\nbut also raises the Type I error rate!",
            font_size=20, color=YELLOW_3B1B,
        )
        tradeoff.to_edge(DOWN, buff=0.4)
        tradeoff_box = SurroundingRectangle(tradeoff, color=YELLOW_3B1B, buff=0.15, corner_radius=0.1)
        self.play(Write(tradeoff), Create(tradeoff_box), run_time=0.5)
        self.wait(1.5)
