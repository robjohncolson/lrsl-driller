"""
Assessing Normality Animation (Unit 5, Topic 5.2e)

Shows how to assess whether a distribution is approximately normal by
examining shape (unimodal, symmetric, bell-shaped) and applying the
empirical rule (68-95-99.7). Also demonstrates binomial-to-normal
approximation with increasing n.

To render:
    manim -qm --format=mp4 assessing_normality.py AssessingNormality
"""

from manim import *
import numpy as np
from scipy.stats import norm, binom

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class AssessingNormality(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ── Title ──
        title = Text("Assessing Normality", font_size=48, color=WHITE, weight=BOLD)
        subtitle = Text("Is this distribution Normal?", font_size=28, color=GRAY)
        title.to_edge(UP, buff=0.3)
        subtitle.next_to(title, DOWN, buff=0.1)

        self.play(Write(title), Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle))

        # ── PART 1: Three distributions side-by-side ──
        # Helper to build a filled curve from (x, y) data
        def build_filled_curve(xs, ys, axes, color, fill_opacity=0.4):
            """Return a filled polygon tracing the curve then the baseline."""
            top_pts = [axes.c2p(x, y) for x, y in zip(xs, ys)]
            base_right = axes.c2p(xs[-1], 0)
            base_left = axes.c2p(xs[0], 0)
            all_pts = top_pts + [base_right, base_left]
            poly = Polygon(
                *all_pts,
                stroke_color=color,
                stroke_width=2.5,
                fill_color=color,
                fill_opacity=fill_opacity,
            )
            return poly

        # --- Distribution 1: Normal (bell curve) ---
        ax1 = Axes(
            x_range=[-3.5, 3.5, 1],
            y_range=[0, 0.45, 0.1],
            x_length=3.4,
            y_length=2.2,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax1.shift(LEFT * 4.2 + DOWN * 0.2)

        xs1 = np.linspace(-3.5, 3.5, 200)
        ys1 = norm.pdf(xs1, 0, 1)
        curve1 = build_filled_curve(xs1, ys1, ax1, BLUE_3B1B)

        label1 = Text("Normal", font_size=22, color=GREEN, weight=BOLD)
        label1.next_to(ax1, DOWN, buff=0.15)
        check1 = Text("Unimodal, symmetric, bell-shaped", font_size=16, color=GREEN_3B1B)
        check1.next_to(label1, DOWN, buff=0.08)

        # --- Distribution 2: Right-skewed ---
        ax2 = Axes(
            x_range=[0, 8, 1],
            y_range=[0, 0.45, 0.1],
            x_length=3.4,
            y_length=2.2,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax2.shift(DOWN * 0.2)

        xs2 = np.linspace(0.01, 8, 200)
        # Lognormal-ish shape for skew
        ys2 = (1 / (xs2 * 0.8 * np.sqrt(2 * np.pi))) * np.exp(
            -((np.log(xs2) - 0.5) ** 2) / (2 * 0.8 ** 2)
        )
        ys2 = ys2 / ys2.max() * 0.4  # normalise height
        curve2 = build_filled_curve(xs2, ys2, ax2, PINK_3B1B)

        label2 = Text("NOT Normal", font_size=22, color=RED, weight=BOLD)
        label2.next_to(ax2, DOWN, buff=0.15)
        check2 = Text("Skewed right", font_size=16, color=RED)
        check2.next_to(label2, DOWN, buff=0.08)

        # --- Distribution 3: Bimodal ---
        ax3 = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.35, 0.1],
            x_length=3.4,
            y_length=2.2,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax3.shift(RIGHT * 4.2 + DOWN * 0.2)

        xs3 = np.linspace(-4, 4, 200)
        ys3 = 0.5 * norm.pdf(xs3, -1.5, 0.7) + 0.5 * norm.pdf(xs3, 1.5, 0.7)
        curve3 = build_filled_curve(xs3, ys3, ax3, YELLOW_3B1B)

        label3 = Text("NOT Normal", font_size=22, color=RED, weight=BOLD)
        label3.next_to(ax3, DOWN, buff=0.15)
        check3 = Text("Bimodal (two peaks)", font_size=16, color=RED)
        check3.next_to(label3, DOWN, buff=0.08)

        # Animate all three appearing sequentially
        for ax, curve, lbl, chk in [
            (ax1, curve1, label1, check1),
            (ax2, curve2, label2, check2),
            (ax3, curve3, label3, check3),
        ]:
            self.play(Create(ax), run_time=0.3)
            self.play(FadeIn(curve), run_time=0.4)
            self.play(Write(lbl), Write(chk), run_time=0.4)

        self.wait(1)

        # Clear the three panels
        self.play(
            *[FadeOut(m) for m in [
                ax1, curve1, label1, check1,
                ax2, curve2, label2, check2,
                ax3, curve3, label3, check3,
            ]]
        )

        # ── PART 2: Empirical Rule on the normal curve ──
        emp_title = Text("The Empirical Rule (68-95-99.7)", font_size=36,
                         color=YELLOW_3B1B, weight=BOLD)
        emp_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(emp_title))

        # Large central axes
        ax_big = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.45, 0.1],
            x_length=10,
            y_length=3.8,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax_big.shift(DOWN * 0.6)

        # Tick labels for sigma multiples
        sigma_labels = VGroup()
        for k in range(-3, 4):
            if k == 0:
                txt = Text("μ", font_size=22)
            else:
                sign = "+" if k > 0 else "-"
                txt = Text(f"μ {sign} {abs(k)}σ", font_size=18)
            txt.next_to(ax_big.c2p(k, 0), DOWN, buff=0.15)
            sigma_labels.add(txt)

        self.play(Create(ax_big), Write(sigma_labels), run_time=0.8)

        # Draw full bell curve outline
        xs_full = np.linspace(-4, 4, 300)
        ys_full = norm.pdf(xs_full, 0, 1)
        outline_pts = [ax_big.c2p(x, y) for x, y in zip(xs_full, ys_full)]
        outline = VMobject(stroke_color=WHITE, stroke_width=2)
        outline.set_points_smoothly(outline_pts)
        self.play(Create(outline), run_time=0.6)

        # Colored bands: 1-sigma, 2-sigma, 3-sigma
        band_data = [
            (-1, 1, BLUE, "68%", 0.55),
            (-2, -1, TEAL_3B1B, None, 0.35),
            (1, 2, TEAL_3B1B, "95%", 0.35),
            (-3, -2, GREEN_3B1B, None, 0.25),
            (2, 3, GREEN_3B1B, "99.7%", 0.25),
        ]

        band_mobjects = []
        pct_labels = []

        for lo, hi, color, pct_text, opacity in band_data:
            xs_band = np.linspace(lo, hi, 80)
            ys_band = norm.pdf(xs_band, 0, 1)
            band = build_filled_curve(xs_band, ys_band, ax_big, color,
                                      fill_opacity=opacity)
            band_mobjects.append(band)

        # Animate bands appearing: center first, then expanding outward
        # 1-sigma band
        self.play(FadeIn(band_mobjects[0]), run_time=0.5)
        pct_68 = Text("68%", font_size=28, color=WHITE, weight=BOLD)
        pct_68.move_to(ax_big.c2p(0, 0.15))
        self.play(Write(pct_68), run_time=0.3)

        # 2-sigma bands (both sides)
        self.play(FadeIn(band_mobjects[1]), FadeIn(band_mobjects[2]), run_time=0.5)
        pct_95 = Text("95%", font_size=24, color=WHITE, weight=BOLD)
        pct_95.move_to(ax_big.c2p(0, 0.06))
        self.play(Write(pct_95), run_time=0.3)

        # 3-sigma bands (both sides)
        self.play(FadeIn(band_mobjects[3]), FadeIn(band_mobjects[4]), run_time=0.5)
        pct_997 = Text("99.7%", font_size=20, color=WHITE, weight=BOLD)
        pct_997.move_to(ax_big.c2p(0, -0.06))
        self.play(Write(pct_997), run_time=0.3)

        self.wait(1)

        # Clear empirical rule section
        self.play(
            *[FadeOut(m) for m in [
                emp_title, ax_big, sigma_labels, outline,
                pct_68, pct_95, pct_997,
                *band_mobjects,
            ]]
        )

        # ── PART 3: Binomial approximation to Normal ──
        binom_title = Text("Binomial Approximation to Normal", font_size=34,
                           color=TEAL_3B1B, weight=BOLD)
        binom_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(binom_title))

        # Small n, skewed p  -->  NOT Normal
        ax_small = Axes(
            x_range=[-0.5, 8, 1],
            y_range=[0, 0.45, 0.1],
            x_length=4.5,
            y_length=2.8,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax_small.shift(LEFT * 3 + DOWN * 0.6)

        small_label = Text("n=5, p=0.1", font_size=22, color=PINK_3B1B)
        small_label.next_to(ax_small, UP, buff=0.1)
        not_normal = Text("NOT Normal", font_size=22, color=RED, weight=BOLD)
        not_normal.next_to(ax_small, DOWN, buff=0.1)
        skewed_note = Text("(skewed, small n)", font_size=16, color=RED)
        skewed_note.next_to(not_normal, DOWN, buff=0.05)

        # Bars for Binom(5, 0.1)
        small_bars = VGroup()
        for k in range(6):
            prob = binom.pmf(k, 5, 0.1)
            bar = Rectangle(
                width=0.5,
                height=max(prob * 6, 0.01),
                fill_color=PINK_3B1B,
                fill_opacity=0.7,
                stroke_color=WHITE,
                stroke_width=1,
            )
            bar.move_to(ax_small.c2p(k, prob / 2))
            small_bars.add(bar)

        self.play(Create(ax_small), Write(small_label), run_time=0.5)
        self.play(
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in small_bars], lag_ratio=0.08),
            run_time=0.8,
        )
        self.play(Write(not_normal), Write(skewed_note), run_time=0.4)

        # Large n  -->  Approximately Normal
        ax_large = Axes(
            x_range=[0, 50, 5],
            y_range=[0, 0.12, 0.02],
            x_length=4.5,
            y_length=2.8,
            axis_config={"include_tip": False, "include_numbers": False,
                         "stroke_width": 1.5},
        )
        ax_large.shift(RIGHT * 3 + DOWN * 0.6)

        large_label = Text("n=100, p=0.3", font_size=22, color=BLUE_3B1B)
        large_label.next_to(ax_large, UP, buff=0.1)
        yes_normal = Text("Approx. Normal", font_size=22, color=GREEN, weight=BOLD)
        yes_normal.next_to(ax_large, DOWN, buff=0.1)
        bell_note = Text("(bell-shaped, large n)", font_size=16, color=GREEN_3B1B)
        bell_note.next_to(yes_normal, DOWN, buff=0.05)

        # Bars for Binom(100, 0.3)
        large_bars = VGroup()
        for k in range(15, 46):
            prob = binom.pmf(k, 100, 0.3)
            bar = Rectangle(
                width=0.14,
                height=max(prob * 24, 0.01),
                fill_color=BLUE_3B1B,
                fill_opacity=0.7,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            bar.move_to(ax_large.c2p(k, prob / 2))
            large_bars.add(bar)

        # Overlay normal curve
        mu_large = 100 * 0.3
        sig_large = np.sqrt(100 * 0.3 * 0.7)
        xs_norm = np.linspace(15, 45, 150)
        ys_norm = norm.pdf(xs_norm, mu_large, sig_large)
        norm_pts = [ax_large.c2p(x, y) for x, y in zip(xs_norm, ys_norm)]
        norm_curve = VMobject(stroke_color=YELLOW, stroke_width=2.5)
        norm_curve.set_points_smoothly(norm_pts)

        self.play(Create(ax_large), Write(large_label), run_time=0.5)
        self.play(
            LaggedStart(*[GrowFromEdge(b, DOWN) for b in large_bars], lag_ratio=0.02),
            run_time=0.8,
        )
        self.play(Create(norm_curve), run_time=0.6)
        self.play(Write(yes_normal), Write(bell_note), run_time=0.4)

        # Arrow connecting the two
        arrow = Arrow(
            ax_small.get_right() + RIGHT * 0.1,
            ax_large.get_left() + LEFT * 0.1,
            color=WHITE,
            buff=0.15,
        )
        arrow_label = Text("increase n", font_size=20, color=WHITE)
        arrow_label.next_to(arrow, UP, buff=0.08)
        self.play(Create(arrow), Write(arrow_label), run_time=0.4)

        self.wait(1)

        # ── PART 4: Key Insight Box ──
        self.play(
            *[FadeOut(m) for m in [
                binom_title, ax_small, small_label, not_normal, skewed_note,
                small_bars, ax_large, large_label, yes_normal, bell_note,
                large_bars, norm_curve, arrow, arrow_label,
            ]]
        )

        insight_lines = VGroup(
            Text("Key Insight", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text("Check: unimodal, roughly symmetric, bell-shaped",
                 font_size=26, color=WHITE),
            Text("Empirical Rule: 68-95-99.7", font_size=26, color=WHITE),
        ).arrange(DOWN, buff=0.2)
        insight_lines.next_to(title, DOWN, buff=1)

        box = SurroundingRectangle(
            insight_lines, color=YELLOW_3B1B, buff=0.25, corner_radius=0.15
        )

        self.play(Write(insight_lines), Create(box))
        self.wait(2)
