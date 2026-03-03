"""
Point Estimate Capstone (AP Stats Unit 5, Topic 5.4 Capstone)

Synthesis animation for Topic 5.4 key concepts: point estimators and their
relationship to population parameters, variability of estimators modeled by
probability (sampling distributions), unbiased vs biased estimators, and
common AP Exam traps around sampling variability vs bias.

Run with: manim -qm --format=mp4 apstat_54_point_estimate_capstone.py PointEstimateCapstone
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class PointEstimateCapstone(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Topic 5.4 Key Concepts", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Point Estimators and Sampling Distributions",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== TAKEAWAY 1: Point estimator -> parameter ==========
        tk1_num = Text("1", font_size=28, color=BLUE_3B1B, weight=BOLD)
        tk1_text = Text(
            "A sample statistic is a point estimator",
            font_size=24,
        )
        tk1_text2 = Text(
            "of the population parameter",
            font_size=24,
        )

        tk1_group = VGroup(tk1_num, VGroup(tk1_text, tk1_text2).arrange(DOWN, buff=0.06))
        tk1_group.arrange(RIGHT, buff=0.2, aligned_edge=UP)
        tk1_group.next_to(subtitle, DOWN, buff=0.5)
        tk1_group.shift(LEFT * 0.5)

        self.play(Write(tk1_num), run_time=0.3)
        self.play(Write(tk1_text), Write(tk1_text2), run_time=0.8)
        self.wait(0.3)

        # Examples in blue
        examples = MathTex(
            r"\bar{x} \to \mu", r",\quad",
            r"\hat{p} \to p", r",\quad",
            r"s \to \sigma",
            font_size=36, color=BLUE_3B1B,
        )
        examples.next_to(tk1_group, DOWN, buff=0.3)
        self.play(Write(examples), run_time=1.0)
        self.wait(1.0)

        # Fade takeaway 1
        tk1_all = VGroup(tk1_num, tk1_text, tk1_text2, examples)
        self.play(FadeOut(tk1_all), run_time=0.4)

        # ========== TAKEAWAY 2: Variability modeled by probability ==========
        tk2_num = Text("2", font_size=28, color=BLUE_3B1B, weight=BOLD)
        tk2_text = Text(
            "Estimators exhibit variability",
            font_size=24,
        )
        tk2_text2 = Text(
            "modeled by probability",
            font_size=24,
        )

        tk2_header = VGroup(tk2_num, VGroup(tk2_text, tk2_text2).arrange(DOWN, buff=0.06))
        tk2_header.arrange(RIGHT, buff=0.2, aligned_edge=UP)
        tk2_header.next_to(subtitle, DOWN, buff=0.5)
        tk2_header.shift(LEFT * 0.5)

        self.play(Write(tk2_num), run_time=0.3)
        self.play(Write(tk2_text), Write(tk2_text2), run_time=0.8)
        self.wait(0.3)

        # Visual: dots representing sample means scattered around mu
        mu_val = 0.0
        mu_line = DashedLine(
            DOWN * 0.6 + RIGHT * mu_val,
            UP * 1.8 + RIGHT * mu_val,
            color=YELLOW_3B1B, stroke_width=2.5,
        )
        mu_line.shift(DOWN * 1.3)
        mu_label = MathTex(r"\mu", font_size=30, color=YELLOW_3B1B)
        mu_label.next_to(mu_line, UP, buff=0.1)

        self.play(Create(mu_line), Write(mu_label), run_time=0.5)

        # Generate scattered sample means
        sample_x_vals = np.random.normal(0, 0.8, 20)
        dots = VGroup()
        for i, x in enumerate(sample_x_vals):
            dot = Dot(
                point=RIGHT * x + DOWN * 1.3 + UP * np.random.uniform(0.0, 1.5),
                color=BLUE_3B1B, radius=0.06,
            )
            dots.add(dot)

        # Label
        xbar_labels = VGroup()
        for i in range(3):
            lab = MathTex(r"\bar{x}", font_size=18, color=BLUE_3B1B)
            lab.move_to(dots[i].get_center() + UP * 0.18)
            xbar_labels.add(lab)

        scatter_caption = Text(
            "Each dot = one sample mean", font_size=20, color=GRAY,
        )
        scatter_caption.shift(DOWN * 2.5)

        self.play(
            LaggedStart(
                *[FadeIn(dot, scale=0.5) for dot in dots],
                lag_ratio=0.04,
            ),
            run_time=1.0,
        )
        self.play(
            *[Write(lab) for lab in xbar_labels],
            Write(scatter_caption),
            run_time=0.5,
        )
        self.wait(1.0)

        # Fade takeaway 2
        tk2_all = VGroup(
            tk2_num, tk2_text, tk2_text2,
            mu_line, mu_label, dots, xbar_labels, scatter_caption,
        )
        self.play(FadeOut(tk2_all), run_time=0.4)

        # ========== TAKEAWAY 3: Unbiased estimators ==========
        tk3_num = Text("3", font_size=28, color=BLUE_3B1B, weight=BOLD)
        tk3_text = Text(
            "Unbiased: mean of sampling distribution",
            font_size=24,
        )
        tk3_text2 = Text(
            "= parameter",
            font_size=24,
        )

        tk3_header = VGroup(tk3_num, VGroup(tk3_text, tk3_text2).arrange(DOWN, buff=0.06))
        tk3_header.arrange(RIGHT, buff=0.2, aligned_edge=UP)
        tk3_header.next_to(subtitle, DOWN, buff=0.5)
        tk3_header.shift(LEFT * 0.5)

        self.play(Write(tk3_num), run_time=0.3)
        self.play(Write(tk3_text), Write(tk3_text2), run_time=0.8)
        self.wait(0.3)

        # Visual: green check for x-bar (unbiased), red X for range (biased)
        # --- x-bar row ---
        xbar_stat = MathTex(r"\bar{x}", font_size=32, color=BLUE_3B1B)
        xbar_arrow = MathTex(r"\to", font_size=28)
        xbar_param = MathTex(r"\mu", font_size=32, color=YELLOW_3B1B)
        xbar_check = Text("Unbiased", font_size=22, color=GREEN_3B1B, weight=BOLD)

        xbar_row = VGroup(xbar_stat, xbar_arrow, xbar_param, xbar_check)
        xbar_row.arrange(RIGHT, buff=0.3)

        # --- range row ---
        range_stat = Text("sample range", font_size=22, color=PINK_3B1B)
        range_arrow = MathTex(r"\to", font_size=28)
        range_param = Text("pop. range", font_size=22, color=YELLOW_3B1B)
        range_x = Text("Biased", font_size=22, color=RED, weight=BOLD)

        range_row = VGroup(range_stat, range_arrow, range_param, range_x)
        range_row.arrange(RIGHT, buff=0.3)

        bias_comparison = VGroup(xbar_row, range_row).arrange(DOWN, buff=0.4, aligned_edge=LEFT)
        bias_comparison.shift(DOWN * 0.8)

        # Animate x-bar row with check
        self.play(Write(xbar_stat), Write(xbar_arrow), Write(xbar_param), run_time=0.5)
        self.play(Write(xbar_check), run_time=0.4)
        self.wait(0.3)

        # Animate range row with X
        self.play(Write(range_stat), Write(range_arrow), Write(range_param), run_time=0.5)
        self.play(Write(range_x), run_time=0.4)

        # Explanation
        bias_explain = Text(
            "Sample range consistently underestimates population range",
            font_size=20, color=GRAY,
        )
        bias_explain.next_to(bias_comparison, DOWN, buff=0.35)
        self.play(Write(bias_explain), run_time=0.6)
        self.wait(1.0)

        # Fade takeaway 3
        tk3_all = VGroup(
            tk3_num, tk3_text, tk3_text2,
            bias_comparison, bias_explain,
        )
        self.play(FadeOut(tk3_all), run_time=0.4)

        # ========== AP EXAM TRAP BOX ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        trap_title = Text(
            "Common AP Exam Trap", font_size=30,
            color=YELLOW_3B1B, weight=BOLD,
        )
        trap_title.next_to(title, DOWN, buff=0.5)

        trap_line1 = Text(
            "One sample does NOT equal bias!",
            font_size=26, color=RED, weight=BOLD,
        )
        trap_line2 = Text(
            "A single sample where", font_size=22,
        )
        trap_math = MathTex(
            r"\bar{x} \neq \mu", font_size=32, color=BLUE_3B1B,
        )
        trap_line3 = Text(
            "is just sampling variability,", font_size=22,
        )
        trap_line4 = Text(
            "NOT evidence of bias.", font_size=24, color=RED, weight=BOLD,
        )

        trap_content = VGroup(
            trap_title, trap_line1,
            Text("", font_size=6),
            trap_line2, trap_math, trap_line3, trap_line4,
        ).arrange(DOWN, buff=0.12)
        trap_content.move_to(ORIGIN + DOWN * 0.15)

        trap_box = SurroundingRectangle(
            trap_content, color=YELLOW_3B1B, buff=0.35,
            corner_radius=0.15, stroke_width=3,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in trap_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(trap_box), run_time=0.5)
        self.wait(2.0)

        # Fade trap box
        self.play(FadeOut(trap_content), FadeOut(trap_box), run_time=0.5)

        # ========== FINAL INSIGHT BOX ==========
        insight_title = Text(
            "How to Check for Bias", font_size=30,
            color=GREEN_3B1B, weight=BOLD,
        )
        insight_line1 = Text(
            "Find the mean of ALL possible", font_size=24,
        )
        insight_line2 = Text(
            "sample statistics and compare", font_size=24,
        )
        insight_line3 = Text(
            "to the parameter.", font_size=24,
        )
        insight_spacer = Text("", font_size=8)
        insight_formula = MathTex(
            r"\text{If } E(\hat{\theta}) = \theta \implies \text{unbiased}",
            font_size=30, color=GREEN_3B1B,
        )
        insight_formula2 = MathTex(
            r"\text{If } E(\hat{\theta}) \neq \theta \implies \text{biased}",
            font_size=30, color=RED,
        )

        insight_content = VGroup(
            insight_title,
            insight_line1, insight_line2, insight_line3,
            insight_spacer,
            insight_formula, insight_formula2,
        ).arrange(DOWN, buff=0.12)
        insight_content.move_to(ORIGIN + DOWN * 0.2)

        insight_box = SurroundingRectangle(
            insight_content, color=GREEN_3B1B, buff=0.35,
            corner_radius=0.15, stroke_width=3,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(insight_box), run_time=0.5)
        self.wait(2.5)
