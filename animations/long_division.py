"""
Polynomial Long Division: (x^3 + 4x - 5) / (x + 2)

Step-by-step procedural animation for Algebra 2 students.
Demonstrates zero-placeholder insertion for missing terms and
parenthesized subtraction. Shows the full divide-multiply-subtract-
bring-down cycle three times, color-coded by step, with a final
boxed result and verification.

Run with: manim -qm --format=mp4 long_division.py PolynomialLongDivision
"""
from manim import *

# 3B1B-style palette
BG_COLOR = "#1C1C1C"
STEP1_COLOR = "#3B82F6"   # blue
STEP2_COLOR = "#FACC15"   # yellow
STEP3_COLOR = "#22C55E"   # green
ACCENT_COLOR = "#EC4899"  # pink
HINT_COLOR = "#94A3B8"    # slate


class PolynomialLongDivision(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        # ==============================================================
        # 1. TITLE
        # ==============================================================
        title = Text("Polynomial Long Division", font_size=48, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        self.play(Write(title), run_time=1.0)
        self.wait(0.6)

        subtitle = MathTex(
            r"(x^3 + 4x - 5) \div (x + 2)",
            font_size=36,
        )
        subtitle.next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(subtitle, shift=UP * 0.2), run_time=0.8)
        self.wait(0.8)

        self.play(FadeOut(title), FadeOut(subtitle))
        self.wait(0.3)

        # ==============================================================
        # STEP 0 — ZERO-PLACEHOLDER INSERTION
        # ==============================================================
        # Show original polynomial with missing x^2 term
        original_label = Text(
            "Original polynomial:", font_size=28, color=HINT_COLOR,
        )
        original_label.move_to(UP * 2.0)

        original_poly = MathTex(
            r"x^3", r"+", r"4x", r"-", r"5",
            font_size=42,
        )
        original_poly.next_to(original_label, DOWN, buff=0.4)

        self.play(Write(original_label), run_time=0.5)
        self.play(Write(original_poly), run_time=0.8)
        self.wait(0.5)

        # Highlight the gap between x^3 and 4x with a brace
        gap_left = original_poly[0].get_right()
        gap_right = original_poly[1].get_left()
        gap_center_x = (gap_left[0] + gap_right[0]) / 2
        # Place brace below the gap between x^3 and +4x
        brace_start = original_poly[0].get_corner(DR) + DOWN * 0.1
        brace_end = original_poly[2].get_corner(DL) + DOWN * 0.1
        gap_brace = BraceBetweenPoints(
            brace_start, brace_end,
            direction=DOWN,
            color=ACCENT_COLOR,
        )
        gap_brace.shift(DOWN * 0.05)
        gap_text = Text(
            "Missing x\u00b2 term \u2014 insert 0x\u00b2 placeholder",
            font_size=22,
            color=ACCENT_COLOR,
        )
        gap_text.next_to(gap_brace, DOWN, buff=0.2)

        self.play(Create(gap_brace), FadeIn(gap_text, shift=UP * 0.1), run_time=0.8)
        self.wait(1.0)

        # Animate the polynomial transforming to include 0x^2
        new_poly = MathTex(
            r"x^3", r"+", r"0x^2", r"+", r"4x", r"-", r"5",
            font_size=42,
        )
        new_poly.move_to(original_poly.get_center())
        # Color the 0x^2 term pink to make it memorable
        new_poly[2].set_color(ACCENT_COLOR)

        self.play(
            FadeOut(gap_brace),
            FadeOut(gap_text),
            TransformMatchingTex(original_poly, new_poly),
            run_time=1.0,
        )
        self.wait(0.8)

        # Flash the 0x^2 for emphasis
        self.play(
            Indicate(new_poly[2], color=ACCENT_COLOR, scale_factor=1.3),
            run_time=0.6,
        )
        self.wait(0.5)

        # Clean up step 0
        self.play(FadeOut(original_label), FadeOut(new_poly), run_time=0.5)
        self.wait(0.3)

        # ==============================================================
        # 2. BUILD THE LONG-DIVISION LAYOUT
        # ==============================================================
        #              ___________________________
        #   x + 2  |  x^3 + 0x^2 + 4x - 5
        #
        # The vinculum (horizontal bar) sits above the dividend.
        # The divisor sits to the left of the vertical bar.

        origin = UP * 2.5 + LEFT * 1.0  # top-center-ish

        # Divisor
        divisor = MathTex(r"x + 2", font_size=36)
        divisor.move_to(origin + LEFT * 3.5)

        # Dividend terms (4 terms with 0x^2 placeholder)
        dividend = MathTex(
            r"x^3", r"+", r"0x^2", r"+", r"4x", r"-", r"5",
            font_size=36,
        )
        # Color the placeholder term
        dividend[2].set_color(ACCENT_COLOR)
        dividend.move_to(origin + RIGHT * 1.2)

        # Bracket: vertical line + horizontal bar (vinculum)
        bracket_v = Line(
            divisor.get_right() + RIGHT * 0.15 + UP * 0.35,
            divisor.get_right() + RIGHT * 0.15 + DOWN * 0.35,
            stroke_width=2,
        )
        bracket_h = Line(
            bracket_v.get_top(),
            bracket_v.get_top() + RIGHT * (dividend.get_right()[0] - bracket_v.get_top()[0] + 0.3),
            stroke_width=2,
        )

        self.play(
            Write(divisor),
            Create(bracket_v),
            Create(bracket_h),
            run_time=0.8,
        )
        self.play(Write(dividend), run_time=0.8)
        self.wait(0.5)

        # Cycle label (persistent reminder)
        cycle_text = Text(
            "Cycle: Divide \u2192 Multiply \u2192 Subtract \u2192 Bring down",
            font_size=22,
            color=HINT_COLOR,
        )
        cycle_text.to_edge(DOWN, buff=0.4)
        self.play(FadeIn(cycle_text, shift=UP * 0.15), run_time=0.6)
        self.wait(0.4)

        # Helper: y-positions for successive rows beneath the dividend
        row_y = dividend.get_center()[1]
        row_x_base = dividend[0].get_center()[0]  # align with x^3

        def row_below(n):
            """Return y coord for the n-th row below the dividend (1-indexed)."""
            return row_y - 0.55 * n

        # We will place quotient terms above the vinculum, aligned with the
        # corresponding dividend column.
        quotient_y = bracket_h.get_center()[1] + 0.35

        # ==============================================================
        # STEP 1  (BLUE) :  x^3 / x = x^2
        # ==============================================================
        step_color = ManimColor(STEP1_COLOR)

        # --- Divide ---
        step1_note = Text("Divide leading terms:", font_size=24, color=STEP1_COLOR)
        step1_calc = MathTex(r"x^3 \div x = x^2", font_size=28, color=STEP1_COLOR)
        step1_info = VGroup(step1_note, step1_calc).arrange(RIGHT, buff=0.25)
        step1_info.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(step1_info, shift=UP * 0.1), run_time=0.6)

        # Write x^2 in quotient
        q_x2 = MathTex(r"x^2", font_size=36, color=STEP1_COLOR)
        q_x2.move_to([dividend[2].get_center()[0], quotient_y, 0])
        self.play(Write(q_x2), run_time=0.5)
        self.wait(0.4)

        # --- Multiply ---
        self.play(FadeOut(step1_info), run_time=0.3)
        mult1_note = Text("Multiply:", font_size=24, color=STEP1_COLOR)
        mult1_calc = MathTex(r"x^2(x+2) = x^3 + 2x^2", font_size=28, color=STEP1_COLOR)
        mult1_info = VGroup(mult1_note, mult1_calc).arrange(RIGHT, buff=0.25)
        mult1_info.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(mult1_info, shift=UP * 0.1), run_time=0.5)

        # Write product below dividend
        prod1 = MathTex(r"x^3", r"+", r"2x^2", font_size=36, color=STEP1_COLOR)
        prod1[0].move_to([dividend[0].get_center()[0], row_below(1), 0])
        prod1[1].next_to(prod1[0], RIGHT, buff=0.1)
        prod1[2].next_to(prod1[1], RIGHT, buff=0.1)

        self.play(Write(prod1), run_time=0.6)
        self.wait(0.3)

        # --- Parenthesized subtraction ---
        self.play(FadeOut(mult1_info), run_time=0.3)

        # Show parenthesized form: -(x^3 + 2x^2)
        paren1 = MathTex(r"-(", r"x^3", r"+", r"2x^2", r")", font_size=32, color=STEP1_COLOR)
        paren1.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(paren1, shift=UP * 0.1), run_time=0.5)
        self.wait(0.5)

        # Animate distribution: show it becoming -x^3 - 2x^2
        distrib1 = MathTex(r"-x^3", r"-", r"2x^2", font_size=32, color=STEP1_COLOR)
        distrib1.move_to(paren1.get_center())
        self.play(Transform(paren1, distrib1), run_time=0.7)
        self.wait(0.5)

        # Subtraction line
        sub_line1 = Line(
            prod1.get_left() + LEFT * 0.15 + DOWN * 0.22,
            prod1.get_right() + RIGHT * 0.15 + DOWN * 0.22,
            stroke_width=2,
            color=STEP1_COLOR,
        )
        minus1 = MathTex(r"-", font_size=28, color=STEP1_COLOR)
        minus1.next_to(prod1, LEFT, buff=0.15)

        self.play(Write(minus1), Create(sub_line1), run_time=0.4)
        self.play(FadeOut(paren1), run_time=0.3)

        # --- Subtract & bring down ---
        sub1_note = Text("Subtract, bring down:", font_size=24, color=STEP1_COLOR)
        sub1_note.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(sub1_note, shift=UP * 0.1), run_time=0.4)

        # Result: (x^3 + 0x^2) - (x^3 + 2x^2) = -2x^2, bring down +4x
        rem1 = MathTex(r"-2x^2", r"+", r"4x", font_size=36)
        rem1[0].move_to([dividend[2].get_center()[0], row_below(2), 0])
        rem1[1].next_to(rem1[0], RIGHT, buff=0.1)
        rem1[2].next_to(rem1[1], RIGHT, buff=0.1)

        # Bring-down arrow for the +4x term
        bd_start1 = dividend[3].get_bottom() + DOWN * 0.05
        bd_end1 = [dividend[4].get_center()[0], row_below(2) + 0.2, 0]
        arrow1 = CurvedArrow(
            bd_start1, bd_end1,
            angle=-TAU / 6,
            color=HINT_COLOR,
            stroke_width=2,
            tip_length=0.15,
        )

        self.play(Write(rem1), run_time=0.6)
        self.play(Create(arrow1), run_time=0.5)
        self.wait(0.3)
        self.play(FadeOut(sub1_note), FadeOut(arrow1), run_time=0.3)

        # ==============================================================
        # STEP 2  (YELLOW) :  -2x^2 / x = -2x
        # ==============================================================
        step_color = ManimColor(STEP2_COLOR)

        # --- Divide ---
        step2_note = Text("Divide leading terms:", font_size=24, color=STEP2_COLOR)
        step2_calc = MathTex(r"-2x^2 \div x = -2x", font_size=28, color=STEP2_COLOR)
        step2_info = VGroup(step2_note, step2_calc).arrange(RIGHT, buff=0.25)
        step2_info.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(step2_info, shift=UP * 0.1), run_time=0.5)

        # Write -2x in quotient
        q_m2x = MathTex(r"-", r"2x", font_size=36, color=STEP2_COLOR)
        q_m2x.next_to(q_x2, RIGHT, buff=0.12)
        self.play(Write(q_m2x), run_time=0.5)
        self.wait(0.3)

        # --- Multiply ---
        self.play(FadeOut(step2_info), run_time=0.3)
        mult2_note = Text("Multiply:", font_size=24, color=STEP2_COLOR)
        mult2_calc = MathTex(r"-2x(x+2) = -2x^2 - 4x", font_size=28, color=STEP2_COLOR)
        mult2_info = VGroup(mult2_note, mult2_calc).arrange(RIGHT, buff=0.25)
        mult2_info.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(mult2_info, shift=UP * 0.1), run_time=0.5)

        # Write product below
        prod2 = MathTex(r"-2x^2", r"-", r"4x", font_size=36, color=STEP2_COLOR)
        prod2[0].move_to([rem1[0].get_center()[0], row_below(3), 0])
        prod2[1].next_to(prod2[0], RIGHT, buff=0.1)
        prod2[2].next_to(prod2[1], RIGHT, buff=0.1)

        self.play(Write(prod2), run_time=0.6)
        self.wait(0.3)

        # --- Parenthesized subtraction ---
        self.play(FadeOut(mult2_info), run_time=0.3)

        # Show parenthesized form: -(-2x^2 - 4x)
        paren2 = MathTex(r"-(", r"-2x^2", r"-", r"4x", r")", font_size=32, color=STEP2_COLOR)
        paren2.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(paren2, shift=UP * 0.1), run_time=0.5)
        self.wait(0.5)

        # Animate distribution: show it becoming +2x^2 + 4x
        distrib2 = MathTex(r"+2x^2", r"+", r"4x", font_size=32, color=STEP2_COLOR)
        distrib2.move_to(paren2.get_center())
        self.play(Transform(paren2, distrib2), run_time=0.7)
        self.wait(0.5)

        # Subtraction line
        sub_line2 = Line(
            prod2.get_left() + LEFT * 0.15 + DOWN * 0.22,
            prod2.get_right() + RIGHT * 0.15 + DOWN * 0.22,
            stroke_width=2,
            color=STEP2_COLOR,
        )
        minus2 = MathTex(r"-", font_size=28, color=STEP2_COLOR)
        minus2.next_to(prod2, LEFT, buff=0.15)

        self.play(Write(minus2), Create(sub_line2), run_time=0.4)
        self.play(FadeOut(paren2), run_time=0.3)

        # --- Subtract & bring down ---
        sub2_note = Text("Subtract, bring down:", font_size=24, color=STEP2_COLOR)
        sub2_note.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(sub2_note, shift=UP * 0.1), run_time=0.4)

        # Result: (-2x^2 + 4x) - (-2x^2 - 4x) = 8x, bring down -5
        rem2 = MathTex(r"8x", r"-", r"5", font_size=36)
        rem2[0].move_to([rem1[2].get_center()[0], row_below(4), 0])
        rem2[1].next_to(rem2[0], RIGHT, buff=0.1)
        rem2[2].next_to(rem2[1], RIGHT, buff=0.1)

        # Bring-down arrow for -5
        bd_start2 = dividend[5].get_bottom() + DOWN * 0.05
        bd_end2 = [dividend[6].get_center()[0], row_below(4) + 0.2, 0]
        arrow2 = CurvedArrow(
            bd_start2, bd_end2,
            angle=-TAU / 6,
            color=HINT_COLOR,
            stroke_width=2,
            tip_length=0.15,
        )

        self.play(Write(rem2), run_time=0.6)
        self.play(Create(arrow2), run_time=0.5)
        self.wait(0.3)
        self.play(FadeOut(sub2_note), FadeOut(arrow2), run_time=0.3)

        # ==============================================================
        # STEP 3  (GREEN) :  8x / x = 8
        # ==============================================================
        step_color = ManimColor(STEP3_COLOR)

        # --- Divide ---
        step3_note = Text("Divide leading terms:", font_size=24, color=STEP3_COLOR)
        step3_calc = MathTex(r"8x \div x = 8", font_size=28, color=STEP3_COLOR)
        step3_info = VGroup(step3_note, step3_calc).arrange(RIGHT, buff=0.25)
        step3_info.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(step3_info, shift=UP * 0.1), run_time=0.5)

        # Write +8 in quotient
        q_p8 = MathTex(r"+", r"8", font_size=36, color=STEP3_COLOR)
        q_p8.next_to(q_m2x, RIGHT, buff=0.12)
        self.play(Write(q_p8), run_time=0.5)
        self.wait(0.3)

        # --- Multiply ---
        self.play(FadeOut(step3_info), run_time=0.3)
        mult3_note = Text("Multiply:", font_size=24, color=STEP3_COLOR)
        mult3_calc = MathTex(r"8(x+2) = 8x + 16", font_size=28, color=STEP3_COLOR)
        mult3_info = VGroup(mult3_note, mult3_calc).arrange(RIGHT, buff=0.25)
        mult3_info.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(mult3_info, shift=UP * 0.1), run_time=0.5)

        # Write product below
        prod3 = MathTex(r"8x", r"+", r"16", font_size=36, color=STEP3_COLOR)
        prod3[0].move_to([rem2[0].get_center()[0], row_below(5), 0])
        prod3[1].next_to(prod3[0], RIGHT, buff=0.1)
        prod3[2].next_to(prod3[1], RIGHT, buff=0.1)

        self.play(Write(prod3), run_time=0.6)
        self.wait(0.3)

        # --- Parenthesized subtraction ---
        self.play(FadeOut(mult3_info), run_time=0.3)

        # Show parenthesized form: -(8x + 16)
        paren3 = MathTex(r"-(", r"8x", r"+", r"16", r")", font_size=32, color=STEP3_COLOR)
        paren3.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(paren3, shift=UP * 0.1), run_time=0.5)
        self.wait(0.5)

        # Animate distribution: show it becoming -8x - 16
        distrib3 = MathTex(r"-8x", r"-", r"16", font_size=32, color=STEP3_COLOR)
        distrib3.move_to(paren3.get_center())
        self.play(Transform(paren3, distrib3), run_time=0.7)
        self.wait(0.5)

        # Subtraction line
        sub_line3 = Line(
            prod3.get_left() + LEFT * 0.15 + DOWN * 0.22,
            prod3.get_right() + RIGHT * 0.15 + DOWN * 0.22,
            stroke_width=2,
            color=STEP3_COLOR,
        )
        minus3 = MathTex(r"-", font_size=28, color=STEP3_COLOR)
        minus3.next_to(prod3, LEFT, buff=0.15)

        self.play(Write(minus3), Create(sub_line3), run_time=0.4)
        self.play(FadeOut(paren3), run_time=0.3)

        # --- Subtract (no bring-down -- final remainder) ---
        sub3_note = Text("Subtract:", font_size=24, color=STEP3_COLOR)
        sub3_note.next_to(cycle_text, UP, buff=0.35)
        self.play(FadeIn(sub3_note, shift=UP * 0.1), run_time=0.4)

        # Remainder = (8x - 5) - (8x + 16) = -21
        remainder = MathTex(r"-21", font_size=36, color=ACCENT_COLOR)
        remainder.move_to([prod3[2].get_center()[0], row_below(6), 0])
        self.play(Write(remainder), run_time=0.5)
        self.wait(0.3)

        rem_label = Text("Remainder", font_size=22, color=ACCENT_COLOR)
        rem_label.next_to(remainder, RIGHT, buff=0.3)
        self.play(FadeIn(rem_label, shift=LEFT * 0.1), run_time=0.4)
        self.wait(0.5)

        self.play(FadeOut(sub3_note), FadeOut(cycle_text), run_time=0.3)

        # ==============================================================
        # 4. BOX THE RESULT
        # ==============================================================
        # Gather the full quotient for emphasis
        quotient_group = VGroup(q_x2, q_m2x, q_p8)
        q_box = SurroundingRectangle(quotient_group, color=STEP1_COLOR, buff=0.12)
        self.play(Create(q_box), run_time=0.6)

        result_text = Text("Quotient:", font_size=26, weight=BOLD)
        result_math = MathTex(r"x^2 - 2x + 8", font_size=34)
        result_rem = Text("Remainder:", font_size=26, weight=BOLD, color=ACCENT_COLOR)
        result_rem_val = MathTex(r"-21", font_size=34, color=ACCENT_COLOR)

        result_line = VGroup(
            result_text, result_math,
            result_rem, result_rem_val,
        ).arrange(RIGHT, buff=0.25)
        result_line.next_to(cycle_text, UP, buff=0.0)
        result_line.to_edge(DOWN, buff=0.6)
        self.play(FadeIn(result_line, shift=UP * 0.15), run_time=0.7)
        self.wait(1.0)

        # ==============================================================
        # 5. VERIFICATION EQUATION
        # ==============================================================
        # Fade the tableau slightly to make room
        tableau = VGroup(
            divisor, bracket_v, bracket_h, dividend,
            q_x2, q_m2x, q_p8, q_box,
            prod1, minus1, sub_line1, rem1,
            prod2, minus2, sub_line2, rem2,
            prod3, minus3, sub_line3, remainder, rem_label,
        )
        self.play(
            tableau.animate.scale(0.65).shift(UP * 0.5 + LEFT * 1.5),
            FadeOut(result_line),
            run_time=0.8,
        )
        self.wait(0.3)

        verify_title = Text("Verify:", font_size=30, weight=BOLD, color=STEP3_COLOR)
        verify_title.move_to(RIGHT * 2.8 + UP * 1.2)

        verify_eq = MathTex(
            r"x^3 + 4x - 5",
            r"=",
            r"(x+2)",
            r"(x^2 - 2x + 8)",
            r"+",
            r"(-21)",
            font_size=30,
        )
        verify_eq[2].set_color(STEP1_COLOR)
        verify_eq[3].set_color(STEP2_COLOR)
        verify_eq[5].set_color(ACCENT_COLOR)
        verify_eq.next_to(verify_title, DOWN, buff=0.35)

        self.play(Write(verify_title), run_time=0.5)
        self.play(Write(verify_eq), run_time=1.2)
        self.wait(0.6)

        # General form reminder (use Text to avoid \text{} in MathTex)
        gen_dividend = Text("Dividend", font_size=24, color=HINT_COLOR)
        gen_eq = MathTex(r"=", font_size=26, color=HINT_COLOR)
        gen_divisor = Text("Divisor", font_size=24, color=HINT_COLOR)
        gen_times = MathTex(r"\times", font_size=26, color=HINT_COLOR)
        gen_quotient = Text("Quotient", font_size=24, color=HINT_COLOR)
        gen_plus = MathTex(r"+", font_size=26, color=HINT_COLOR)
        gen_remainder = Text("Remainder", font_size=24, color=HINT_COLOR)
        general = VGroup(
            gen_dividend, gen_eq, gen_divisor, gen_times,
            gen_quotient, gen_plus, gen_remainder,
        ).arrange(RIGHT, buff=0.15)
        general.next_to(verify_eq, DOWN, buff=0.5)
        self.play(FadeIn(general, shift=UP * 0.1), run_time=0.6)

        verify_box = SurroundingRectangle(
            VGroup(verify_eq, general), color=STEP3_COLOR, buff=0.2
        )
        self.play(Create(verify_box), run_time=0.5)
        self.wait(2.0)
