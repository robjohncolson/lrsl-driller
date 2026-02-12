"""
Probability Calculations for p-hat_1 - p-hat_2 (AP Stats Unit 5, Topic 5.6)

Walks through a full probability calculation for the difference of two
sample proportions. Shows the four-step pipeline: identify parameters,
compute mean and standard deviation, find z-score, look up probability.
Finishes with an animated normal curve with shaded right tail.

Run with:
    manim -qm --format=mp4 apstat_56_diff_prop_probability.py DiffPropProbability
"""

from manim import *
import numpy as np


class DiffPropProbability(Scene):
    def construct(self):
        # ---- Style constants ----
        self.camera.background_color = "#1C1C1C"

        BLUE_3B1B = "#3B82F6"
        YELLOW_3B1B = "#FACC15"
        TEAL_3B1B = "#2DD4BF"
        GREEN_3B1B = "#22C55E"
        PINK_3B1B = "#EC4899"

        # ---- Numerical parameters ----
        p1 = 0.65
        p2 = 0.50
        n1 = 100
        n2 = 120
        observed = 0.20  # the boundary we're asked about

        mu = p1 - p2  # 0.15
        var1 = p1 * (1 - p1) / n1   # 0.002275
        var2 = p2 * (1 - p2) / n2   # 0.002083333
        sigma = np.sqrt(var1 + var2)  # ~0.06601
        z = (observed - mu) / sigma   # ~0.7574

        # Normal PDF for the sampling distribution of p-hat_1 - p-hat_2
        def normal_pdf(x):
            return (1.0 / (sigma * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - mu) / sigma) ** 2)

        # ================================================================
        #  TITLE
        # ================================================================
        title = Text(
            "Probability Calculations: p\u0302\u2081 \u2212 p\u0302\u2082",
            font_size=42, weight=BOLD,
        )
        title.to_edge(UP, buff=0.35)
        self.play(Write(title), run_time=0.8)
        self.wait(0.3)

        # ================================================================
        #  SETUP — state the problem
        # ================================================================
        setup_lines = VGroup(
            Text("Two populations with proportions:", font_size=26),
            MathTex(
                r"p_1 = 0.65,\; n_1 = 100 \qquad p_2 = 0.50,\; n_2 = 120",
                font_size=30,
            ),
            Text("Find  P(p\u0302\u2081 \u2212 p\u0302\u2082 > 0.20)", font_size=32,
                 color=YELLOW_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.2)
        setup_lines.next_to(title, DOWN, buff=0.35)

        for line in setup_lines:
            self.play(Write(line), run_time=0.5)
            self.wait(0.15)
        self.wait(0.5)

        # Shrink question to upper-right, fade context
        self.play(
            FadeOut(setup_lines[0]),
            FadeOut(setup_lines[1]),
            setup_lines[2].animate.scale(0.7).to_corner(UR, buff=0.45).shift(DOWN * 0.25),
            run_time=0.6,
        )

        # ================================================================
        #  STEP 1 — Identify parameters
        # ================================================================
        step1_label = Text(
            "Step 1: Identify parameters",
            font_size=26, color=TEAL_3B1B,
        )
        step1_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step1_label), run_time=0.5)
        self.wait(0.2)

        params = VGroup(
            MathTex(r"p_1 = 0.65", font_size=30),
            MathTex(r"n_1 = 100", font_size=30),
            MathTex(r"p_2 = 0.50", font_size=30),
            MathTex(r"n_2 = 120", font_size=30),
        ).arrange_in_grid(rows=2, cols=2, buff=(1.0, 0.2))
        params.next_to(step1_label, DOWN, buff=0.35)

        param_box = SurroundingRectangle(
            params, color=TEAL_3B1B, buff=0.25, corner_radius=0.1,
        )

        self.play(FadeIn(params), Create(param_box), run_time=0.8)
        self.wait(0.8)

        # Clear step 1
        self.play(
            FadeOut(step1_label),
            FadeOut(params),
            FadeOut(param_box),
            run_time=0.4,
        )

        # ================================================================
        #  STEP 2 — Calculate mu and sigma
        # ================================================================
        step2_label = Text(
            "Step 2: Calculate \u03BC and \u03C3",
            font_size=26, color=BLUE_3B1B,
        )
        step2_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step2_label), run_time=0.5)
        self.wait(0.2)

        # --- Mean ---
        mu_formula = MathTex(
            r"\mu_{\hat{p}_1 - \hat{p}_2} = p_1 - p_2",
            font_size=30,
        )
        mu_calc = MathTex(
            r"= 0.65 - 0.50 = 0.15",
            font_size=30, color=BLUE_3B1B,
        )
        mu_group = VGroup(mu_formula, mu_calc).arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        mu_group.next_to(step2_label, DOWN, buff=0.3).shift(LEFT * 2.5)

        self.play(Write(mu_formula), run_time=0.6)
        self.play(Write(mu_calc), run_time=0.5)
        self.wait(0.3)

        # --- Standard deviation ---
        sigma_formula = MathTex(
            r"\sigma = \sqrt{\frac{p_1(1-p_1)}{n_1} + \frac{p_2(1-p_2)}{n_2}}",
            font_size=28,
        )
        sigma_sub = MathTex(
            r"= \sqrt{\frac{0.65(0.35)}{100} + \frac{0.50(0.50)}{120}}",
            font_size=26,
        )
        sigma_vals = MathTex(
            r"= \sqrt{0.002275 + 0.002083}",
            font_size=28,
        )
        sigma_result = MathTex(
            r"= \sqrt{0.004358} \approx 0.066",
            font_size=30, color=BLUE_3B1B,
        )
        sigma_group = VGroup(sigma_formula, sigma_sub, sigma_vals, sigma_result).arrange(
            DOWN, buff=0.1, aligned_edge=LEFT,
        )
        sigma_group.next_to(mu_group, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(Write(sigma_formula), run_time=0.6)
        self.play(Write(sigma_sub), run_time=0.6)
        self.play(Write(sigma_vals), run_time=0.5)
        self.play(Write(sigma_result), run_time=0.5)
        self.wait(0.6)

        # Clear step 2 math (keep label briefly)
        self.play(
            FadeOut(step2_label),
            FadeOut(mu_group),
            FadeOut(sigma_group),
            run_time=0.4,
        )

        # ================================================================
        #  STEP 3 — Find z-score
        # ================================================================
        step3_label = Text(
            "Step 3: Find the z-score",
            font_size=26, color=YELLOW_3B1B,
        )
        step3_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step3_label), run_time=0.5)
        self.wait(0.2)

        z_formula = MathTex(
            r"z = \frac{(\hat{p}_1 - \hat{p}_2) - \mu}{\sigma}",
            font_size=32,
        )
        z_formula.next_to(step3_label, DOWN, buff=0.35)
        self.play(Write(z_formula), run_time=0.6)
        self.wait(0.2)

        z_sub = MathTex(
            r"= \frac{0.20 - 0.15}{0.066}",
            font_size=32,
        )
        z_sub.next_to(z_formula, DOWN, buff=0.15)
        self.play(Write(z_sub), run_time=0.5)
        self.wait(0.2)

        z_num = MathTex(
            r"= \frac{0.05}{0.066}",
            font_size=32,
        )
        z_num.next_to(z_sub, DOWN, buff=0.15)
        self.play(Write(z_num), run_time=0.5)
        self.wait(0.2)

        z_final = MathTex(
            r"\approx 0.76",
            font_size=36, color=YELLOW_3B1B,
        )
        z_final.next_to(z_num, DOWN, buff=0.15)
        self.play(Write(z_final), run_time=0.5)
        self.wait(0.3)

        # Flash the z-score
        z_box_flash = SurroundingRectangle(z_final, color=YELLOW_3B1B, buff=0.1)
        self.play(Create(z_box_flash), run_time=0.3)
        self.play(FadeOut(z_box_flash), run_time=0.3)
        self.wait(0.3)

        # Clear step 3 calculation details
        self.play(
            FadeOut(step3_label),
            FadeOut(z_formula),
            FadeOut(z_sub),
            FadeOut(z_num),
            FadeOut(z_final),
            run_time=0.4,
        )

        # ================================================================
        #  STEP 4 — Normal curve + shaded area + probability
        # ================================================================
        step4_label = Text(
            "Step 4: Use normalcdf / z-table",
            font_size=26, color=PINK_3B1B,
        )
        step4_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step4_label), run_time=0.5)
        self.wait(0.2)

        # --- Build axes ---
        x_min = mu - 4 * sigma   # ~-0.114
        x_max = mu + 4 * sigma   # ~0.414

        axes = Axes(
            x_range=[x_min, x_max, sigma],
            y_range=[0, 7, 2],
            x_length=10,
            y_length=3.2,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 1.0)

        # Tick labels at mu +/- k*sigma
        x_labels = VGroup()
        x_ticks = VGroup()
        key_vals = [mu - 3 * sigma, mu - 2 * sigma, mu - sigma, mu, mu + sigma, mu + 2 * sigma, mu + 3 * sigma]
        for val in key_vals:
            label = Text(f"{val:.3f}", font_size=13)
            label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_labels.add(label)
            tick = Line(
                axes.c2p(val, -0.15), axes.c2p(val, 0.15),
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

        # Label the center
        mu_label = MathTex(
            r"\mu = 0.15",
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

        # --- Mark the observed value 0.20 ---
        obs_line = DashedLine(
            axes.c2p(observed, 0),
            axes.c2p(observed, normal_pdf(observed)),
            color=ManimColor(YELLOW_3B1B), stroke_width=3,
        )
        obs_dot = Dot(axes.c2p(observed, 0), color=ManimColor(YELLOW_3B1B), radius=0.07)
        obs_label = MathTex(r"0.20", font_size=24, color=ManimColor(YELLOW_3B1B))
        obs_label.next_to(obs_dot, DOWN, buff=0.2)

        self.play(
            Create(obs_line),
            FadeIn(obs_dot),
            Write(obs_label),
            run_time=0.7,
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
        self.wait(0.3)

        # Arrow + label pointing at shaded region
        tail_note = Text(
            "P(p\u0302\u2081 \u2212 p\u0302\u2082 > 0.20)",
            font_size=20, color=ManimColor(PINK_3B1B),
        )
        tail_note.move_to(axes.c2p(observed + 2.5 * sigma, 3.0))
        tail_arrow = Arrow(
            tail_note.get_left(),
            axes.c2p(observed + 1.2 * sigma, 1.0),
            buff=0.05, color=ManimColor(PINK_3B1B), stroke_width=2,
        )
        self.play(Write(tail_note), Create(tail_arrow), run_time=0.5)
        self.wait(0.3)

        # --- Probability calculation (right side) ---
        prob_calc = VGroup(
            Text("z = 0.76", font_size=24, color=ManimColor(YELLOW_3B1B)),
            Text("P(Z > 0.76)", font_size=24),
            Text("= 1 \u2212 0.7764", font_size=24),
            Text("\u2248 0.224", font_size=28, color=ManimColor(GREEN_3B1B), weight=BOLD),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        prob_calc.to_edge(RIGHT, buff=0.6).shift(UP * 0.8)

        for line in prob_calc:
            self.play(Write(line), run_time=0.4)
            self.wait(0.15)
        self.wait(0.3)

        # Label inside the shaded area
        area_pct = Text("~22.4%", font_size=22, color=WHITE, weight=BOLD)
        area_pct.move_to(axes.c2p(observed + 1.8 * sigma, 1.8))
        self.play(Write(area_pct), run_time=0.4)
        self.wait(0.5)

        # ================================================================
        #  FINAL ANSWER BOX
        # ================================================================
        # Clear intermediate annotations
        self.play(
            FadeOut(step4_label),
            FadeOut(prob_calc),
            FadeOut(tail_note),
            FadeOut(tail_arrow),
            FadeOut(area_pct),
            FadeOut(mu_label),
            FadeOut(mu_arrow),
            FadeOut(obs_label),
            FadeOut(setup_lines[2]),
            run_time=0.5,
        )

        # Final answer
        answer_text = MathTex(
            r"P(\hat{p}_1 - \hat{p}_2 > 0.20) \approx 0.224",
            font_size=34, color=ManimColor(GREEN_3B1B),
        )
        answer_box = SurroundingRectangle(
            answer_text, color=ManimColor(GREEN_3B1B), buff=0.25, corner_radius=0.1,
        )
        answer_group = VGroup(answer_box, answer_text)
        answer_group.to_edge(RIGHT, buff=0.5).shift(UP * 1.3)

        self.play(Create(answer_box), Write(answer_text), run_time=0.8)
        self.wait(0.5)

        # Interpretation line
        interp = Text(
            "About 22.4% chance that p\u0302\u2081 \u2212 p\u0302\u2082 exceeds 0.20",
            font_size=24, color=GRAY,
        )
        interp.next_to(answer_group, DOWN, buff=0.3)
        self.play(Write(interp), run_time=0.7)
        self.wait(0.5)

        # Flash the shaded area for emphasis
        self.play(shaded_area.animate.set_opacity(0.85), run_time=0.3)
        self.play(shaded_area.animate.set_opacity(0.55), run_time=0.3)
        self.wait(1.5)

        # ================================================================
        #  FADE OUT
        # ================================================================
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
        )
        self.wait(0.5)
