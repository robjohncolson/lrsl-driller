"""
Confidence Interval for p (AP Stats Unit 6, Topic 6.2)

Builds and interprets a confidence interval for a population proportion.
Shows the formula p-hat +/- z* * sqrt(p-hat(1-p-hat)/n), walks through a
full worked example (p-hat = 0.58, n = 250, 95% confidence), animates the
interval on a number line, and presents the correct interpretation template.
Emphasizes the common mistake: do NOT say "95% probability."

Run with: manim -qm --format=mp4 apstat_62_confidence_interval.py ConfidenceInterval
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ConfidenceInterval(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("Confidence Interval for ", font_size=44, weight=BOLD)
        title_p = MathTex(r"p", font_size=52, color=TEAL_3B1B)
        title_group = VGroup(title, title_p).arrange(RIGHT, buff=0.12)
        title_group.to_edge(UP, buff=0.3)
        self.play(Write(title), FadeIn(title_p))
        self.wait(0.5)

        # ================================================================
        # FORMULA
        # ================================================================
        formula_label = Text("Formula:", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        formula_label.next_to(title_group, DOWN, buff=0.4)
        formula_label.to_edge(LEFT, buff=1.0)

        formula = MathTex(
            r"\hat{p}", r"\pm", r"z^*", r"\cdot",
            r"\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=42,
        )
        formula[0].set_color(TEAL_3B1B)
        formula[2].set_color(PINK_3B1B)
        formula[4].set_color(BLUE_3B1B)
        formula.next_to(formula_label, RIGHT, buff=0.3)

        self.play(Write(formula_label), run_time=0.4)
        self.play(Write(formula), run_time=1.2)
        self.wait(0.5)

        # Equivalent form
        equiv_label = Text("Equivalently:", font_size=24, color=GREY_B)
        equiv_formula = MathTex(
            r"(", r"\hat{p}", r"-", r"\text{ME}", r",\;",
            r"\hat{p}", r"+", r"\text{ME}", r")",
            font_size=38,
        )
        equiv_formula[1].set_color(TEAL_3B1B)
        equiv_formula[3].set_color(YELLOW_3B1B)
        equiv_formula[5].set_color(TEAL_3B1B)
        equiv_formula[7].set_color(YELLOW_3B1B)
        equiv_row = VGroup(equiv_label, equiv_formula).arrange(RIGHT, buff=0.25)
        equiv_row.next_to(formula, DOWN, buff=0.3)

        self.play(Write(equiv_label), Write(equiv_formula), run_time=0.8)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear formula, begin worked example
        # ================================================================
        self.play(
            FadeOut(formula_label), FadeOut(formula),
            FadeOut(equiv_row),
            run_time=0.4,
        )

        # ================================================================
        # WORKED EXAMPLE
        # ================================================================
        example_header = Text(
            "Worked Example", font_size=32, color=YELLOW_3B1B, weight=BOLD,
        )
        example_header.next_to(title_group, DOWN, buff=0.35)
        self.play(Write(example_header), run_time=0.5)

        # Givens
        givens = VGroup(
            MathTex(r"\hat{p} = 0.58", font_size=32, color=TEAL_3B1B),
            MathTex(r"n = 250", font_size=32),
            Text("95% confidence", font_size=26, color=PINK_3B1B),
        ).arrange(RIGHT, buff=0.8)
        givens.next_to(example_header, DOWN, buff=0.3)
        self.play(Write(givens), run_time=0.7)
        self.wait(0.5)

        # Step 1: SE
        step1_label = Text("Step 1: Standard Error", font_size=24, color=BLUE_3B1B)
        step1_label.next_to(givens, DOWN, buff=0.35)
        step1_label.to_edge(LEFT, buff=1.0)

        step1_formula = MathTex(
            r"\text{SE} = \sqrt{\frac{0.58 \times 0.42}{250}}",
            r"= \sqrt{0.000974}",
            r"= 0.0312",
            font_size=30,
        )
        step1_formula[2].set_color(BLUE_3B1B)
        step1_formula.next_to(step1_label, DOWN, buff=0.15)

        self.play(Write(step1_label), run_time=0.4)
        self.play(Write(step1_formula), run_time=1.0)
        self.wait(0.5)

        # Step 2: z*
        step2_label = Text("Step 2: Critical Value", font_size=24, color=PINK_3B1B)
        step2_label.next_to(step1_formula, DOWN, buff=0.25)
        step2_label.align_to(step1_label, LEFT)

        step2_formula = MathTex(
            r"z^* = 1.960", font_size=30, color=PINK_3B1B,
        )
        step2_note = Text("(for 95% confidence)", font_size=20, color=GREY_B)
        step2_row = VGroup(step2_formula, step2_note).arrange(RIGHT, buff=0.2)
        step2_row.next_to(step2_label, DOWN, buff=0.15)

        self.play(Write(step2_label), run_time=0.4)
        self.play(Write(step2_row), run_time=0.7)
        self.wait(0.5)

        # Step 3: ME
        step3_label = Text("Step 3: Margin of Error", font_size=24, color=YELLOW_3B1B)
        step3_label.next_to(step2_row, DOWN, buff=0.25)
        step3_label.align_to(step1_label, LEFT)

        step3_formula = MathTex(
            r"\text{ME} = 1.960 \times 0.0312 = 0.0612",
            font_size=30,
        )
        step3_formula.set_color(YELLOW_3B1B)
        step3_formula.next_to(step3_label, DOWN, buff=0.15)

        self.play(Write(step3_label), run_time=0.4)
        self.play(Write(step3_formula), run_time=0.8)
        self.wait(0.5)

        # Step 4: CI
        step4_label = Text("Step 4: Confidence Interval", font_size=24, color=GREEN_3B1B)
        step4_label.next_to(step3_formula, DOWN, buff=0.25)
        step4_label.align_to(step1_label, LEFT)

        step4_formula = MathTex(
            r"(0.58 - 0.061,\; 0.58 + 0.061)",
            r"=",
            r"(0.519,\; 0.641)",
            font_size=30,
        )
        step4_formula[2].set_color(GREEN_3B1B)
        step4_formula.next_to(step4_label, DOWN, buff=0.15)

        self.play(Write(step4_label), run_time=0.4)
        self.play(Write(step4_formula), run_time=1.0)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear steps, show number line
        # ================================================================
        steps_group = VGroup(
            example_header, givens,
            step1_label, step1_formula,
            step2_label, step2_row,
            step3_label, step3_formula,
            step4_label, step4_formula,
        )
        self.play(FadeOut(steps_group), run_time=0.5)

        # ================================================================
        # NUMBER LINE ANIMATION
        # ================================================================
        nl_header = Text(
            "Visualizing the Interval", font_size=30, color=TEAL_3B1B, weight=BOLD,
        )
        nl_header.next_to(title_group, DOWN, buff=0.35)
        self.play(Write(nl_header), run_time=0.4)

        num_line = NumberLine(
            x_range=[0.45, 0.71, 0.02],
            length=10,
            include_numbers=True,
            numbers_to_include=[0.46, 0.48, 0.50, 0.52, 0.54, 0.56, 0.58, 0.60, 0.62, 0.64, 0.66, 0.68, 0.70],
            font_size=16,
            decimal_number_config={"num_decimal_places": 2},
            include_tip=False,
        )
        num_line.move_to(DOWN * 0.3)

        self.play(Create(num_line), run_time=0.7)
        self.wait(0.3)

        # Mark p-hat = 0.58 at center
        phat_pos = num_line.n2p(0.58)
        phat_dot = Dot(phat_pos, radius=0.12, color=TEAL_3B1B)
        phat_label = MathTex(r"\hat{p} = 0.58", font_size=24, color=TEAL_3B1B)
        phat_label.next_to(phat_dot, UP, buff=0.15)
        phat_dashed = DashedLine(
            phat_pos + DOWN * 0.05, phat_pos + UP * 0.65,
            color=TEAL_3B1B, stroke_width=2, dash_length=0.08,
        )

        self.play(FadeIn(phat_dot), Write(phat_label), Create(phat_dashed), run_time=0.6)
        self.wait(0.4)

        # Extend ME in both directions
        left_pos = num_line.n2p(0.519)
        right_pos = num_line.n2p(0.641)

        # Left arrow: p-hat to lower bound
        left_arrow = Arrow(
            phat_pos + DOWN * 0.4, left_pos + DOWN * 0.4,
            color=YELLOW_3B1B, stroke_width=3, buff=0.0, tip_length=0.15,
        )
        left_me_label = MathTex(r"-\text{ME}", font_size=20, color=YELLOW_3B1B)
        left_me_label.next_to(left_arrow, DOWN, buff=0.05)

        # Right arrow: p-hat to upper bound
        right_arrow = Arrow(
            phat_pos + DOWN * 0.4, right_pos + DOWN * 0.4,
            color=YELLOW_3B1B, stroke_width=3, buff=0.0, tip_length=0.15,
        )
        right_me_label = MathTex(r"+\text{ME}", font_size=20, color=YELLOW_3B1B)
        right_me_label.next_to(right_arrow, DOWN, buff=0.05)

        self.play(
            Create(left_arrow), Write(left_me_label),
            Create(right_arrow), Write(right_me_label),
            run_time=0.8,
        )
        self.wait(0.5)

        # Show bracket notation for CI
        left_bound_line = DashedLine(
            left_pos + DOWN * 0.1, left_pos + UP * 0.6,
            color=GREEN_3B1B, stroke_width=2, dash_length=0.08,
        )
        right_bound_line = DashedLine(
            right_pos + DOWN * 0.1, right_pos + UP * 0.6,
            color=GREEN_3B1B, stroke_width=2, dash_length=0.08,
        )
        left_bound_label = MathTex(r"0.519", font_size=22, color=GREEN_3B1B)
        left_bound_label.next_to(left_bound_line, UP, buff=0.05)
        right_bound_label = MathTex(r"0.641", font_size=22, color=GREEN_3B1B)
        right_bound_label.next_to(right_bound_line, UP, buff=0.05)

        # Shaded region between bounds
        shade_region = Rectangle(
            width=num_line.n2p(0.641)[0] - num_line.n2p(0.519)[0],
            height=0.3,
            fill_color=GREEN_3B1B,
            fill_opacity=0.2,
            stroke_width=0,
        )
        shade_region.move_to(
            (num_line.n2p(0.519) + num_line.n2p(0.641)) / 2 + UP * 0.0
        )

        self.play(
            Create(left_bound_line), Create(right_bound_line),
            Write(left_bound_label), Write(right_bound_label),
            FadeIn(shade_region),
            run_time=0.8,
        )
        self.wait(0.3)

        ci_bracket = MathTex(
            r"(0.519,\; 0.641)", font_size=32, color=GREEN_3B1B,
        )
        ci_bracket.next_to(shade_region, UP, buff=0.6)
        self.play(Write(ci_bracket), run_time=0.5)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear number line, show interpretation
        # ================================================================
        nl_stuff = VGroup(
            nl_header, num_line, phat_dot, phat_label, phat_dashed,
            left_arrow, left_me_label, right_arrow, right_me_label,
            left_bound_line, right_bound_line, left_bound_label, right_bound_label,
            shade_region, ci_bracket,
        )
        self.play(FadeOut(nl_stuff), run_time=0.5)

        # ================================================================
        # INTERPRETATION
        # ================================================================
        interp_header = Text(
            "Interpretation", font_size=34, color=YELLOW_3B1B, weight=BOLD,
        )
        interp_header.next_to(title_group, DOWN, buff=0.4)
        self.play(Write(interp_header), run_time=0.5)
        self.wait(0.3)

        # Template
        interp_line1 = Text(
            "We are 95% confident that the interval",
            font_size=26,
        )
        interp_line2 = Text(
            "from 0.519 to 0.641",
            font_size=28, color=GREEN_3B1B, weight=BOLD,
        )
        interp_line3 = Text(
            "captures the true proportion of [context].",
            font_size=26,
        )
        interp_block = VGroup(interp_line1, interp_line2, interp_line3).arrange(
            DOWN, buff=0.12,
        )
        interp_block.next_to(interp_header, DOWN, buff=0.35)

        self.play(
            LaggedStart(
                Write(interp_line1),
                Write(interp_line2),
                Write(interp_line3),
                lag_ratio=0.4,
            ),
            run_time=2.0,
        )
        self.wait(0.8)

        interp_box = SurroundingRectangle(
            interp_block, color=YELLOW_3B1B, buff=0.25, corner_radius=0.1,
        )
        self.play(Create(interp_box), run_time=0.5)
        self.wait(0.5)

        # ================================================================
        # COMMON MISTAKE
        # ================================================================
        mistake_header = VGroup(
            Text("X", font_size=28, color=RED, weight=BOLD),
            Text("  Common Mistake", font_size=26, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        mistake_header.next_to(interp_box, DOWN, buff=0.45)

        mistake_text = Text(
            "DO NOT say: \"There is a 95% probability that p is in the interval.\"",
            font_size=22, color=RED,
        )
        mistake_text.next_to(mistake_header, DOWN, buff=0.15)

        correction_text = Text(
            "The interval either contains p or it doesn't -- no probability involved.",
            font_size=20, color=GREY_B,
        )
        correction_text.next_to(mistake_text, DOWN, buff=0.12)

        self.play(Write(mistake_header), run_time=0.4)
        self.play(Write(mistake_text), run_time=0.8)
        self.play(Write(correction_text), run_time=0.6)
        self.wait(1.0)

        # ================================================================
        # FINAL SUMMARY BOX
        # ================================================================
        self.play(
            FadeOut(interp_header), FadeOut(interp_block), FadeOut(interp_box),
            FadeOut(mistake_header), FadeOut(mistake_text), FadeOut(correction_text),
            FadeOut(title_group),
            run_time=0.5,
        )

        final_lines = VGroup(
            Text("Confidence Interval for p", font_size=34, color=TEAL_3B1B, weight=BOLD),
            Text("", font_size=6),
            MathTex(
                r"\hat{p} \pm z^* \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
                font_size=44,
            ),
            Text("", font_size=6),
            Text("Interpret:", font_size=26, color=YELLOW_3B1B, weight=BOLD),
            Text(
                "\"We are __% confident that the interval",
                font_size=24,
            ),
            Text(
                "from ___ to ___ captures the true proportion of [context].\"",
                font_size=24,
            ),
            Text("", font_size=6),
            Text(
                "NEVER say \"95% probability\" -- say \"95% confident\"",
                font_size=22, color=RED,
            ),
        ).arrange(DOWN, buff=0.1)
        final_lines.move_to(ORIGIN)

        final_box = SurroundingRectangle(
            final_lines, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in final_lines],
                lag_ratio=0.15,
            ),
            run_time=2.5,
        )
        self.play(Create(final_box), run_time=0.5)
        self.wait(2.5)
