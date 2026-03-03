"""
Large Counts Condition (AP Stats Unit 5, Topic 5.5)

Demonstrates the Large Counts Condition for sampling distributions of sample
proportions: np >= 10 AND n(1-p) >= 10. Shows two concrete examples:
  - Example 1 (PASSES): n=100, p=0.30 -> np=30, n(1-p)=70 -> approx Normal
  - Example 2 (FAILS): n=150, p=0.03 -> np=4.5 < 10 -> NOT Normal (skewed)
Builds mini-histograms for each case to visually contrast the normal vs skewed
shape, then ends with a key insight box emphasizing that BOTH conditions must
be satisfied.

Run with: manim -qm --format=mp4 apstat_55_large_counts_condition.py LargeCountsCondition
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class LargeCountsCondition(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Large Counts Condition", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "When Can We Use a Normal Model for p-hat?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== SHOW THE CONDITION ==========
        condition_label = Text("The condition:", font_size=24, color=GRAY)
        condition_label.next_to(subtitle, DOWN, buff=0.4)
        self.play(Write(condition_label), run_time=0.4)

        np_cond = MathTex(r"np \geq 10", font_size=36, color=BLUE)
        and_text = Text("AND", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        nq_cond = MathTex(r"n(1-p) \geq 10", font_size=36, color=BLUE)

        condition_row = VGroup(np_cond, and_text, nq_cond).arrange(RIGHT, buff=0.4)
        condition_row.next_to(condition_label, DOWN, buff=0.25)

        self.play(Write(np_cond), run_time=0.5)
        self.play(Write(and_text), run_time=0.3)
        self.play(Write(nq_cond), run_time=0.5)
        self.wait(0.5)

        # Box the condition
        cond_box = SurroundingRectangle(
            condition_row, color=BLUE, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(cond_box), run_time=0.4)
        self.wait(0.5)

        # ========== TRANSITION: Shrink condition to top ==========
        cond_group = VGroup(condition_label, condition_row, cond_box)
        self.play(
            FadeOut(subtitle),
            cond_group.animate.scale(0.6).to_corner(UR, buff=0.3).shift(DOWN * 0.4),
            run_time=0.7,
        )

        # ========== EXAMPLE 1: PASSES (n=100, p=0.30) ==========
        ex1_title = Text(
            "Example 1:  n = 100,  p = 0.30",
            font_size=28, color=BLUE_3B1B, weight=BOLD,
        )
        ex1_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex1_title))
        self.wait(0.3)

        # Check np
        ex1_np_label = Text("Check np:", font_size=24, color=WHITE)
        ex1_np_label.move_to(LEFT * 3.5 + UP * 0.8)
        self.play(Write(ex1_np_label), run_time=0.3)

        ex1_np_calc = MathTex(
            r"100 \times 0.30 = 30",
            font_size=28,
        )
        ex1_np_calc.next_to(ex1_np_label, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(ex1_np_calc), run_time=0.5)

        ex1_np_result = VGroup(
            MathTex(r"30 \geq 10", font_size=28, color=ManimColor(GREEN_3B1B)),
            Text("  Pass", font_size=24, color=ManimColor(GREEN_3B1B), weight=BOLD),
        ).arrange(RIGHT, buff=0.15)
        ex1_np_result.next_to(ex1_np_calc, DOWN, buff=0.12, aligned_edge=LEFT)
        self.play(Write(ex1_np_result), run_time=0.4)
        self.wait(0.2)

        # Check n(1-p)
        ex1_nq_label = Text("Check n(1-p):", font_size=24, color=WHITE)
        ex1_nq_label.move_to(LEFT * 3.5 + DOWN * 0.3)
        self.play(Write(ex1_nq_label), run_time=0.3)

        ex1_nq_calc = MathTex(
            r"100 \times 0.70 = 70",
            font_size=28,
        )
        ex1_nq_calc.next_to(ex1_nq_label, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(ex1_nq_calc), run_time=0.5)

        ex1_nq_result = VGroup(
            MathTex(r"70 \geq 10", font_size=28, color=ManimColor(GREEN_3B1B)),
            Text("  Pass", font_size=24, color=ManimColor(GREEN_3B1B), weight=BOLD),
        ).arrange(RIGHT, buff=0.15)
        ex1_nq_result.next_to(ex1_nq_calc, DOWN, buff=0.12, aligned_edge=LEFT)
        self.play(Write(ex1_nq_result), run_time=0.4)
        self.wait(0.3)

        # Build a bell-shaped histogram on the right side
        ex1_hist_title = Text("Sampling Distribution", font_size=20, color=TEAL_3B1B)
        ex1_hist_title.move_to(RIGHT * 2.5 + UP * 1.0)
        self.play(Write(ex1_hist_title), run_time=0.3)

        # Simulate: binomial(n=100, p=0.30) -> approx normal
        samples_1 = np.random.binomial(100, 0.30, 2000) / 100.0
        bins_1 = np.linspace(0.15, 0.45, 20)
        counts_1, _ = np.histogram(samples_1, bins=bins_1)
        max_c1 = counts_1.max()

        ex1_bars = VGroup()
        bar_w = 0.2
        max_h = 1.8
        base_x = 2.5
        base_y = -1.2

        for i, c in enumerate(counts_1):
            h = (c / max_c1) * max_h
            bar = Rectangle(
                width=bar_w,
                height=max(h, 0.01),
                fill_color=GREEN_3B1B,
                fill_opacity=0.7,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            x_pos = base_x + (i - len(counts_1) / 2) * (bar_w + 0.02)
            bar.move_to(RIGHT * x_pos + UP * (base_y + h / 2))
            ex1_bars.add(bar)

        # x-axis line for ex1 histogram
        ex1_axis = Line(
            ex1_bars.get_left() + DOWN * 0.1 + LEFT * 0.1,
            ex1_bars.get_right() + DOWN * 0.1 + RIGHT * 0.1,
            color=WHITE, stroke_width=2,
        )
        ex1_axis.next_to(ex1_bars, DOWN, buff=0.05)

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in ex1_bars],
                lag_ratio=0.04,
            ),
            Create(ex1_axis),
            run_time=1.0,
        )

        # Verdict: Approximately Normal
        ex1_verdict = Text(
            "Approximately Normal",
            font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        ex1_verdict.next_to(ex1_axis, DOWN, buff=0.15)
        self.play(Write(ex1_verdict), run_time=0.4)
        self.wait(0.6)

        # ========== CLEAR EXAMPLE 1 ==========
        ex1_all = VGroup(
            ex1_title, ex1_np_label, ex1_np_calc, ex1_np_result,
            ex1_nq_label, ex1_nq_calc, ex1_nq_result,
            ex1_hist_title, ex1_bars, ex1_axis, ex1_verdict,
        )
        self.play(FadeOut(ex1_all), run_time=0.5)

        # ========== EXAMPLE 2: FAILS (n=150, p=0.03) ==========
        ex2_title = Text(
            "Example 2:  n = 150,  p = 0.03",
            font_size=28, color=PINK_3B1B, weight=BOLD,
        )
        ex2_title.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex2_title))
        self.wait(0.3)

        # Check np
        ex2_np_label = Text("Check np:", font_size=24, color=WHITE)
        ex2_np_label.move_to(LEFT * 3.5 + UP * 0.8)
        self.play(Write(ex2_np_label), run_time=0.3)

        ex2_np_calc = MathTex(
            r"150 \times 0.03 = 4.5",
            font_size=28,
        )
        ex2_np_calc.next_to(ex2_np_label, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(ex2_np_calc), run_time=0.5)

        ex2_np_result = VGroup(
            MathTex(r"4.5 < 10", font_size=28, color=RED),
            Text("  Fail", font_size=24, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.15)
        ex2_np_result.next_to(ex2_np_calc, DOWN, buff=0.12, aligned_edge=LEFT)
        self.play(Write(ex2_np_result), run_time=0.4)

        # Flash the failure in red
        flash_box = SurroundingRectangle(ex2_np_result, color=RED, buff=0.1)
        self.play(Create(flash_box), run_time=0.3)
        self.play(FadeOut(flash_box), run_time=0.3)
        self.wait(0.2)

        # Check n(1-p)
        ex2_nq_label = Text("Check n(1-p):", font_size=24, color=WHITE)
        ex2_nq_label.move_to(LEFT * 3.5 + DOWN * 0.3)
        self.play(Write(ex2_nq_label), run_time=0.3)

        ex2_nq_calc = MathTex(
            r"150 \times 0.97 = 145.5",
            font_size=28,
        )
        ex2_nq_calc.next_to(ex2_nq_label, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(ex2_nq_calc), run_time=0.5)

        ex2_nq_result = VGroup(
            MathTex(r"145.5 \geq 10", font_size=28, color=ManimColor(GREEN_3B1B)),
            Text("  Pass", font_size=24, color=ManimColor(GREEN_3B1B), weight=BOLD),
        ).arrange(RIGHT, buff=0.15)
        ex2_nq_result.next_to(ex2_nq_calc, DOWN, buff=0.12, aligned_edge=LEFT)
        self.play(Write(ex2_nq_result), run_time=0.4)
        self.wait(0.2)

        # "But one fails!" callout
        but_text = Text(
            "One condition fails -- NOT Normal!",
            font_size=22, color=RED, weight=BOLD,
        )
        but_text.move_to(LEFT * 2.5 + DOWN * 1.6)
        self.play(Write(but_text), run_time=0.5)
        self.wait(0.3)

        # Build a skewed histogram on the right side
        ex2_hist_title = Text("Sampling Distribution", font_size=20, color=TEAL_3B1B)
        ex2_hist_title.move_to(RIGHT * 2.5 + UP * 1.0)
        self.play(Write(ex2_hist_title), run_time=0.3)

        # Simulate: binomial(n=150, p=0.03) -> heavily right-skewed
        samples_2 = np.random.binomial(150, 0.03, 2000) / 150.0
        bins_2 = np.linspace(-0.005, 0.10, 16)
        counts_2, _ = np.histogram(samples_2, bins=bins_2)
        max_c2 = counts_2.max()

        ex2_bars = VGroup()
        base_x2 = 2.5
        base_y2 = -1.2

        for i, c in enumerate(counts_2):
            h = (c / max_c2) * max_h
            bar = Rectangle(
                width=bar_w,
                height=max(h, 0.01),
                fill_color=RED,
                fill_opacity=0.7,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            x_pos = base_x2 + (i - len(counts_2) / 2) * (bar_w + 0.02)
            bar.move_to(RIGHT * x_pos + UP * (base_y2 + h / 2))
            ex2_bars.add(bar)

        # x-axis line for ex2 histogram
        ex2_axis = Line(
            ex2_bars.get_left() + DOWN * 0.1 + LEFT * 0.1,
            ex2_bars.get_right() + DOWN * 0.1 + RIGHT * 0.1,
            color=WHITE, stroke_width=2,
        )
        ex2_axis.next_to(ex2_bars, DOWN, buff=0.05)

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in ex2_bars],
                lag_ratio=0.04,
            ),
            Create(ex2_axis),
            run_time=1.0,
        )

        # Verdict: NOT Normal
        ex2_verdict = Text(
            "NOT Normal -- Skewed Right",
            font_size=22, color=RED, weight=BOLD,
        )
        ex2_verdict.next_to(ex2_axis, DOWN, buff=0.15)
        self.play(Write(ex2_verdict), run_time=0.4)

        # Add a skew arrow to emphasize the tail
        skew_arrow = Arrow(
            ex2_bars.get_right() + UP * 0.3,
            ex2_bars.get_right() + RIGHT * 0.6 + UP * 0.3,
            color=RED, stroke_width=3, buff=0.05,
        )
        skew_label = Text("long tail", font_size=16, color=RED)
        skew_label.next_to(skew_arrow, UP, buff=0.05)
        self.play(Create(skew_arrow), Write(skew_label), run_time=0.4)
        self.wait(0.8)

        # ========== CLEAR EVERYTHING FOR KEY INSIGHT ==========
        ex2_all = VGroup(
            ex2_title, ex2_np_label, ex2_np_calc, ex2_np_result,
            ex2_nq_label, ex2_nq_calc, ex2_nq_result,
            ex2_hist_title, ex2_bars, ex2_axis, ex2_verdict,
            but_text, skew_arrow, skew_label,
        )
        self.play(
            FadeOut(ex2_all), FadeOut(cond_group), FadeOut(title),
            run_time=0.5,
        )

        # ========== KEY INSIGHT BOX ==========
        insight_content = VGroup(
            Text(
                "Large Counts Condition",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            MathTex(
                r"np \geq 10 \quad \text{AND} \quad n(1-p) \geq 10",
                font_size=34, color=BLUE,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "BOTH conditions must be met!",
                font_size=26, color=RED, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "Proportions near 0 or 1 need larger n",
                font_size=24, color=TEAL_3B1B,
            ),
            Text(
                "to satisfy both conditions.",
                font_size=24, color=TEAL_3B1B,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "When satisfied: the sampling distribution",
                font_size=22,
            ),
            Text(
                "of p-hat is approximately Normal.",
                font_size=22, color=ManimColor(GREEN_3B1B),
            ),
        ).arrange(DOWN, buff=0.1)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(2)
