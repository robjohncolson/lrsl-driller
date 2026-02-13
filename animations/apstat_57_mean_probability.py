"""
Calculating Probabilities with x-bar (AP Stats Unit 5, Topic 5.7d)

Walks through a full probability calculation for a sample mean. Sets up
a lemon weight scenario (mu=4, sigma=0.5, n=6), computes sigma_xbar,
draws a normal curve, marks the observed value, calculates the z-score,
shades the right tail, finds the probability, and interprets the result.
Finishes with a key insight comparing individual vs. average variability.

Run with:
    manim -qm --format=mp4 apstat_57_mean_probability.py MeanProbability
"""

from manim import *
import numpy as np


class MeanProbability(Scene):
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
        mu = 4.0
        sigma = 0.5
        n = 6
        xbar_obs = 4.5
        sigma_xbar = sigma / np.sqrt(n)  # 0.5/sqrt(6) ~ 0.2041
        z = (xbar_obs - mu) / sigma_xbar  # (4.5-4)/0.2041 ~ 2.449

        # Normal PDF for the sampling distribution of x-bar
        def normal_pdf(x):
            return (1.0 / (sigma_xbar * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - mu) / sigma_xbar) ** 2)

        # ================================================================
        #  TITLE
        # ================================================================
        title = Text(
            "Probabilities with x\u0305",
            font_size=44, weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)
        self.play(Write(title), run_time=0.8)
        self.wait(0.3)

        # ================================================================
        #  SETUP — state the problem
        # ================================================================
        setup_lines = VGroup(
            Text("Lemons have weights:", font_size=26),
            MathTex(
                r"\mu = 4 \text{ oz}, \quad \sigma = 0.5 \text{ oz}, \quad n = 6",
                font_size=30,
            ),
        ).arrange(DOWN, buff=0.15)
        setup_lines.next_to(title, DOWN, buff=0.35)

        for line in setup_lines:
            self.play(Write(line), run_time=0.5)
            self.wait(0.15)

        # Show sigma_xbar calculation
        sigma_formula = MathTex(
            r"\sigma_{\bar{x}} = \frac{\sigma}{\sqrt{n}}",
            font_size=30,
        )
        sigma_sub = MathTex(
            r"= \frac{0.5}{\sqrt{6}}",
            font_size=30,
        )
        sigma_result = MathTex(
            r"\approx 0.204",
            font_size=32, color=ManimColor(BLUE_3B1B),
        )
        sigma_group = VGroup(sigma_formula, sigma_sub, sigma_result).arrange(
            DOWN, buff=0.1, aligned_edge=LEFT,
        )
        sigma_group.next_to(setup_lines, DOWN, buff=0.3)

        self.play(Write(sigma_formula), run_time=0.6)
        self.play(Write(sigma_sub), run_time=0.5)
        self.play(Write(sigma_result), run_time=0.4)
        self.wait(0.5)

        # Show the question
        question = Text(
            "Would it be unusual to get x\u0305 = 4.5 or greater?",
            font_size=30, color=ManimColor(YELLOW_3B1B), weight=BOLD,
        )
        question.next_to(sigma_group, DOWN, buff=0.35)
        self.play(Write(question), run_time=0.7)
        self.wait(0.8)

        # Shrink question to upper-right, fade setup
        self.play(
            FadeOut(setup_lines),
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

        # Axes centered at mu = 4, range ~ mu +/- 4*sigma_xbar
        x_min = mu - 4 * sigma_xbar   # ~3.18
        x_max = mu + 4 * sigma_xbar   # ~4.82

        axes = Axes(
            x_range=[x_min, x_max, sigma_xbar],
            y_range=[0, 2.2, 0.5],
            x_length=10,
            y_length=3.5,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 0.8)

        # Tick marks and labels at mu +/- k*sigma for k = -3..3
        x_labels = VGroup()
        x_ticks = VGroup()
        for k in range(-3, 4):
            val = mu + k * sigma_xbar
            label = Text(f"{val:.2f}", font_size=14)
            label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_labels.add(label)
            tick = Line(
                axes.c2p(val, -0.04), axes.c2p(val, 0.04),
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

        # Label the center (mean of x-bar)
        mu_label = MathTex(
            r"\mu_{\bar{x}} = 4",
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

        # Show sigma_xbar on the curve
        sigma_label = MathTex(
            r"\sigma_{\bar{x}} = 0.204",
            font_size=24, color=ManimColor(TEAL_3B1B),
        )
        sigma_label.next_to(axes.c2p(mu + sigma_xbar, 0), DOWN, buff=0.55)
        self.play(Write(sigma_label), run_time=0.4)
        self.wait(0.3)

        # --- Mark x-bar = 4.5 ---
        obs_line = DashedLine(
            axes.c2p(xbar_obs, 0),
            axes.c2p(xbar_obs, normal_pdf(xbar_obs)),
            color=ManimColor(YELLOW_3B1B), stroke_width=3,
        )
        obs_dot = Dot(axes.c2p(xbar_obs, 0), color=ManimColor(YELLOW_3B1B), radius=0.07)
        obs_label = MathTex(
            r"\bar{x} = 4.5",
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
            x_range=[xbar_obs, x_max],
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
            r"z = \frac{\bar{x} - \mu}{\sigma / \sqrt{n}}",
            font_size=32,
        )
        z_formula.to_edge(RIGHT, buff=0.8).shift(UP * 1.0)
        self.play(Write(z_formula), run_time=0.6)
        self.wait(0.3)

        # Substitution
        z_sub = MathTex(
            r"= \frac{4.5 - 4}{0.204}",
            font_size=32,
        )
        z_sub.next_to(z_formula, DOWN, buff=0.15)
        self.play(Write(z_sub), run_time=0.5)
        self.wait(0.3)

        # Numerator simplification
        z_numer = MathTex(
            r"= \frac{0.5}{0.204}",
            font_size=32,
        )
        z_numer.next_to(z_sub, DOWN, buff=0.15)
        self.play(Write(z_numer), run_time=0.5)
        self.wait(0.3)

        # Final z value
        z_final = MathTex(
            r"= 2.45",
            font_size=36, color=ManimColor(YELLOW_3B1B),
        )
        z_final.next_to(z_numer, DOWN, buff=0.15)
        self.play(Write(z_final), run_time=0.5)
        self.wait(0.3)

        # Flash the z-score
        z_box_flash = SurroundingRectangle(z_final, color=ManimColor(YELLOW_3B1B), buff=0.1)
        self.play(Create(z_box_flash), run_time=0.3)
        self.play(FadeOut(z_box_flash), run_time=0.3)

        # Label on the curve: "2.45 SDs above the mean"
        sd_note = Text(
            "2.45 SDs above the mean",
            font_size=20, color=ManimColor(YELLOW_3B1B),
        )
        sd_note.move_to(axes.c2p(xbar_obs, normal_pdf(xbar_obs)) + UP * 0.5 + RIGHT * 0.8)
        sd_arrow = Arrow(
            sd_note.get_bottom(),
            axes.c2p(xbar_obs, normal_pdf(xbar_obs)) + UP * 0.05,
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
                r"P(\bar{x} \geq 4.5) = P(Z \geq 2.45)",
                font_size=26,
            ),
            Text("= 1 \u2212 P(Z < 2.45)", font_size=24),
            Text("= 1 \u2212 0.9929", font_size=24),
            Text("= 0.0071", font_size=28, color=ManimColor(GREEN_3B1B), weight=BOLD),
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
        area_pct = Text("0.71%", font_size=20, color=WHITE, weight=BOLD)
        area_pct.move_to(axes.c2p(xbar_obs + 1.0 * sigma_xbar, 0.35))
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
            "Getting x\u0305 \u2265 4.5 happens in only 0.71% of samples",
            font_size=24, color=ManimColor(GREEN_3B1B),
        )
        interp1.to_edge(RIGHT, buff=0.4).shift(UP * 1.2)
        self.play(Write(interp1), run_time=0.7)
        self.wait(0.3)

        interp2 = Text(
            "This IS unusual!",
            font_size=30, color=ManimColor(PINK_3B1B), weight=BOLD,
        )
        interp2.next_to(interp1, DOWN, buff=0.25)
        self.play(Write(interp2), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        #  KEY INSIGHT BOX
        # ================================================================
        # Clear everything for the final insight
        self.play(
            FadeOut(step4_label),
            FadeOut(interp1),
            FadeOut(interp2),
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

        insight_content = VGroup(
            Text(
                "One lemon weighing 4.5 oz?",
                font_size=28,
            ),
            Text(
                "Not surprising.",
                font_size=28, color=ManimColor(TEAL_3B1B),
            ),
            Text("", font_size=10),  # spacer
            Text(
                "Average of 6 lemons \u2265 4.5 oz?",
                font_size=28,
            ),
            Text(
                "Very surprising!",
                font_size=28, color=ManimColor(PINK_3B1B), weight=BOLD,
            ),
            Text("", font_size=10),  # spacer
            Text(
                "AVERAGES are LESS VARIABLE than individual values",
                font_size=26, color=ManimColor(YELLOW_3B1B), weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.15)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=ManimColor(YELLOW_3B1B), buff=0.35, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.25,
            ),
            run_time=2.5,
        )
        self.play(Create(box), run_time=0.6)
        self.wait(2.0)

        # ================================================================
        #  FADE OUT
        # ================================================================
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
        )
        self.wait(0.5)
