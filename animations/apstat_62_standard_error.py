"""
Standard Error of p-hat (AP Stats Unit 6, Topic 6.2)

Shows why we replace the unknown parameter p with the statistic p-hat when
computing the standard error for a confidence interval. Walks through the
distinction between sigma_p-hat (uses p) and SE(p-hat) (uses p-hat), then
performs a full worked example: p-hat = 0.42, n = 300. Each arithmetic step
is animated individually. Ends with a key insight box.

Run with: manim -qm --format=mp4 apstat_62_standard_error.py StandardError
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class StandardError(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Standard Error of ", font_size=44, weight=BOLD)
        title_phat = MathTex(r"\hat{p}", font_size=52, color=TEAL_3B1B)
        title_group = VGroup(title, title_phat).arrange(RIGHT, buff=0.15)
        title_group.to_edge(UP, buff=0.3)
        self.play(Write(title), FadeIn(title_phat))
        self.wait(0.5)

        # ========== POPULATION SD FORMULA ==========
        pop_header = Text("Population Standard Deviation", font_size=28, color=BLUE_3B1B)
        pop_header.next_to(title_group, DOWN, buff=0.4)
        self.play(Write(pop_header), run_time=0.5)

        sigma_formula = MathTex(
            r"\sigma_{\hat{p}}", r"=", r"\sqrt{\frac{p(1-p)}{n}}",
            font_size=48,
        )
        sigma_formula[0].set_color(TEAL_3B1B)
        sigma_formula[2].set_color(BLUE_3B1B)
        sigma_formula.next_to(pop_header, DOWN, buff=0.3)
        self.play(Write(sigma_formula), run_time=1.0)
        self.wait(0.5)

        # Highlight the "p" -- it's unknown
        p_brace = Brace(sigma_formula[2], DOWN, buff=0.15)
        p_brace_label = Text("Uses p (the true proportion)", font_size=20, color=GREY_B)
        p_brace_label.next_to(p_brace, DOWN, buff=0.1)
        self.play(GrowFromCenter(p_brace), Write(p_brace_label), run_time=0.5)
        self.wait(0.5)

        # ========== THE PROBLEM ==========
        problem_text = Text(
            "Problem: We don't know p",
            font_size=30, color=RED, weight=BOLD,
        )
        problem_text.next_to(p_brace_label, DOWN, buff=0.35)
        self.play(Write(problem_text), run_time=0.6)
        self.wait(0.3)

        problem_sub = Text(
            "That's what we're trying to estimate!",
            font_size=24, color=PINK_3B1B,
        )
        problem_sub.next_to(problem_text, DOWN, buff=0.12)
        self.play(Write(problem_sub), run_time=0.5)
        self.wait(0.8)

        # ========== THE SOLUTION ==========
        solution_text = Text(
            "Solution: Plug in p-hat instead",
            font_size=30, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        solution_text.next_to(problem_sub, DOWN, buff=0.35)
        self.play(Write(solution_text), run_time=0.6)
        self.wait(0.5)

        # Clear middle section
        self.play(
            FadeOut(pop_header),
            FadeOut(p_brace), FadeOut(p_brace_label),
            FadeOut(problem_text), FadeOut(problem_sub),
            FadeOut(solution_text),
            run_time=0.4,
        )

        # Move sigma formula to the left
        self.play(
            sigma_formula.animate.scale(0.85).move_to(LEFT * 3 + UP * 1.0),
            run_time=0.5,
        )

        # Arrow from sigma to SE
        arrow = Arrow(
            LEFT * 1.2 + UP * 1.0,
            RIGHT * 0.8 + UP * 1.0,
            color=YELLOW_3B1B, stroke_width=3, buff=0.1,
        )
        arrow_label = Text("replace p with p-hat", font_size=18, color=YELLOW_3B1B)
        arrow_label.next_to(arrow, UP, buff=0.1)
        self.play(Create(arrow), Write(arrow_label), run_time=0.5)

        # SE formula
        se_formula = MathTex(
            r"SE(\hat{p})", r"=", r"\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=48,
        )
        se_formula[0].set_color(TEAL_3B1B)
        se_formula[2].set_color(ManimColor(GREEN_3B1B))
        se_formula.move_to(RIGHT * 3 + UP * 1.0)
        self.play(Write(se_formula), run_time=1.0)
        self.wait(0.5)

        # Box the SE formula
        se_box = SurroundingRectangle(
            se_formula, color=TEAL_3B1B, buff=0.2, corner_radius=0.1,
        )
        self.play(Create(se_box), run_time=0.4)
        self.wait(0.3)

        # Highlight difference labels
        sigma_label = Text(
            "uses p (parameter)", font_size=18, color=BLUE_3B1B,
        )
        sigma_label.next_to(sigma_formula, DOWN, buff=0.25)

        se_label = Text(
            "uses p-hat (statistic)", font_size=18, color=ManimColor(GREEN_3B1B),
        )
        se_label.next_to(se_formula, DOWN, buff=0.35)

        self.play(Write(sigma_label), Write(se_label), run_time=0.5)
        self.wait(0.8)

        # ========== TRANSITION TO WORKED EXAMPLE ==========
        top_section = VGroup(
            sigma_formula, arrow, arrow_label, se_formula, se_box,
            sigma_label, se_label,
        )
        self.play(
            FadeOut(top_section),
            run_time=0.5,
        )

        # ========== WORKED EXAMPLE ==========
        ex_header = Text(
            "Worked Example", font_size=34, color=YELLOW_3B1B, weight=BOLD,
        )
        ex_header.next_to(title_group, DOWN, buff=0.3)
        self.play(Write(ex_header), run_time=0.5)

        given = MathTex(
            r"\hat{p} = 0.42, \quad n = 300",
            font_size=32,
        )
        given.next_to(ex_header, DOWN, buff=0.25)
        self.play(Write(given), run_time=0.5)
        self.wait(0.3)

        # Reshow formula
        se_ref = MathTex(
            r"SE(\hat{p}) = \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
            font_size=36, color=TEAL_3B1B,
        )
        se_ref.next_to(given, DOWN, buff=0.35)
        self.play(Write(se_ref), run_time=0.5)
        self.wait(0.3)

        # Step 1: p-hat * (1 - p-hat)
        step1_label = Text("Step 1:", font_size=22, color=YELLOW_3B1B)
        step1_calc = MathTex(
            r"\hat{p}(1-\hat{p}) = 0.42 \times 0.58 = 0.2436",
            font_size=28,
        )
        step1 = VGroup(step1_label, step1_calc).arrange(RIGHT, buff=0.15)
        step1.next_to(se_ref, DOWN, buff=0.35)

        self.play(Write(step1_label), run_time=0.3)
        self.play(Write(step1_calc), run_time=0.6)
        self.wait(0.3)

        # Step 2: divide by n
        step2_label = Text("Step 2:", font_size=22, color=YELLOW_3B1B)
        step2_calc = MathTex(
            r"\frac{0.2436}{300} = 0.000812",
            font_size=28,
        )
        step2 = VGroup(step2_label, step2_calc).arrange(RIGHT, buff=0.15)
        step2.next_to(step1, DOWN, buff=0.2)

        self.play(Write(step2_label), run_time=0.3)
        self.play(Write(step2_calc), run_time=0.6)
        self.wait(0.3)

        # Step 3: square root
        step3_label = Text("Step 3:", font_size=22, color=YELLOW_3B1B)
        step3_calc = MathTex(
            r"\sqrt{0.000812} = 0.0285",
            font_size=28,
        )
        step3 = VGroup(step3_label, step3_calc).arrange(RIGHT, buff=0.15)
        step3.next_to(step2, DOWN, buff=0.2)

        self.play(Write(step3_label), run_time=0.3)
        self.play(Write(step3_calc), run_time=0.6)
        self.wait(0.3)

        # Final answer
        final_answer = MathTex(
            r"SE(\hat{p}) = 0.0285",
            font_size=40, color=ManimColor(GREEN_3B1B),
        )
        final_answer.next_to(step3, DOWN, buff=0.3)
        self.play(Write(final_answer), run_time=0.6)

        final_box = SurroundingRectangle(
            final_answer, color=ManimColor(GREEN_3B1B), buff=0.15, corner_radius=0.1,
        )
        self.play(Create(final_box), run_time=0.4)
        self.wait(0.8)

        # ========== CLEAR FOR KEY INSIGHT ==========
        example_section = VGroup(
            ex_header, given, se_ref, step1, step2, step3,
            final_answer, final_box,
        )
        self.play(
            FadeOut(example_section),
            FadeOut(title_group),
            run_time=0.5,
        )

        # ========== KEY INSIGHT BOX ==========
        insight_content = VGroup(
            Text(
                "Standard Error of p-hat",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=6),  # spacer
            MathTex(
                r"SE(\hat{p}) = \sqrt{\frac{\hat{p}(1-\hat{p})}{n}}",
                font_size=42, color=TEAL_3B1B,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "Estimates how much p-hat varies",
                font_size=24,
            ),
            Text(
                "from sample to sample.",
                font_size=24,
            ),
            Text("", font_size=6),  # spacer
            Text(
                "Uses p-hat (what we observe)",
                font_size=22, color=ManimColor(GREEN_3B1B),
            ),
            Text(
                "because p (the truth) is unknown.",
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
