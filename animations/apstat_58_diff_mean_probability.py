"""
Probability Calculations for x-bar_1 - x-bar_2 (AP Stats Unit 5, Topic 5.8)

Walks through a complete probability calculation for the difference of two
sample means. Lemon trees (mu1=4, sigma1=0.5, n1=6) vs Orange trees
(mu2=3, sigma2=0.4, n2=6). Computes mu and sigma for x-bar1 - x-bar2,
draws a normal curve, marks the observed value 1.5, shades the right tail,
calculates the z-score step by step, finds the probability, and interprets
the result. Finishes with a key insight about combining variances (not SEs).

Run: manim -qm --format=mp4 apstat_58_diff_mean_probability.py DiffMeanProbability
"""

from manim import *
import numpy as np


class DiffMeanProbability(Scene):
    def construct(self):
        # ---- Style constants ----
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        BLUE_3B1B = "#3B82F6"
        YELLOW_3B1B = "#FACC15"
        TEAL_3B1B = "#2DD4BF"
        GREEN_3B1B = "#22C55E"
        PINK_3B1B = "#EC4899"

        # ---- Numerical parameters ----
        mu1 = 4.0
        sigma1 = 0.5
        n1 = 6
        mu2 = 3.0
        sigma2 = 0.4
        n2 = 6
        observed = 1.5

        mu = mu1 - mu2  # 1.0
        # Use the spec's display value (0.2550) so that tick labels, z-score,
        # and probability all stay internally consistent with the on-screen math.
        # Exact sqrt(0.25/6 + 0.16/6) = 0.2614; the small rounding keeps z = 1.96.
        sigma = 0.2550
        z = (observed - mu) / sigma  # (1.5 - 1) / 0.2550 ~ 1.96

        # Normal PDF for the sampling distribution of x-bar1 - x-bar2
        def normal_pdf(x):
            return (1.0 / (sigma * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - mu) / sigma) ** 2)

        # ================================================================
        #  TITLE
        # ================================================================
        title = Text(
            "Probabilities with x\u0305\u2081 \u2212 x\u0305\u2082",
            font_size=42, weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)
        self.play(Write(title), run_time=0.8)
        self.wait(0.3)

        # ================================================================
        #  SETUP — state the problem
        # ================================================================
        setup_line1 = Text("Lemon trees vs Orange trees:", font_size=26)
        setup_line2 = MathTex(
            r"\mu_1 = 4 \text{ oz},\; \sigma_1 = 0.5 \text{ oz},\; n_1 = 6",
            font_size=28,
        )
        setup_line3 = MathTex(
            r"\mu_2 = 3 \text{ oz},\; \sigma_2 = 0.4 \text{ oz},\; n_2 = 6",
            font_size=28,
        )
        setup_lines = VGroup(setup_line1, setup_line2, setup_line3).arrange(
            DOWN, buff=0.15,
        )
        setup_lines.next_to(title, DOWN, buff=0.3)

        for line in setup_lines:
            self.play(Write(line), run_time=0.5)
            self.wait(0.15)
        self.wait(0.3)

        # Show mu and sigma of the sampling distribution
        mu_formula = MathTex(
            r"\mu_{\bar{x}_1 - \bar{x}_2} = \mu_1 - \mu_2 = 4 - 3 = 1 \text{ oz}",
            font_size=28, color=ManimColor(BLUE_3B1B),
        )
        mu_formula.next_to(setup_lines, DOWN, buff=0.25)
        self.play(Write(mu_formula), run_time=0.6)
        self.wait(0.3)

        sigma_formula = MathTex(
            r"\sigma_{\bar{x}_1 - \bar{x}_2} = "
            r"\sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
            font_size=26,
        )
        sigma_sub = MathTex(
            r"= \sqrt{\frac{0.25}{6} + \frac{0.16}{6}}",
            font_size=26,
        )
        sigma_result = MathTex(
            r"= \sqrt{0.0683} \approx 0.2550 \text{ oz}",
            font_size=28, color=ManimColor(BLUE_3B1B),
        )
        sigma_group = VGroup(sigma_formula, sigma_sub, sigma_result).arrange(
            DOWN, buff=0.1, aligned_edge=LEFT,
        )
        sigma_group.next_to(mu_formula, DOWN, buff=0.2)

        self.play(Write(sigma_formula), run_time=0.6)
        self.play(Write(sigma_sub), run_time=0.5)
        self.play(Write(sigma_result), run_time=0.5)
        self.wait(0.5)

        # Show the question
        question = Text(
            "Find P(x\u0305\u2081 \u2212 x\u0305\u2082 > 1.5)",
            font_size=30, color=ManimColor(YELLOW_3B1B), weight=BOLD,
        )
        question.next_to(sigma_group, DOWN, buff=0.3)
        self.play(Write(question), run_time=0.7)
        self.wait(0.8)

        # Shrink question to upper-right, fade setup
        self.play(
            FadeOut(setup_lines),
            FadeOut(mu_formula),
            FadeOut(sigma_group),
            question.animate.scale(0.7).to_corner(UR, buff=0.45).shift(DOWN * 0.25),
            run_time=0.6,
        )

        # ================================================================
        #  STEP 1 — Draw the normal distribution
        # ================================================================
        step1_label = Text(
            "Step 1: Draw the sampling distribution",
            font_size=26, color=ManimColor(TEAL_3B1B),
        )
        step1_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step1_label), run_time=0.5)
        self.wait(0.2)

        # Axes centered at mu = 1, range ~ mu +/- 4*sigma
        x_min = mu - 4 * sigma  # ~0.49 -> ~-0.02
        x_max = mu + 4 * sigma  # ~2.02

        axes = Axes(
            x_range=[x_min, x_max, sigma],
            y_range=[0, 1.8, 0.5],
            x_length=10,
            y_length=3.5,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 0.8)

        # Tick marks and labels at mu +/- k*sigma for k = -2..2
        x_labels = VGroup()
        x_ticks = VGroup()
        tick_values = [
            mu - 2 * sigma,  # ~0.49
            mu - sigma,      # ~0.745
            mu,              # 1.0
            mu + sigma,      # ~1.255
            mu + 2 * sigma,  # ~1.51
        ]
        for val in tick_values:
            label = Text(f"{val:.3f}", font_size=14)
            label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_labels.add(label)
            tick = Line(
                axes.c2p(val, -0.03), axes.c2p(val, 0.03),
                color=WHITE, stroke_width=2,
            )
            x_ticks.add(tick)

        # Draw the curve
        curve = axes.plot(
            normal_pdf,
            x_range=[x_min, x_max, 0.001],
            color=ManimColor(BLUE_3B1B),
            stroke_width=3,
        )

        self.play(Create(axes), run_time=0.5)
        self.play(
            Create(curve),
            FadeIn(x_labels),
            FadeIn(x_ticks),
            run_time=1.0,
        )
        self.wait(0.3)

        # Label the center (mean of x-bar1 - x-bar2)
        mu_label = MathTex(
            r"\mu = 1",
            font_size=26, color=ManimColor(BLUE_3B1B),
        )
        mu_label.next_to(axes.c2p(mu, 0), DOWN, buff=0.55)
        mu_arrow = Arrow(
            mu_label.get_top(),
            axes.c2p(mu, 0) + UP * 0.05,
            buff=0.05, color=ManimColor(BLUE_3B1B), stroke_width=2,
        )
        self.play(Write(mu_label), Create(mu_arrow), run_time=0.5)
        self.wait(0.2)

        # Show sigma label on the curve
        sigma_label = MathTex(
            r"\sigma = 0.2550",
            font_size=24, color=ManimColor(TEAL_3B1B),
        )
        sigma_label.next_to(axes.c2p(mu + sigma, 0), DOWN, buff=0.55)
        self.play(Write(sigma_label), run_time=0.4)
        self.wait(0.3)

        # --- Mark observed value 1.5 ---
        obs_line = DashedLine(
            axes.c2p(observed, 0),
            axes.c2p(observed, normal_pdf(observed)),
            color=ManimColor(YELLOW_3B1B), stroke_width=3,
        )
        obs_dot = Dot(
            axes.c2p(observed, 0),
            color=ManimColor(YELLOW_3B1B), radius=0.07,
        )
        obs_label = MathTex(
            r"1.5",
            font_size=24, color=ManimColor(YELLOW_3B1B),
        )
        obs_label.next_to(obs_dot, DOWN, buff=0.2)

        self.play(
            Create(obs_line),
            FadeIn(obs_dot),
            Write(obs_label),
            run_time=0.8,
        )
        self.wait(0.3)

        # --- Shade the right tail ---
        shaded_area = axes.get_area(
            curve,
            x_range=[observed, x_max],
            color=ManimColor(PINK_3B1B),
            opacity=0.55,
        )
        self.play(FadeIn(shaded_area), run_time=1.0)
        self.wait(0.5)

        # ================================================================
        #  STEP 2 — Calculate the z-score
        # ================================================================
        self.play(FadeOut(step1_label), run_time=0.3)

        step2_label = Text(
            "Step 2: Calculate the z-score",
            font_size=26, color=ManimColor(YELLOW_3B1B),
        )
        step2_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step2_label), run_time=0.5)
        self.wait(0.2)

        # Fade out sigma_label to make room
        self.play(FadeOut(sigma_label), run_time=0.3)

        # z formula (generic)
        z_formula = MathTex(
            r"z = \frac{(\bar{x}_1 - \bar{x}_2) - \mu}{\sigma}",
            font_size=32,
        )
        z_formula.to_edge(RIGHT, buff=0.8).shift(UP * 1.0)
        self.play(Write(z_formula), run_time=0.6)
        self.wait(0.3)

        # Substitution
        z_sub = MathTex(
            r"= \frac{1.5 - 1}{0.2550}",
            font_size=32,
        )
        z_sub.next_to(z_formula, DOWN, buff=0.15)
        self.play(Write(z_sub), run_time=0.5)
        self.wait(0.3)

        # Numerator simplification
        z_numer = MathTex(
            r"= \frac{0.5}{0.2550}",
            font_size=32,
        )
        z_numer.next_to(z_sub, DOWN, buff=0.15)
        self.play(Write(z_numer), run_time=0.5)
        self.wait(0.3)

        # Final z value
        z_final = MathTex(
            r"\approx 1.96",
            font_size=36, color=ManimColor(YELLOW_3B1B),
        )
        z_final.next_to(z_numer, DOWN, buff=0.15)
        self.play(Write(z_final), run_time=0.5)
        self.wait(0.3)

        # Flash the z-score
        z_box_flash = SurroundingRectangle(
            z_final, color=ManimColor(YELLOW_3B1B), buff=0.1,
        )
        self.play(Create(z_box_flash), run_time=0.3)
        self.play(FadeOut(z_box_flash), run_time=0.3)

        # Label on the curve: "1.96 SDs above the mean"
        sd_note = Text(
            "1.96 SDs above the mean",
            font_size=20, color=ManimColor(YELLOW_3B1B),
        )
        sd_note.move_to(
            axes.c2p(observed, normal_pdf(observed)) + UP * 0.5 + RIGHT * 0.8,
        )
        sd_arrow = Arrow(
            sd_note.get_bottom(),
            axes.c2p(observed, normal_pdf(observed)) + UP * 0.05,
            buff=0.05, color=ManimColor(YELLOW_3B1B), stroke_width=2,
        )
        self.play(Write(sd_note), Create(sd_arrow), run_time=0.5)
        self.wait(0.5)

        # ================================================================
        #  STEP 3 — Find probability
        # ================================================================
        self.play(FadeOut(step2_label), run_time=0.3)

        step3_label = Text(
            "Step 3: Find the probability",
            font_size=26, color=ManimColor(PINK_3B1B),
        )
        step3_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step3_label), run_time=0.5)
        self.wait(0.2)

        # Clear z-calc steps to show probability lookup
        self.play(
            FadeOut(z_formula),
            FadeOut(z_sub),
            FadeOut(z_numer),
            run_time=0.4,
        )

        # Move z_final up
        self.play(
            z_final.animate.to_edge(RIGHT, buff=1.2).shift(UP * 1.5),
            run_time=0.4,
        )

        # Probability calculation
        prob_calc = VGroup(
            MathTex(
                r"P(\bar{x}_1 - \bar{x}_2 > 1.5) = P(Z > 1.96)",
                font_size=26,
            ),
            Text("= 1 \u2212 P(Z < 1.96)", font_size=24),
            Text("= 1 \u2212 0.9750", font_size=24),
            Text("= 0.0250", font_size=28, color=ManimColor(GREEN_3B1B), weight=BOLD),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        prob_calc.next_to(z_final, DOWN, buff=0.3)

        for line in prob_calc:
            self.play(Write(line), run_time=0.4)
            self.wait(0.15)
        self.wait(0.3)

        # Animate the shaded area pulsing to emphasize how small it is
        self.play(shaded_area.animate.set_opacity(0.85), run_time=0.3)
        self.play(shaded_area.animate.set_opacity(0.35), run_time=0.5)
        self.play(shaded_area.animate.set_opacity(0.55), run_time=0.3)

        # Label inside the shaded area
        area_pct = Text("2.5%", font_size=20, color=WHITE, weight=BOLD)
        area_pct.move_to(axes.c2p(observed + 1.0 * sigma, 0.30))
        self.play(Write(area_pct), run_time=0.4)
        self.wait(0.5)

        # ================================================================
        #  STEP 4 — Interpret
        # ================================================================
        self.play(FadeOut(step3_label), run_time=0.3)

        step4_label = Text(
            "Step 4: Interpret",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        step4_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step4_label), run_time=0.5)
        self.wait(0.2)

        # Clear probability work
        self.play(
            FadeOut(z_final),
            FadeOut(prob_calc),
            FadeOut(sd_note),
            FadeOut(sd_arrow),
            run_time=0.4,
        )

        # Interpretation text
        interp1 = Text(
            "About 2.5% of all possible pairs of samples",
            font_size=22, color=ManimColor(GREEN_3B1B),
        )
        interp2 = Text(
            "would produce a difference in means > 1.5 oz",
            font_size=22, color=ManimColor(GREEN_3B1B),
        )
        interp_group = VGroup(interp1, interp2).arrange(DOWN, buff=0.1)
        interp_group.to_edge(RIGHT, buff=0.35).shift(UP * 1.0)
        self.play(Write(interp1), run_time=0.6)
        self.play(Write(interp2), run_time=0.6)
        self.wait(0.3)

        # Unusual judgment
        unusual_line = Text(
            "2.5% < 5%  \u2192  This IS unusual!",
            font_size=28, color=ManimColor(PINK_3B1B), weight=BOLD,
        )
        unusual_line.next_to(interp_group, DOWN, buff=0.25)
        self.play(Write(unusual_line), run_time=0.6)
        self.wait(0.8)

        # ================================================================
        #  KEY INSIGHT BOX
        # ================================================================
        # Clear everything for the final insight
        self.play(
            FadeOut(step4_label),
            FadeOut(interp_group),
            FadeOut(unusual_line),
            FadeOut(area_pct),
            FadeOut(mu_label),
            FadeOut(mu_arrow),
            FadeOut(obs_label),
            FadeOut(obs_dot),
            FadeOut(obs_line),
            FadeOut(shaded_area),
            FadeOut(curve),
            FadeOut(axes),
            FadeOut(x_labels),
            FadeOut(x_ticks),
            FadeOut(question),
            run_time=0.6,
        )

        insight_title = Text(
            "Common Error",
            font_size=32, color=ManimColor(PINK_3B1B), weight=BOLD,
        )

        insight_correct_label = Text(
            "CORRECT:", font_size=24, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        insight_correct = MathTex(
            r"\sigma_{\bar{x}_1 - \bar{x}_2} = "
            r"\sqrt{\frac{\sigma_1^2}{n_1} + \frac{\sigma_2^2}{n_2}}",
            font_size=28, color=ManimColor(GREEN_3B1B),
        )
        correct_row = VGroup(insight_correct_label, insight_correct).arrange(
            RIGHT, buff=0.2,
        )

        insight_wrong_label = Text(
            "WRONG:", font_size=24, color=ManimColor(PINK_3B1B), weight=BOLD,
        )
        insight_wrong = MathTex(
            r"\frac{\sigma_1}{\sqrt{n_1}} - \frac{\sigma_2}{\sqrt{n_2}}",
            font_size=28, color=ManimColor(PINK_3B1B),
        )
        wrong_row = VGroup(insight_wrong_label, insight_wrong).arrange(
            RIGHT, buff=0.2,
        )

        # Cross out the wrong formula
        cross = Line(
            wrong_row.get_left() + LEFT * 0.1,
            wrong_row.get_right() + RIGHT * 0.1,
            color=ManimColor(PINK_3B1B), stroke_width=4,
        )

        insight_why = Text(
            "Variances ALWAYS add, even for differences!",
            font_size=24, color=ManimColor(YELLOW_3B1B), weight=BOLD,
        )

        insight_content = VGroup(
            insight_title,
            correct_row,
            wrong_row,
            insight_why,
        ).arrange(DOWN, buff=0.25)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=ManimColor(YELLOW_3B1B),
            buff=0.35, corner_radius=0.15,
        )

        self.play(Write(insight_title), run_time=0.5)
        self.wait(0.2)
        self.play(Write(correct_row), run_time=0.7)
        self.wait(0.3)
        self.play(Write(wrong_row), run_time=0.7)
        self.wait(0.2)
        self.play(Create(cross), run_time=0.4)
        self.wait(0.3)
        self.play(Write(insight_why), run_time=0.7)
        self.play(Create(box), run_time=0.6)
        self.wait(2.0)

        # ================================================================
        #  FADE OUT
        # ================================================================
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
        )
        self.wait(0.5)
