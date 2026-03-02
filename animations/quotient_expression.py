"""
Writing the Quotient Expression:
Expressing polynomial division results as q(x) + r/(x - a)

Uses the integer division analogy to build understanding,
then derives the polynomial form algebraically.

Example: (2x^3 + 3x^2 - x + 7) / (x - 2) = 2x^2 + 7x + 13 + 33/(x - 2)

Run with: manim -qm --format=mp4 quotient_expression.py QuotientExpression
"""
from manim import *


class QuotientExpression(Scene):
    def construct(self):
        # ── Color palette ──────────────────────────────────────────
        QUOT_BLUE = BLUE_C
        REM_YELLOW = YELLOW
        IDENTITY_GREEN = GREEN_C
        ACCENT_TEAL = TEAL_C

        # ============================================================
        # SECTION 1 — Title
        # ============================================================
        title = Text("The Complete Division Statement", font_size=46)
        title.to_edge(UP, buff=0.6)
        self.play(Write(title), run_time=1)
        self.wait(0.5)

        # ============================================================
        # SECTION 2 — Integer division analogy
        # ============================================================
        analogy_label = Text("You already know this from arithmetic:", font_size=26)
        analogy_label.next_to(title, DOWN, buff=0.5)
        self.play(FadeIn(analogy_label, shift=DOWN * 0.3), run_time=0.6)

        # 17 / 5 = 3 remainder 2  (mixed VGroup to avoid \text in MathTex)
        int_div_math_l = MathTex("17 \\div 5 = ", font_size=38)
        int_div_q = MathTex("3", font_size=38, color=QUOT_BLUE)
        int_div_rem_word = Text(" remainder ", font_size=22)
        int_div_r = MathTex("2", font_size=38, color=REM_YELLOW)
        int_div = VGroup(int_div_math_l, int_div_q, int_div_rem_word, int_div_r)
        int_div.arrange(RIGHT, buff=0.15, aligned_edge=DOWN)
        int_div.next_to(analogy_label, DOWN, buff=0.6)

        self.play(Write(int_div), run_time=1)
        self.wait(0.8)

        # Transform to fraction form: 17/5 = 3 + 2/5
        int_frac = MathTex(
            "\\frac{17}{5}", "=", "3", "+", "\\frac{2}{5}",
            font_size=38
        )
        int_frac.move_to(int_div.get_center())
        int_frac[2].set_color(QUOT_BLUE)
        int_frac[4].set_color(REM_YELLOW)

        self.play(ReplacementTransform(int_div, int_frac), run_time=1.2)
        self.wait(0.8)

        # Label parts
        q_brace = Brace(int_frac[2], DOWN, buff=0.15)
        q_label = Text("quotient", font_size=20, color=QUOT_BLUE)
        q_label.next_to(q_brace, DOWN, buff=0.1)

        r_brace = Brace(int_frac[4], DOWN, buff=0.15)
        r_label = Text("remainder fraction", font_size=20, color=REM_YELLOW)
        r_label.next_to(r_brace, DOWN, buff=0.1)

        self.play(
            GrowFromCenter(q_brace), FadeIn(q_label),
            GrowFromCenter(r_brace), FadeIn(r_label),
            run_time=0.8
        )
        self.wait(1)

        # ============================================================
        # SECTION 3 — Transition: "Polynomials work the same way!"
        # ============================================================
        bridge = Text(
            "Polynomials work exactly the same way!",
            font_size=30, color=ACCENT_TEAL
        )
        bridge.next_to(r_label, DOWN, buff=0.6)
        self.play(Write(bridge), run_time=0.8)
        self.wait(0.8)

        # Fade the integer section
        self.play(
            FadeOut(VGroup(
                analogy_label, int_frac, q_brace, q_label,
                r_brace, r_label, bridge
            )),
            run_time=0.6
        )

        # ============================================================
        # SECTION 4 — The Division Identity
        # ============================================================
        identity_label = Text("The Division Identity", font_size=30, color=IDENTITY_GREEN)
        identity_label.next_to(title, DOWN, buff=0.5)
        self.play(Write(identity_label), run_time=0.6)

        # P(x) = q(x) * (x - a) + r
        identity = MathTex(
            "P(x)", "=", "q(x)", "\\cdot", "(x - a)", "+", "r",
            font_size=38
        )
        identity.next_to(identity_label, DOWN, buff=0.5)
        identity[2].set_color(QUOT_BLUE)
        identity[6].set_color(REM_YELLOW)

        self.play(Write(identity), run_time=1)
        self.wait(0.8)

        # Instruction: divide both sides by (x - a)
        divide_text = Text("Divide both sides by (x - a):", font_size=24)
        divide_text.next_to(identity, DOWN, buff=0.5)
        self.play(FadeIn(divide_text, shift=RIGHT * 0.3), run_time=0.5)
        self.wait(0.5)

        # P(x)/(x-a) = q(x) + r/(x-a)
        result_identity = MathTex(
            "\\frac{P(x)}{(x - a)}", "=", "q(x)", "+",
            "\\frac{r}{(x - a)}",
            font_size=38
        )
        result_identity.next_to(divide_text, DOWN, buff=0.5)
        result_identity[2].set_color(QUOT_BLUE)
        result_identity[4].set_color(REM_YELLOW)

        self.play(Write(result_identity), run_time=1.2)
        self.wait(1)

        # Box the identity
        id_box = SurroundingRectangle(result_identity, color=IDENTITY_GREEN, buff=0.15)
        self.play(Create(id_box), run_time=0.6)
        self.wait(0.8)

        # ============================================================
        # SECTION 5 — Concrete example
        # ============================================================
        self.play(
            FadeOut(VGroup(identity_label, identity, divide_text,
                           result_identity, id_box)),
            run_time=0.5
        )

        example_label = Text("Concrete Example", font_size=30, color=ACCENT_TEAL)
        example_label.next_to(title, DOWN, buff=0.5)
        self.play(Write(example_label), run_time=0.5)

        # Show the division problem
        problem = MathTex(
            "\\frac{2x^3 + 3x^2 - x + 7}{x - 2}",
            font_size=38
        )
        problem.next_to(example_label, DOWN, buff=0.5)
        self.play(Write(problem), run_time=1)
        self.wait(0.5)

        # Show the given results from synthetic division
        given = VGroup(
            MathTex("q(x) = 2x^2 + 7x + 13", font_size=30, color=QUOT_BLUE),
            MathTex("r = 33", font_size=30, color=REM_YELLOW),
        ).arrange(RIGHT, buff=1.5)
        given.next_to(problem, DOWN, buff=0.5)

        from_div = Text("(from synthetic division)", font_size=20, color=GREY_B)
        from_div.next_to(given, DOWN, buff=0.15)

        self.play(Write(given), FadeIn(from_div), run_time=0.8)
        self.wait(0.8)

        # Build the complete expression
        self.play(FadeOut(from_div), run_time=0.3)

        # Full result
        full_result = MathTex(
            "\\frac{2x^3 + 3x^2 - x + 7}{x - 2}",
            "=",
            "2x^2 + 7x + 13",
            "+",
            "\\frac{33}{x - 2}",
            font_size=36
        )
        full_result.next_to(given, DOWN, buff=0.6)
        full_result[2].set_color(QUOT_BLUE)
        full_result[4].set_color(REM_YELLOW)

        self.play(
            Write(full_result),
            run_time=1.5
        )
        self.wait(0.8)

        # ============================================================
        # SECTION 6 — Key insight + final box
        # ============================================================
        insight = Text(
            "The remainder fraction is always a constant over the divisor",
            font_size=24, color=REM_YELLOW
        )
        insight.next_to(full_result, DOWN, buff=0.5)
        self.play(Write(insight), run_time=0.8)
        self.wait(0.5)

        # Box the complete expression
        final_box = SurroundingRectangle(
            full_result, color=GOLD, buff=0.2, corner_radius=0.1
        )
        self.play(Create(final_box), run_time=0.8)
        self.wait(0.5)

        # Flash the quotient and remainder parts for emphasis
        self.play(
            Indicate(full_result[2], color=WHITE, scale_factor=1.1),
            run_time=0.6
        )
        self.play(
            Indicate(full_result[4], color=WHITE, scale_factor=1.1),
            run_time=0.6
        )
        self.wait(1.5)
