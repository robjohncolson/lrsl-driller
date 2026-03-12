"""
Alpha Tradeoff (AP Stats Unit 6, Topic 6.7g)

Shows the tradeoff when changing alpha: lowering alpha decreases
Type I error probability but increases Type II error (beta) and
decreases power.

Run with: manim -qm --format=mp4 apstat_67_alpha_tradeoff.py AlphaTradeoff
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


class AlphaTradeoff(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("The Alpha Tradeoff", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        p0 = 0.50
        pa = 0.62
        se = 0.05

        axes = Axes(
            x_range=[0.25, 0.85, 0.05],
            y_range=[0, 10, 2],
            x_length=10,
            y_length=3.0,
            axis_config={"include_tip": False, "color": GREY_B},
        ).shift(DOWN * 0.5)

        for val in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
            lbl = Text(str(val), font_size=14, color=GREY_B)
            lbl.next_to(axes.c2p(val, 0), DOWN, buff=0.1)
            axes.add(lbl)

        null_curve = axes.plot(lambda x: normal_pdf(x, p0, se), x_range=[0.3, 0.7], color=ManimColor(BLUE_3B1B))
        alt_curve = axes.plot(lambda x: normal_pdf(x, pa, se), x_range=[0.4, 0.85], color=ManimColor(GREEN_3B1B))

        null_lbl = Text("H\u2080", font_size=16, color=BLUE_3B1B, weight=BOLD)
        null_lbl.next_to(axes.c2p(p0, normal_pdf(p0, p0, se)), UP, buff=0.1)
        alt_lbl = Text("True p", font_size=16, color=GREEN_3B1B, weight=BOLD)
        alt_lbl.next_to(axes.c2p(pa, normal_pdf(pa, pa, se)), UP, buff=0.1)

        self.play(Create(axes), Create(null_curve), Write(null_lbl), Create(alt_curve), Write(alt_lbl), run_time=0.7)
        self.wait(0.3)

        # ========== ALPHA = 0.05 ==========
        alpha_text = Text("\u03b1 = 0.05", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        alpha_text.next_to(title, DOWN, buff=0.25)
        self.play(Write(alpha_text), run_time=0.3)

        z_05 = 1.645
        p_crit_05 = p0 + z_05 * se
        crit_line = axes.get_vertical_line(
            axes.c2p(p_crit_05, normal_pdf(p_crit_05, p0, se)),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        alpha_region = axes.get_area(null_curve, x_range=[p_crit_05, 0.7], color=RED_3B1B, opacity=0.4)
        beta_region = axes.get_area(alt_curve, x_range=[0.4, p_crit_05], color=ORANGE_3B1B, opacity=0.35)
        power_region = axes.get_area(alt_curve, x_range=[p_crit_05, 0.85], color=GREEN_3B1B, opacity=0.4)

        a_lbl = Text("\u03b1", font_size=22, color=RED_3B1B, weight=BOLD)
        a_lbl.move_to(axes.c2p(0.64, 1.0))
        b_lbl = Text("\u03b2", font_size=22, color=ORANGE_3B1B, weight=BOLD)
        b_lbl.move_to(axes.c2p(0.53, 1.8))
        pw_lbl = Text("Power", font_size=16, color=GREEN_3B1B, weight=BOLD)
        pw_lbl.move_to(axes.c2p(0.72, 2.0))

        self.play(
            Create(crit_line),
            FadeIn(alpha_region), Write(a_lbl),
            FadeIn(beta_region), Write(b_lbl),
            FadeIn(power_region), Write(pw_lbl),
            run_time=0.7,
        )
        self.wait(1.0)

        # ========== TRANSITION: Lower alpha to 0.01 ==========
        lower_text = Text("Lower \u03b1 to 0.01...", font_size=20, color=TEAL_3B1B)
        lower_text.to_edge(DOWN, buff=0.3)
        self.play(Write(lower_text), run_time=0.4)
        self.wait(0.5)

        z_01 = 2.326
        p_crit_01 = p0 + z_01 * se

        new_crit_line = axes.get_vertical_line(
            axes.c2p(p_crit_01, normal_pdf(p_crit_01, p0, se)),
            line_config={"color": YELLOW_3B1B, "stroke_width": 3},
        )
        new_alpha = axes.get_area(null_curve, x_range=[p_crit_01, 0.7], color=RED_3B1B, opacity=0.4)
        new_beta = axes.get_area(alt_curve, x_range=[0.4, p_crit_01], color=ORANGE_3B1B, opacity=0.35)
        new_power = axes.get_area(alt_curve, x_range=[p_crit_01, 0.85], color=GREEN_3B1B, opacity=0.4)

        new_alpha_text = Text("\u03b1 = 0.01", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        new_alpha_text.move_to(alpha_text)

        new_b_lbl = Text("\u03b2 \u2191", font_size=22, color=ORANGE_3B1B, weight=BOLD)
        new_b_lbl.move_to(axes.c2p(0.56, 2.2))
        new_pw_lbl = Text("Power \u2193", font_size=16, color=GREEN_3B1B, weight=BOLD)
        new_pw_lbl.move_to(axes.c2p(0.74, 1.5))

        self.play(
            Transform(alpha_text, new_alpha_text),
            Transform(crit_line, new_crit_line),
            Transform(alpha_region, new_alpha),
            Transform(beta_region, new_beta),
            Transform(power_region, new_power),
            Transform(b_lbl, new_b_lbl),
            Transform(pw_lbl, new_pw_lbl),
            FadeOut(a_lbl),
            FadeOut(lower_text),
            run_time=1.2,
        )

        new_a_lbl = Text("\u03b1", font_size=18, color=RED_3B1B, weight=BOLD)
        new_a_lbl.move_to(axes.c2p(0.67, 0.5))
        self.play(Write(new_a_lbl), run_time=0.3)
        self.wait(1.0)

        # ========== SUMMARY ==========
        self.play(*[FadeOut(m) for m in self.mobjects if m is not title], run_time=0.5)

        rows = [
            ("Lower \u03b1", "\u2192 less Type I error", "\u2192 more Type II error (\u03b2 \u2191)", "\u2192 less power"),
            ("Raise \u03b1", "\u2192 more Type I error", "\u2192 less Type II error (\u03b2 \u2193)", "\u2192 more power"),
        ]

        colors = [RED_3B1B, GREEN_3B1B]
        prev = title
        for i, (action, t1, t2, pw) in enumerate(rows):
            action_t = Text(action, font_size=24, color=colors[i], weight=BOLD)
            action_t.next_to(prev, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)
            items = VGroup(
                Text(t1, font_size=18, color=GREY_B),
                Text(t2, font_size=18, color=GREY_B),
                Text(pw, font_size=18, color=GREY_B),
            ).arrange(DOWN, buff=0.06, aligned_edge=LEFT).next_to(action_t, DOWN, buff=0.1, aligned_edge=LEFT)
            self.play(Write(action_t), run_time=0.3)
            for item in items:
                self.play(Write(item), run_time=0.25)
            prev = items

        closing = Text(
            "You cannot reduce both error types at the same time (with fixed n).",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.5)
        closing_box = SurroundingRectangle(closing, color=YELLOW_3B1B, buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
