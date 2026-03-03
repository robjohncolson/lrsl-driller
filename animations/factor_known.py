"""
Factoring with a Known Factor:
Given one factor of a polynomial, divide to find the quotient,
then factor the quotient to get the complete factorization.

Example: P(x) = x^3 + 2x^2 - 5x - 6, known factor (x + 1)

Run with: manim -qm --format=mp4 factor_known.py FactorWithKnownFactor
"""
from manim import *


class FactorWithKnownFactor(Scene):
    def construct(self):
        # ── Color palette ──
        KNOWN_BLUE = BLUE
        QUOTIENT_YELLOW = YELLOW
        FACTOR_GREEN = GREEN
        ACCENT_PINK = ManimColor("#e07cba")
        CHECK_COLOR = ManimColor("#7ccc6f")
        DIM_GRAY = ManimColor("#888888")

        # ================================================================
        # 1. TITLE
        # ================================================================
        title = Text("Finding All Factors", font_size=50)
        subtitle = Text(
            "when you already know one",
            font_size=28,
            color=DIM_GRAY,
        )
        subtitle.next_to(title, DOWN, buff=0.25)
        self.play(Write(title), run_time=0.8)
        self.play(FadeIn(subtitle, shift=UP * 0.2), run_time=0.6)
        self.wait(0.6)
        self.play(FadeOut(title), FadeOut(subtitle))

        # ================================================================
        # 2. GIVEN INFORMATION
        # ================================================================
        given_label = Text("Given:", font_size=30, color=DIM_GRAY)
        given_label.to_edge(UP, buff=0.5).to_edge(LEFT, buff=0.8)

        poly_line = MathTex(
            "P(x)", "=", "x^3", "+", "2x^2", "-", "5x", "-", "6",
            font_size=36,
        )
        poly_line.next_to(given_label, DOWN, buff=0.3, aligned_edge=LEFT)

        factor_line = VGroup(
            MathTex("(x + 1)", font_size=36, color=KNOWN_BLUE),
            Text("is a factor", font_size=28),
        ).arrange(RIGHT, buff=0.2)
        factor_line.next_to(poly_line, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(Write(given_label), run_time=0.5)
        self.play(Write(poly_line), run_time=0.8)
        self.play(Write(factor_line), run_time=0.8)
        self.wait(0.8)

        # ================================================================
        # 3. THE CHAIN — step labels along the right side
        # ================================================================
        chain_group = VGroup(given_label, poly_line, factor_line)

        # Shrink given block and pin it to top-left
        self.play(chain_group.animate.scale(0.8).to_corner(UL, buff=0.4), run_time=0.6)

        # ── Step 1 header ──
        step1_head = Text("Step 1: Divide P(x) by (x + 1)", font_size=30, color=KNOWN_BLUE)
        step1_head.next_to(chain_group, DOWN, buff=0.5, aligned_edge=LEFT)
        self.play(Write(step1_head), run_time=0.6)

        # ── Condensed synthetic / long division result ──
        div_setup = MathTex(
            "\\frac{x^3 + 2x^2 - 5x - 6}{x + 1}",
            font_size=34,
        )
        div_setup.next_to(step1_head, DOWN, buff=0.35, aligned_edge=LEFT)
        self.play(Write(div_setup), run_time=0.8)
        self.wait(0.5)

        # Show arrow leading to quotient
        arrow1 = MathTex("=", font_size=34)
        arrow1.next_to(div_setup, RIGHT, buff=0.3)

        quotient = MathTex("x^2 + x - 6", font_size=36, color=QUOTIENT_YELLOW)
        quotient.next_to(arrow1, RIGHT, buff=0.3)

        self.play(Write(arrow1), run_time=0.3)
        self.play(Write(quotient), run_time=0.8)
        self.wait(0.6)

        # Quick verification note
        verify_note = Text(
            "(no remainder — confirms it is a factor)",
            font_size=20,
            color=DIM_GRAY,
        )
        verify_note.next_to(div_setup, DOWN, buff=0.2, aligned_edge=LEFT)
        self.play(FadeIn(verify_note, shift=UP * 0.1), run_time=0.5)
        self.wait(0.5)

        # ================================================================
        # 4. STEP 2 — Factor the quadratic
        # ================================================================
        step2_head = Text("Step 2: Factor the quadratic", font_size=30, color=QUOTIENT_YELLOW)
        step2_head.next_to(verify_note, DOWN, buff=0.45, aligned_edge=LEFT)
        self.play(Write(step2_head), run_time=0.6)

        # Restate the quadratic
        quad_restate = MathTex("x^2 + x - 6", font_size=34, color=QUOTIENT_YELLOW)
        quad_restate.next_to(step2_head, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(quad_restate), run_time=0.5)

        # Find two numbers
        find_text = Text(
            "Find two numbers that multiply to -6 and add to 1",
            font_size=24,
        )
        find_text.next_to(quad_restate, DOWN, buff=0.3, aligned_edge=LEFT)
        self.play(Write(find_text), run_time=0.7)
        self.wait(0.4)

        # Show the pair: 3 and -2
        prod_check = MathTex(
            "3", "\\times", "(-2)", "=", "-6", "\\checkmark",
            font_size=30,
        )
        prod_check[4].set_color(ACCENT_PINK)
        prod_check[5].set_color(CHECK_COLOR)
        prod_check.next_to(find_text, DOWN, buff=0.25, aligned_edge=LEFT)

        sum_check = MathTex(
            "3", "+", "(-2)", "=", "1", "\\checkmark",
            font_size=30,
        )
        sum_check[4].set_color(ACCENT_PINK)
        sum_check[5].set_color(CHECK_COLOR)
        sum_check.next_to(prod_check, RIGHT, buff=0.8)

        self.play(Write(prod_check), run_time=0.6)
        self.play(Write(sum_check), run_time=0.6)
        self.wait(0.5)

        # Factor result
        quad_factored = MathTex(
            "(x + 3)", "(x - 2)",
            font_size=36,
        )
        quad_factored[0].set_color(QUOTIENT_YELLOW)
        quad_factored[1].set_color(FACTOR_GREEN)
        quad_factored.next_to(prod_check, DOWN, buff=0.35, aligned_edge=LEFT)

        eq_sign = MathTex("=", font_size=34)
        eq_sign.next_to(quad_restate, RIGHT, buff=0.25)
        quad_factored.next_to(eq_sign, RIGHT, buff=0.25)

        # Reposition so the factored form sits to the right of the quadratic
        eq_and_factors = VGroup(eq_sign, quad_factored)
        eq_and_factors.next_to(quad_restate, RIGHT, buff=0.25)

        self.play(Write(eq_sign), run_time=0.3)
        self.play(
            TransformFromCopy(prod_check[0], quad_factored[0]),
            TransformFromCopy(prod_check[2], quad_factored[1]),
            run_time=1,
        )
        self.wait(0.8)

        # ================================================================
        # 5. STEP 3 — Assemble the complete factorization
        # ================================================================
        # Clear the working area
        work_items = VGroup(
            step1_head, div_setup, arrow1, quotient, verify_note,
            step2_head, quad_restate, find_text, prod_check, sum_check,
            eq_sign, quad_factored,
        )
        self.play(FadeOut(work_items), run_time=0.7)

        step3_head = Text("Step 3: Complete Factorization", font_size=34, color=WHITE)
        step3_head.next_to(chain_group, DOWN, buff=0.7, aligned_edge=LEFT)
        self.play(Write(step3_head), run_time=0.6)

        # Build up the final answer piece by piece
        final_eq = MathTex("P(x)", "=", font_size=40)
        final_f1 = MathTex("(x + 1)", font_size=40, color=KNOWN_BLUE)
        final_f2 = MathTex("(x + 3)", font_size=40, color=QUOTIENT_YELLOW)
        final_f3 = MathTex("(x - 2)", font_size=40, color=FACTOR_GREEN)

        final_line = VGroup(final_eq, final_f1, final_f2, final_f3)
        final_line.arrange(RIGHT, buff=0.15)
        final_line.next_to(step3_head, DOWN, buff=0.5)

        # Animate each factor appearing with a smooth scale-in
        self.play(Write(final_eq), run_time=0.5)

        # Known factor slides in from above
        self.play(
            FadeIn(final_f1, shift=DOWN * 0.4, scale=1.2),
            run_time=0.6,
        )
        # Label under known factor
        lbl1 = Text("known", font_size=18, color=KNOWN_BLUE)
        lbl1.next_to(final_f1, DOWN, buff=0.15)
        self.play(FadeIn(lbl1), run_time=0.3)

        # Quotient factors
        self.play(
            FadeIn(final_f2, shift=DOWN * 0.4, scale=1.2),
            run_time=0.6,
        )
        self.play(
            FadeIn(final_f3, shift=DOWN * 0.4, scale=1.2),
            run_time=0.6,
        )
        lbl2 = Text("from factoring the quotient", font_size=18, color=DIM_GRAY)
        lbl2.next_to(VGroup(final_f2, final_f3), DOWN, buff=0.15)
        self.play(FadeIn(lbl2), run_time=0.3)
        self.wait(0.6)

        # ================================================================
        # 6. ROOTS ON A NUMBER LINE
        # ================================================================
        self.play(FadeOut(lbl1), FadeOut(lbl2))

        roots_head = Text("The roots (zeros) of P(x):", font_size=26, color=DIM_GRAY)
        roots_head.next_to(final_line, DOWN, buff=0.6)
        self.play(Write(roots_head), run_time=0.5)

        # Number line from -4 to 3
        nline = NumberLine(
            x_range=[-4, 3, 1],
            length=8,
            include_numbers=True,
            font_size=22,
        )
        nline.next_to(roots_head, DOWN, buff=0.4)

        self.play(Create(nline), run_time=0.7)

        # Mark each root
        root_data = [
            (-3, QUOTIENT_YELLOW, "x = -3"),
            (-1, KNOWN_BLUE, "x = -1"),
            (2, FACTOR_GREEN, "x = 2"),
        ]
        dots = VGroup()
        labels = VGroup()
        for val, col, txt in root_data:
            dot = Dot(nline.n2p(val), radius=0.1, color=col)
            lbl = MathTex(txt, font_size=22, color=col)
            lbl.next_to(dot, UP, buff=0.2)
            dots.add(dot)
            labels.add(lbl)

        # Stagger appearance
        for dot, lbl in zip(dots, labels):
            self.play(
                GrowFromCenter(dot),
                FadeIn(lbl, shift=DOWN * 0.15),
                run_time=0.5,
            )
        self.wait(0.5)

        # ================================================================
        # 7. BOX THE FINAL ANSWER
        # ================================================================
        answer_box = SurroundingRectangle(
            final_line,
            color=WHITE,
            buff=0.2,
            corner_radius=0.1,
        )
        self.play(Create(answer_box), run_time=0.8)
        self.wait(0.3)

        # Flash the box gold
        self.play(
            answer_box.animate.set_color(GOLD),
            run_time=0.5,
        )

        # ── Strategy recap (small, bottom-right) ──
        recap = VGroup(
            Text("Strategy", font_size=22, color=GOLD),
            Text("1. Divide by the known factor", font_size=18),
            Text("2. Factor the quotient", font_size=18),
            Text("3. Write all factors together", font_size=18),
        ).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        recap.to_corner(DR, buff=0.4)
        self.play(FadeIn(recap, shift=LEFT * 0.3), run_time=0.8)

        self.wait(1.5)
