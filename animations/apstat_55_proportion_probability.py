"""
Standardizing p-hat and Finding Tail Probability (AP Stats Unit 5, Topic 5.5)

Sets up a sampling distribution for a sample proportion, calculates the
standard deviation of p-hat, marks an observed value on the normal curve,
computes the z-score step by step, shades the right tail, and reads off the
probability. Uses a concrete voter-support example throughout.

Run with:
    manim -qm --format=mp4 apstat_55_proportion_probability.py ProportionProbability
"""

from manim import *
import numpy as np


class ProportionProbability(Scene):
    def construct(self):
        # ---- Parameters ----
        p = 0.52
        q = 1 - p          # 0.48
        n = 400
        phat = 0.55
        sigma_phat = np.sqrt(p * q / n)  # 0.024979... ~ 0.025
        z = (phat - p) / sigma_phat       # 1.2012... ~ 1.20

        # ---- Colors ----
        CURVE_COLOR = BLUE
        SHADE_COLOR = RED
        Z_COLOR = YELLOW
        RESULT_COLOR = GREEN

        # Normal PDF for the sampling distribution of p-hat
        def normal_pdf(x):
            return (1.0 / (sigma_phat * np.sqrt(2 * np.pi))) * \
                   np.exp(-0.5 * ((x - p) / sigma_phat) ** 2)

        # ========== TITLE ==========
        title = Text("Finding P(p\u0302 > value)", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.3)

        # ========== CONTEXT / SETUP ==========
        setup_lines = VGroup(
            Text("52% of voters support a candidate.", font_size=26),
            Text("A poll surveys n = 400 voters.", font_size=26),
            Text("Find P(p\u0302 > 0.55)", font_size=30, color=Z_COLOR, weight=BOLD),
        ).arrange(DOWN, buff=0.15)
        setup_lines.next_to(title, DOWN, buff=0.35)

        for line in setup_lines:
            self.play(Write(line), run_time=0.5)
            self.wait(0.2)

        self.wait(0.5)

        # Shrink setup into corner to make room for curve
        self.play(
            FadeOut(setup_lines[0]),
            FadeOut(setup_lines[1]),
            setup_lines[2].animate.scale(0.75).to_corner(UR, buff=0.5).shift(DOWN * 0.3),
            run_time=0.6,
        )

        # ========== STEP 1: SAMPLING DISTRIBUTION CURVE ==========
        step1_label = Text(
            "Step 1: Sampling distribution of p\u0302",
            font_size=24, color=CURVE_COLOR,
        )
        step1_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step1_label))
        self.wait(0.3)

        # Axes centered at p = 0.52, range ~ p +/- 4*sigma
        x_min = p - 4 * sigma_phat   # ~ 0.42
        x_max = p + 4 * sigma_phat   # ~ 0.62

        axes = Axes(
            x_range=[x_min, x_max, sigma_phat],
            y_range=[0, 18, 5],
            x_length=10,
            y_length=3.5,
            axis_config={"include_tip": False, "include_numbers": False},
        )
        axes.shift(DOWN * 0.8)

        # Tick marks and labels at p +/- k*sigma for k = -3..3
        x_labels = VGroup()
        x_ticks = VGroup()
        for k in range(-3, 4):
            val = p + k * sigma_phat
            label = Text(f"{val:.3f}", font_size=14)
            label.next_to(axes.c2p(val, 0), DOWN, buff=0.15)
            x_labels.add(label)
            tick = Line(
                axes.c2p(val, -0.3), axes.c2p(val, 0.3),
                color=WHITE, stroke_width=2,
            )
            x_ticks.add(tick)

        # Draw the curve
        curve = axes.plot(
            normal_pdf,
            x_range=[x_min, x_max, 0.001],
            color=CURVE_COLOR,
            stroke_width=3,
        )

        self.play(Create(axes), run_time=0.5)
        self.play(
            Create(curve),
            FadeIn(x_labels),
            FadeIn(x_ticks),
            run_time=1.2,
        )
        self.wait(0.3)

        # Label the center (mean of p-hat)
        mu_label = MathTex(r"\mu_{\hat{p}} = 0.52", font_size=28, color=CURVE_COLOR)
        mu_label.next_to(axes.c2p(p, 0), DOWN, buff=0.55)
        mu_arrow = Arrow(
            mu_label.get_top(),
            axes.c2p(p, 0) + UP * 0.05,
            buff=0.05, color=CURVE_COLOR, stroke_width=2,
        )
        self.play(Write(mu_label), Create(mu_arrow))
        self.wait(0.3)

        # Show sigma calculation
        sigma_formula = MathTex(
            r"\sigma_{\hat{p}} = \sqrt{\frac{p(1-p)}{n}}",
            font_size=28,
        )
        sigma_calc = MathTex(
            r"= \sqrt{\frac{0.52 \times 0.48}{400}}",
            font_size=28,
        )
        sigma_result = MathTex(
            r"\approx 0.025",
            font_size=30, color=CURVE_COLOR,
        )

        sigma_group = VGroup(sigma_formula, sigma_calc, sigma_result).arrange(
            DOWN, buff=0.12, aligned_edge=LEFT,
        )
        sigma_group.to_edge(LEFT, buff=0.5).shift(DOWN * 2.0)

        self.play(Write(sigma_formula), run_time=0.6)
        self.play(Write(sigma_calc), run_time=0.5)
        self.play(Write(sigma_result), run_time=0.4)
        self.wait(0.5)

        # ========== STEP 2: MARK p-hat = 0.55 ==========
        self.play(FadeOut(step1_label), run_time=0.3)

        step2_label = Text(
            "Step 2: Mark p\u0302 = 0.55 on the curve",
            font_size=24, color=Z_COLOR,
        )
        step2_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step2_label))
        self.wait(0.3)

        # Dashed vertical line at p-hat
        phat_line = DashedLine(
            axes.c2p(phat, 0),
            axes.c2p(phat, normal_pdf(phat)),
            color=Z_COLOR, stroke_width=3,
        )
        phat_dot = Dot(axes.c2p(phat, 0), color=Z_COLOR, radius=0.07)
        phat_label = MathTex(r"\hat{p} = 0.55", font_size=24, color=Z_COLOR)
        phat_label.next_to(phat_dot, DOWN, buff=0.2)

        self.play(
            Create(phat_line),
            FadeIn(phat_dot),
            Write(phat_label),
            run_time=0.8,
        )
        self.wait(0.5)

        # ========== STEP 3: Z-SCORE CALCULATION ==========
        self.play(FadeOut(step2_label), run_time=0.3)

        step3_label = Text(
            "Step 3: Calculate the z-score",
            font_size=24, color=Z_COLOR,
        )
        step3_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step3_label))
        self.wait(0.3)

        # Fade out sigma derivation to make room
        self.play(FadeOut(sigma_formula), FadeOut(sigma_calc), FadeOut(sigma_result))

        # z formula (generic)
        z_formula = MathTex(
            r"z = \frac{\hat{p} - p}{\sigma_{\hat{p}}}",
            font_size=32,
        )
        z_formula.to_edge(RIGHT, buff=0.8).shift(UP * 1.2)
        self.play(Write(z_formula))
        self.wait(0.3)

        # Substitution
        z_sub = MathTex(
            r"= \frac{0.55 - 0.52}{0.025}",
            font_size=32,
        )
        z_sub.next_to(z_formula, DOWN, buff=0.2)
        self.play(Write(z_sub))
        self.wait(0.3)

        # Numerator simplification
        z_numer = MathTex(
            r"= \frac{0.03}{0.025}",
            font_size=32,
        )
        z_numer.next_to(z_sub, DOWN, buff=0.2)
        self.play(Write(z_numer))
        self.wait(0.3)

        # Final z value
        z_final = MathTex(
            r"= 1.20",
            font_size=36, color=Z_COLOR,
        )
        z_final.next_to(z_numer, DOWN, buff=0.2)
        self.play(Write(z_final))
        self.wait(0.5)

        # Flash the z result
        z_box_temp = SurroundingRectangle(z_final, color=Z_COLOR, buff=0.1)
        self.play(Create(z_box_temp), run_time=0.3)
        self.play(FadeOut(z_box_temp), run_time=0.3)

        # ========== STEP 4: SHADE THE RIGHT TAIL ==========
        self.play(FadeOut(step3_label), run_time=0.3)

        step4_label = Text(
            "Step 4: Find the right-tail probability",
            font_size=24, color=SHADE_COLOR,
        )
        step4_label.next_to(title, DOWN, buff=0.2)
        self.play(Write(step4_label))
        self.wait(0.3)

        # Shade area to the right of p-hat = 0.55
        shaded_area = axes.get_area(
            curve,
            x_range=[phat, x_max],
            color=SHADE_COLOR,
            opacity=0.55,
        )

        self.play(FadeIn(shaded_area), run_time=1.2)
        self.wait(0.3)

        # Arrow pointing to shaded region
        tail_note = Text("P(p\u0302 > 0.55)", font_size=20, color=SHADE_COLOR)
        tail_note.move_to(axes.c2p(phat + 2.5 * sigma_phat, 4))
        tail_arrow = Arrow(
            tail_note.get_left(),
            axes.c2p(phat + 1.2 * sigma_phat, 1.5),
            buff=0.05, color=SHADE_COLOR, stroke_width=2,
        )
        self.play(Write(tail_note), Create(tail_arrow), run_time=0.5)
        self.wait(0.3)

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
        prob_line1 = Text(
            "P(Z > 1.20)",
            font_size=26,
        )
        prob_line1.next_to(z_final, DOWN, buff=0.35)
        self.play(Write(prob_line1))
        self.wait(0.3)

        prob_line2 = Text(
            "= 1 - P(Z < 1.20)",
            font_size=26,
        )
        prob_line2.next_to(prob_line1, DOWN, buff=0.15)
        self.play(Write(prob_line2))
        self.wait(0.3)

        prob_line3 = Text(
            "= 1 - 0.8849",
            font_size=26,
        )
        prob_line3.next_to(prob_line2, DOWN, buff=0.15)
        self.play(Write(prob_line3))
        self.wait(0.3)

        prob_result = Text(
            "= 0.1151",
            font_size=30, color=RESULT_COLOR, weight=BOLD,
        )
        prob_result.next_to(prob_line3, DOWN, buff=0.15)
        self.play(Write(prob_result))
        self.wait(0.5)

        # Label inside the shaded area
        area_pct = Text("~11.5%", font_size=22, color=WHITE, weight=BOLD)
        area_pct.move_to(axes.c2p(phat + 1.8 * sigma_phat, 2.5))
        self.play(Write(area_pct))
        self.wait(0.5)

        # ========== FINAL BOXED ANSWER ==========
        # Clear intermediate work
        self.play(
            FadeOut(step4_label),
            FadeOut(z_final),
            FadeOut(prob_line1),
            FadeOut(prob_line2),
            FadeOut(prob_line3),
            FadeOut(prob_result),
            FadeOut(tail_note),
            FadeOut(tail_arrow),
            FadeOut(area_pct),
            FadeOut(mu_label),
            FadeOut(mu_arrow),
            FadeOut(phat_label),
            FadeOut(setup_lines[2]),
            run_time=0.5,
        )

        # Boxed answer
        answer_text = MathTex(
            r"P(\hat{p} > 0.55) \approx 0.115",
            font_size=36, color=RESULT_COLOR,
        )
        answer_box = SurroundingRectangle(
            answer_text, color=RESULT_COLOR, buff=0.25, corner_radius=0.1,
        )
        answer_group = VGroup(answer_box, answer_text)
        answer_group.to_edge(RIGHT, buff=0.6).shift(UP * 1.5)

        self.play(Create(answer_box), Write(answer_text))
        self.wait(0.5)

        # Interpretation note
        interp = Text(
            "About 11.5% of samples would show > 55% support",
            font_size=24, color=GRAY,
        )
        interp.next_to(answer_group, DOWN, buff=0.35)
        self.play(Write(interp))
        self.wait(0.5)

        # Flash the shaded area to reinforce
        self.play(shaded_area.animate.set_opacity(0.85), run_time=0.3)
        self.play(shaded_area.animate.set_opacity(0.55), run_time=0.3)
        self.wait(1.5)

        # ========== FADE OUT ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
        )
        self.wait(0.5)
