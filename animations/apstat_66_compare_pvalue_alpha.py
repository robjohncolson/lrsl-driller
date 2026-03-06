"""
Compare p-Value to Alpha (AP Stats Unit 6, Topic 6.6)

Shows how to compare a p-value to the significance level alpha and
determine whether to reject or fail to reject H0. Visualizes the
decision boundary on a number line.

Run with: manim -qm --format=mp4 apstat_66_compare_pvalue_alpha.py ComparePValueAlpha
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


class ComparePValueAlpha(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Compare p-Value to \u03b1", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "The decision rule for significance tests",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== NUMBER LINE ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        line = NumberLine(
            x_range=[0, 0.25, 0.05],
            length=10,
            include_numbers=False,
        )
        line.shift(DOWN * 0.5)

        # Add tick labels as Text (no LaTeX)
        for val in [0.0, 0.05, 0.10, 0.15, 0.20, 0.25]:
            lbl = Text(f"{val:.2f}", font_size=16, color=GREY_B)
            lbl.next_to(line.n2p(val), DOWN, buff=0.15)
            line.add(lbl)

        self.play(Create(line), run_time=0.5)

        # Alpha marker
        alpha_val = 0.05
        alpha_pos = line.n2p(alpha_val)
        alpha_line = DashedLine(
            alpha_pos + UP * 1.2, alpha_pos + DOWN * 0.3,
            color=YELLOW_3B1B, stroke_width=3,
        )
        alpha_label = Text(
            "\u03b1 = 0.05", font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        alpha_label.next_to(alpha_line, UP, buff=0.1)
        self.play(Create(alpha_line), Write(alpha_label), run_time=0.5)

        # Regions
        reject_region = Rectangle(
            width=line.n2p(alpha_val)[0] - line.n2p(0)[0],
            height=0.6, color=GREEN_3B1B, fill_opacity=0.2,
        )
        reject_region.move_to(
            (line.n2p(0) + line.n2p(alpha_val)) / 2 + DOWN * 0.5
        )
        reject_text = Text(
            "Reject H\u2080", font_size=18, color=GREEN_3B1B, weight=BOLD,
        )
        reject_text.move_to(reject_region)

        fail_region = Rectangle(
            width=line.n2p(0.25)[0] - line.n2p(alpha_val)[0],
            height=0.6, color=RED_3B1B, fill_opacity=0.2,
        )
        fail_region.move_to(
            (line.n2p(alpha_val) + line.n2p(0.25)) / 2 + DOWN * 0.5
        )
        fail_text = Text(
            "Fail to reject H\u2080", font_size=18, color=RED_3B1B, weight=BOLD,
        )
        fail_text.move_to(fail_region)

        self.play(
            FadeIn(reject_region), Write(reject_text),
            FadeIn(fail_region), Write(fail_text),
            run_time=0.6,
        )
        self.wait(0.5)

        # ========== EXAMPLE 1: Small p-value ==========
        dot1 = Dot(line.n2p(0.02), color=GREEN_3B1B, radius=0.12)
        dot1_label = Text(
            "p-value = 0.02", font_size=18, color=GREEN_3B1B,
        )
        dot1_label.next_to(dot1, UP, buff=0.6)
        arrow1 = Arrow(
            dot1_label.get_bottom(), dot1.get_top(),
            color=GREEN_3B1B, buff=0.05, stroke_width=2,
        )

        self.play(FadeIn(dot1), Write(dot1_label), Create(arrow1), run_time=0.5)

        verdict1 = Text(
            "0.02 \u2264 0.05 \u2192 Reject H\u2080",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        verdict1.next_to(line, DOWN, buff=1.5)
        self.play(Write(verdict1), run_time=0.5)
        self.wait(1.0)

        # ========== EXAMPLE 2: Large p-value ==========
        self.play(
            FadeOut(dot1), FadeOut(dot1_label),
            FadeOut(arrow1), FadeOut(verdict1),
            run_time=0.3,
        )

        dot2 = Dot(line.n2p(0.14), color=RED_3B1B, radius=0.12)
        dot2_label = Text(
            "p-value = 0.14", font_size=18, color=RED_3B1B,
        )
        dot2_label.next_to(dot2, UP, buff=0.6)
        arrow2 = Arrow(
            dot2_label.get_bottom(), dot2.get_top(),
            color=RED_3B1B, buff=0.05, stroke_width=2,
        )

        self.play(FadeIn(dot2), Write(dot2_label), Create(arrow2), run_time=0.5)

        verdict2 = Text(
            "0.14 > 0.05 \u2192 Fail to reject H\u2080",
            font_size=22, color=RED_3B1B, weight=BOLD,
        )
        verdict2.next_to(line, DOWN, buff=1.5)
        self.play(Write(verdict2), run_time=0.5)
        self.wait(1.0)

        # ========== KEY RULE ==========
        self.play(*[FadeOut(mob) for mob in self.mobjects if mob != title])

        rule1 = Text(
            "p-value \u2264 \u03b1  \u2192  Reject H\u2080",
            font_size=30, color=GREEN_3B1B, weight=BOLD,
        )
        rule1.next_to(title, DOWN, buff=0.8)

        rule2 = Text(
            "p-value > \u03b1  \u2192  Fail to reject H\u2080",
            font_size=30, color=RED_3B1B, weight=BOLD,
        )
        rule2.next_to(rule1, DOWN, buff=0.4)

        self.play(Write(rule1), run_time=0.5)
        self.play(Write(rule2), run_time=0.5)
        self.wait(1.5)
