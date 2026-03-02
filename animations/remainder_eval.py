"""
The Remainder Theorem: P(a) = Remainder when dividing P(x) by (x - a)
Step-by-step substitution animation for Algebra 2 students (3Blue1Brown style)

Run with: manim -qm --format=mp4 remainder_eval.py RemainderByEvaluation
"""
from manim import *


class RemainderByEvaluation(Scene):
    def construct(self):
        # ── 1. Title ────────────────────────────────────────────────
        title = Text("The Remainder Theorem", font_size=52)
        subtitle = MathTex(
            "P(a) = \\textrm{Remainder when dividing by } (x - a)",
            font_size=30,
        )
        subtitle.set_color(YELLOW)
        title.to_edge(UP, buff=0.6)
        subtitle.next_to(title, DOWN, buff=0.35)

        self.play(Write(title), run_time=1)
        self.play(FadeIn(subtitle, shift=UP * 0.3), run_time=0.8)
        self.wait(1)

        # ── 2. Show the example polynomial and divisor ──────────────
        self.play(FadeOut(subtitle))

        poly_label = Text("Our polynomial:", font_size=26, color=GREY_B)
        poly_label.next_to(title, DOWN, buff=0.5).to_edge(LEFT, buff=1.0)

        poly = MathTex(
            "P(x)", "=", "2x^3", "-", "x^2", "+", "4x", "+", "5",
            font_size=40,
        )
        poly.set_color(BLUE)
        poly.next_to(poly_label, DOWN, buff=0.3, aligned_edge=LEFT)

        div_label = Text("Dividing by:", font_size=26, color=GREY_B)
        div_label.next_to(poly, DOWN, buff=0.5, aligned_edge=LEFT)

        divisor = MathTex("(x + 2)", font_size=40, color=YELLOW)
        divisor.next_to(div_label, RIGHT, buff=0.3)

        self.play(Write(poly_label), run_time=0.5)
        self.play(Write(poly), run_time=1)
        self.wait(0.5)
        self.play(Write(div_label), Write(divisor), run_time=0.8)
        self.wait(1)

        # ── 3. Key insight: (x + 2) means a = -2 ──────────────────
        insight_line1 = MathTex(
            "(x + 2)", "=", "(x - (-2))",
            font_size=36,
        )
        insight_line1[0].set_color(YELLOW)
        insight_line1[2].set_color(YELLOW)

        insight_line2 = MathTex(
            "\\Rightarrow", "a", "=", "-2",
            font_size=40,
        )
        insight_line2[1].set_color(YELLOW)
        insight_line2[3].set_color(YELLOW)

        insight_group = VGroup(insight_line1, insight_line2).arrange(DOWN, buff=0.3)
        insight_group.move_to(RIGHT * 2.5 + DOWN * 1.2)

        arrow = Arrow(
            divisor.get_right() + RIGHT * 0.1,
            insight_line1.get_left() + LEFT * 0.1,
            color=YELLOW,
            buff=0.15,
        )

        self.play(GrowArrow(arrow), run_time=0.6)
        self.play(Write(insight_line1), run_time=0.8)
        self.play(Write(insight_line2), run_time=0.8)
        self.wait(1)

        # Highlight the key conclusion
        a_box = SurroundingRectangle(insight_line2, color=YELLOW, buff=0.15)
        self.play(Create(a_box))
        self.wait(0.8)

        # ── 4. Clear stage for substitution ─────────────────────────
        self.play(
            FadeOut(poly_label), FadeOut(div_label), FadeOut(divisor),
            FadeOut(arrow), FadeOut(insight_line1), FadeOut(insight_line2),
            FadeOut(a_box),
            poly.animate.next_to(title, DOWN, buff=0.5),
            run_time=0.8,
        )

        # ── 5. Show substitution header ─────────────────────────────
        sub_header = Text("Substitute x = -2 :", font_size=30, color=YELLOW)
        sub_header.next_to(poly, DOWN, buff=0.5, aligned_edge=LEFT)
        self.play(Write(sub_header), run_time=0.7)

        # ── 6. Substitution expression ──────────────────────────────
        sub_expr = MathTex(
            "P(-2)", "=",
            "2(-2)^3", "-", "(-2)^2", "+", "4(-2)", "+", "5",
            font_size=36,
        )
        sub_expr[0].set_color(BLUE)
        # Color the -2 substitutions yellow
        sub_expr[2].set_color(YELLOW)
        sub_expr[4].set_color(YELLOW)
        sub_expr[6].set_color(YELLOW)
        sub_expr.next_to(sub_header, DOWN, buff=0.4, aligned_edge=LEFT)

        self.play(Write(sub_expr), run_time=1.2)
        self.wait(0.8)

        # ── 7. Compute each power ───────────────────────────────────
        powers_title = Text("Compute the powers:", font_size=24, color=GREY_B)
        powers_title.next_to(sub_expr, DOWN, buff=0.5, aligned_edge=LEFT)
        self.play(Write(powers_title), run_time=0.5)

        pow1 = MathTex("(-2)^3", "=", "-8", font_size=32)
        pow1[2].set_color(RED)
        pow2 = MathTex("(-2)^2", "=", "4", font_size=32)
        pow2[2].set_color(BLUE)
        powers = VGroup(pow1, pow2).arrange(RIGHT, buff=1.5)
        powers.next_to(powers_title, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(Write(pow1), run_time=0.7)
        self.play(Write(pow2), run_time=0.7)
        self.wait(0.6)

        # ── 8. Multiply step ────────────────────────────────────────
        mult_expr = MathTex(
            "=",
            "2(-8)", "-", "(4)", "+", "4(-2)", "+", "5",
            font_size=36,
        )
        mult_expr.next_to(powers, DOWN, buff=0.5, aligned_edge=LEFT)

        self.play(
            FadeOut(powers_title),
            Write(mult_expr), run_time=1,
        )
        self.wait(0.5)

        # Show each multiplication result
        mult_result = MathTex(
            "=",
            "-16", "-", "4", "-", "8", "+", "5",
            font_size=36,
        )
        mult_result[1].set_color(RED)      # -16
        mult_result[3].set_color(RED)      # 4 (subtracted, so negative)
        mult_result[5].set_color(RED)      # 8 (subtracted, so negative)
        mult_result[7].set_color(BLUE)     # 5
        mult_result.next_to(mult_expr, DOWN, buff=0.35, aligned_edge=LEFT)

        self.play(Write(mult_result), run_time=1)
        self.wait(0.8)

        # ── 9. Final sum ────────────────────────────────────────────
        final_sum = MathTex("=", "-23", font_size=44)
        final_sum[1].set_color(GREEN)
        final_sum.next_to(mult_result, DOWN, buff=0.4, aligned_edge=LEFT)

        self.play(Write(final_sum), run_time=0.8)
        self.wait(0.5)

        # ── 10. Box the result ──────────────────────────────────────
        result_text = MathTex(
            "P(-2) = -23",
            font_size=44,
            color=GREEN,
        )
        remainder_label = Text("Remainder = -23", font_size=36, color=GREEN)

        result_group = VGroup(result_text, remainder_label).arrange(DOWN, buff=0.3)
        result_group.move_to(ORIGIN)

        result_box = SurroundingRectangle(result_group, color=GREEN, buff=0.25, corner_radius=0.1)

        # Clear the work and show the boxed result
        work_items = VGroup(
            sub_header, sub_expr, pow1, pow2,
            mult_expr, mult_result, final_sum,
        )

        self.play(
            FadeOut(work_items),
            FadeOut(poly),
            run_time=0.6,
        )
        self.play(
            FadeIn(result_group, scale=0.8),
            Create(result_box),
            run_time=1,
        )
        self.wait(1)

        # ── 11. Final insight ───────────────────────────────────────
        self.play(
            result_group.animate.shift(UP * 1.2),
            result_box.animate.shift(UP * 1.2),
            run_time=0.6,
        )

        insight_text = Text(
            "No long division needed!",
            font_size=38,
            color=YELLOW,
        )
        insight_text.next_to(result_box, DOWN, buff=0.6)
        insight_rect = SurroundingRectangle(
            insight_text, color=YELLOW, buff=0.2, corner_radius=0.1,
        )

        self.play(
            FadeIn(insight_text, shift=UP * 0.3),
            Create(insight_rect),
            run_time=1,
        )
        self.wait(2)
