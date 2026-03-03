"""
Verifying the Remainder Theorem — Two Paths, One Answer

Shows students that dividing P(x) by (x - a) gives a remainder equal to P(a),
using a split-screen "convergence" approach: long division on the left,
direct evaluation on the right, both arriving at the same result.

P(x) = x^3 - 4x^2 + x + 6,  divisor (x - 2),  a = 2

To render:
    manim -qm --format=mp4 remainder_theorem_verify.py RemainderTheoremVerify
"""

from manim import *

# 3Blue1Brown-style palette
BLUE_PATH = ManimColor("#3B82F6")
YELLOW_PATH = ManimColor("#FACC15")
GREEN_MATCH = ManimColor("#22C55E")
TEAL_ACCENT = ManimColor("#2DD4BF")
SOFT_WHITE = ManimColor("#E2E8F0")
BG_COLOR = ManimColor("#1C1C1C")


class RemainderTheoremVerify(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        # ── 1. TITLE ──
        title = Text("Two Paths, One Answer", font_size=52,
                      color=SOFT_WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        poly_label = MathTex(
            r"P(x) = x^3 - 4x^2 + x + 6",
            font_size=34, color=TEAL_ACCENT,
        )
        poly_label.next_to(title, DOWN, buff=0.15)

        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(poly_label, shift=UP * 0.2), run_time=0.6)
        self.wait(0.6)

        # ── 2. DIVIDING LINE + PATH LABELS ──
        divider = DashedLine(
            start=UP * 1.6, end=DOWN * 3.4,
            color=GREY, stroke_width=1.5, dash_length=0.12,
        )

        path1_label = Text("Path 1: Long Division", font_size=24,
                           color=BLUE_PATH, weight=BOLD)
        path1_label.move_to(LEFT * 3.5 + UP * 1.4)

        path2_label = Text("Path 2: Evaluate P(2)", font_size=24,
                           color=YELLOW_PATH, weight=BOLD)
        path2_label.move_to(RIGHT * 3.5 + UP * 1.4)

        self.play(
            Create(divider),
            FadeIn(path1_label, shift=DOWN * 0.15),
            FadeIn(path2_label, shift=DOWN * 0.15),
            run_time=0.7,
        )
        self.wait(0.4)

        # ── 3. LEFT SIDE — Long Division (condensed) ──
        # Division statement
        div_problem = MathTex(
            r"(x^3 - 4x^2 + x + 6)", r"\div", r"(x - 2)",
            font_size=28,
        )
        div_problem[0].set_color(SOFT_WHITE)
        div_problem[2].set_color(BLUE_PATH)
        div_problem.move_to(LEFT * 3.5 + UP * 0.7)

        self.play(FadeIn(div_problem, shift=UP * 0.15), run_time=0.6)
        self.wait(0.4)

        # Show the work condensed — step-by-step quotient terms
        div_step1 = MathTex(
            r"x^3 \div x = x^2",
            font_size=24, color=SOFT_WHITE,
        )
        div_step1.move_to(LEFT * 3.5 + UP * 0.15)

        div_step2 = MathTex(
            r"-2x^2 \div x = -2x",
            font_size=24, color=SOFT_WHITE,
        )
        div_step2.move_to(LEFT * 3.5 + DOWN * 0.25)

        div_step3 = MathTex(
            r"-3x \div x = -3",
            font_size=24, color=SOFT_WHITE,
        )
        div_step3.move_to(LEFT * 3.5 + DOWN * 0.65)

        self.play(FadeIn(div_step1, shift=LEFT * 0.15), run_time=0.5)
        self.wait(0.25)
        self.play(FadeIn(div_step2, shift=LEFT * 0.15), run_time=0.5)
        self.wait(0.25)
        self.play(FadeIn(div_step3, shift=LEFT * 0.15), run_time=0.5)
        self.wait(0.3)

        # Quotient result
        quotient_label = Text("Quotient:", font_size=22, color=GREY)
        quotient_label.move_to(LEFT * 3.5 + DOWN * 1.2)

        quotient = MathTex(
            r"x^2 - 2x - 3",
            font_size=30, color=BLUE_PATH,
        )
        quotient.next_to(quotient_label, DOWN, buff=0.1)

        self.play(Write(quotient_label), Write(quotient), run_time=0.6)
        self.wait(0.3)

        # Remainder result — the key
        remainder_label = Text("Remainder:", font_size=22, color=GREY)
        remainder_label.next_to(quotient, DOWN, buff=0.25)

        remainder_left = MathTex(
            r"0",
            font_size=42, color=GREEN_MATCH,
        )
        remainder_left.next_to(remainder_label, DOWN, buff=0.1)

        remainder_box_left = SurroundingRectangle(
            remainder_left, color=GREEN_MATCH,
            buff=0.15, corner_radius=0.08, stroke_width=2.5,
        )

        self.play(Write(remainder_label), run_time=0.3)
        self.play(
            Write(remainder_left),
            Create(remainder_box_left),
            run_time=0.6,
        )
        self.play(Indicate(remainder_left, color=WHITE, scale_factor=1.3),
                  run_time=0.5)
        self.wait(0.5)

        # ── 4. RIGHT SIDE — Direct Evaluation P(2) ──
        eval_header = MathTex(
            r"P(2) = (2)^3 - 4(2)^2 + (2) + 6",
            font_size=26, color=SOFT_WHITE,
        )
        eval_header.move_to(RIGHT * 3.5 + UP * 0.7)

        self.play(FadeIn(eval_header, shift=UP * 0.15), run_time=0.6)
        self.wait(0.3)

        # Arithmetic steps
        eval_step1 = MathTex(
            r"= 8 - 4(4) + 2 + 6",
            font_size=26, color=SOFT_WHITE,
        )
        eval_step1.move_to(RIGHT * 3.5 + UP * 0.15)

        eval_step2 = MathTex(
            r"= 8 - 16 + 2 + 6",
            font_size=26, color=SOFT_WHITE,
        )
        eval_step2.move_to(RIGHT * 3.5 + DOWN * 0.25)

        eval_step3 = MathTex(
            r"= 0",
            font_size=30, color=YELLOW_PATH,
        )
        eval_step3.move_to(RIGHT * 3.5 + DOWN * 0.7)

        self.play(FadeIn(eval_step1, shift=RIGHT * 0.15), run_time=0.5)
        self.wait(0.25)
        self.play(FadeIn(eval_step2, shift=RIGHT * 0.15), run_time=0.5)
        self.wait(0.25)
        self.play(FadeIn(eval_step3, shift=RIGHT * 0.15), run_time=0.5)
        self.wait(0.3)

        # P(2) = 0 highlight
        p2_result_text = MathTex(
            r"P(2) = 0",
            font_size=42, color=GREEN_MATCH,
        )
        p2_result_text.move_to(RIGHT * 3.5 + DOWN * 1.5)

        p2_box_right = SurroundingRectangle(
            p2_result_text, color=GREEN_MATCH,
            buff=0.15, corner_radius=0.08, stroke_width=2.5,
        )

        self.play(
            Write(p2_result_text),
            Create(p2_box_right),
            run_time=0.6,
        )
        self.play(Indicate(p2_result_text, color=WHITE, scale_factor=1.3),
                  run_time=0.5)
        self.wait(0.6)

        # ── 5. CONVERGENCE — Both results slide to center and merge ──
        # Create the two result copies that will fly to center
        left_result = MathTex(r"0", font_size=48, color=GREEN_MATCH)
        left_result.move_to(remainder_left.get_center())

        right_result = MathTex(r"0", font_size=48, color=GREEN_MATCH)
        right_result.move_to(p2_result_text.get_center())

        # Fade everything except title and the two boxed results
        left_side_group = VGroup(
            div_problem, div_step1, div_step2, div_step3,
            quotient_label, quotient, remainder_label,
        )
        right_side_group = VGroup(
            eval_header, eval_step1, eval_step2, eval_step3,
        )

        self.play(
            FadeOut(left_side_group),
            FadeOut(right_side_group),
            FadeOut(divider),
            FadeOut(path1_label),
            FadeOut(path2_label),
            FadeOut(poly_label),
            FadeOut(remainder_box_left),
            FadeOut(p2_box_right),
            FadeOut(remainder_left),
            FadeOut(p2_result_text),
            FadeIn(left_result),
            FadeIn(right_result),
            run_time=0.6,
        )

        # Animate both zeros flying to center
        center_target = DOWN * 0.2
        merged_zero = MathTex(r"0", font_size=64, color=GREEN_MATCH)
        merged_zero.move_to(center_target)

        self.play(
            left_result.animate.move_to(center_target + LEFT * 0.3),
            right_result.animate.move_to(center_target + RIGHT * 0.3),
            run_time=0.8,
        )
        self.play(
            Transform(left_result, merged_zero),
            FadeOut(right_result),
            run_time=0.6,
        )

        # Flash the merged zero
        flash_ring = Circle(
            radius=0.6, color=GREEN_MATCH,
            stroke_width=4, fill_opacity=0,
        )
        flash_ring.move_to(center_target)
        self.play(
            Create(flash_ring),
            flash_ring.animate.scale(2.5).set_opacity(0),
            run_time=0.7,
        )
        self.remove(flash_ring)
        self.wait(0.3)

        # ── 6. BIG REVEAL ──
        self.play(FadeOut(left_result), run_time=0.3)

        reveal = Text("They match! This is the Remainder Theorem.",
                       font_size=34, color=YELLOW_PATH, weight=BOLD)
        reveal.move_to(UP * 0.3)
        self.play(Write(reveal), run_time=0.8)
        self.wait(0.8)

        # ── 7. THEOREM STATEMENT IN A BOX ──
        self.play(FadeOut(reveal), run_time=0.4)

        theorem_line1 = Text("Remainder Theorem", font_size=32,
                             color=TEAL_ACCENT, weight=BOLD)

        theorem_line2 = Text("When P(x) is divided by (x - a),",
                             font_size=26, color=SOFT_WHITE)

        theorem_line3 = Text("the remainder equals P(a).",
                             font_size=26, color=SOFT_WHITE)

        theorem_group = VGroup(
            theorem_line1, theorem_line2, theorem_line3,
        ).arrange(DOWN, buff=0.18)
        theorem_group.move_to(UP * 0.1)

        theorem_box = SurroundingRectangle(
            theorem_group, color=TEAL_ACCENT,
            buff=0.3, corner_radius=0.12, stroke_width=2.5,
        )

        self.play(
            FadeIn(theorem_group, shift=UP * 0.2),
            Create(theorem_box),
            run_time=0.8,
        )
        self.wait(1.5)

        # ── 8. BONUS INSIGHT — Factor connection ──
        bonus = Text("Since remainder = 0, (x - 2) is a FACTOR of P(x)!",
                      font_size=28, color=GREEN_MATCH, weight=BOLD)
        bonus.move_to(DOWN * 2.0)

        factor_eq = MathTex(
            r"x^3 - 4x^2 + x + 6 = (x - 2)(x^2 - 2x - 3)",
            font_size=30, color=SOFT_WHITE,
        )
        factor_eq.next_to(bonus, DOWN, buff=0.2)

        self.play(Write(bonus), run_time=0.7)
        self.wait(0.4)
        self.play(FadeIn(factor_eq, shift=UP * 0.15), run_time=0.6)
        self.wait(0.5)

        # Highlight the factor
        factor_highlight = SurroundingRectangle(
            factor_eq, color=GREEN_MATCH,
            buff=0.12, corner_radius=0.08, stroke_width=2,
        )
        self.play(Create(factor_highlight), run_time=0.5)
        self.wait(2.0)
