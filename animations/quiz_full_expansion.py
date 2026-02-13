from manim import *

class QuizFullExpansion(Scene):
    def construct(self):
        # Title
        title = Text("Full Binomial Expansion", font_size=48, color=YELLOW)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait()

        # Show the problem
        problem = MathTex("(x - 3)^5", font_size=60, color=WHITE)
        self.play(Write(problem))
        self.wait()
        self.play(problem.animate.scale(0.7).to_edge(UP).shift(DOWN * 0.8))

        # Step 1: Pascal's Row 5
        step1_title = Text("Step 1: Write Pascal's Row 5", font_size=32, color=YELLOW)
        step1_title.shift(UP * 2)
        pascal_row = MathTex("1", ",", "5", ",", "10", ",", "10", ",", "5", ",", "1", font_size=40, color=BLUE)
        pascal_row.shift(UP * 1.2)

        self.play(FadeOut(problem), Write(step1_title))
        self.wait(0.5)
        self.play(Write(pascal_row))
        self.wait(1.5)

        # Step 2: Evaluate powers of (-3)
        step2_title = Text("Step 2: Evaluate powers of (−3)", font_size=32, color=YELLOW)
        step2_title.shift(UP * 2)

        powers = VGroup(
            MathTex("(-3)^0", "=", "1", font_size=32, color=GREEN),
            MathTex("(-3)^1", "=", "-3", font_size=32, color=RED),
            MathTex("(-3)^2", "=", "9", font_size=32, color=GREEN),
            MathTex("(-3)^3", "=", "-27", font_size=32, color=RED),
            MathTex("(-3)^4", "=", "81", font_size=32, color=GREEN),
            MathTex("(-3)^5", "=", "-243", font_size=32, color=RED),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        powers.shift(UP * 0.2)

        self.play(FadeOut(step1_title), FadeOut(pascal_row), Write(step2_title))
        self.wait(0.5)
        for power in powers:
            self.play(Write(power), run_time=0.4)
        self.wait(1.5)

        # Step 3: Multiply Pascal × powers
        step3_title = Text("Step 3: Multiply Pascal × powers", font_size=32, color=YELLOW)
        step3_title.shift(UP * 2)

        products = VGroup(
            MathTex("1", r"\times", "1", "=", "1", font_size=32),
            MathTex("5", r"\times", "(-3)", "=", "-15", font_size=32),
            MathTex("10", r"\times", "9", "=", "90", font_size=32),
            MathTex("10", r"\times", "(-27)", "=", "-270", font_size=32),
            MathTex("5", r"\times", "81", "=", "405", font_size=32),
            MathTex("1", r"\times", "(-243)", "=", "-243", font_size=32),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        products.shift(UP * 0.2)

        self.play(FadeOut(step2_title), FadeOut(powers), Write(step3_title))
        self.wait(0.5)
        for product in products:
            self.play(Write(product), run_time=0.4)
        self.wait(1.5)

        # Step 4: Write in standard form
        step4_title = Text("Step 4: Write in standard form", font_size=32, color=YELLOW)
        step4_title.shift(UP * 2.5)

        final_answer = MathTex(
            "x^5", "-", "15x^4", "+", "90x^3", "-", "270x^2", "+", "405x", "-", "243",
            font_size=36
        )
        final_answer.shift(UP * 0.8)

        answer_box = SurroundingRectangle(final_answer, color=GREEN, buff=0.2)

        self.play(FadeOut(step3_title), FadeOut(products), Write(step4_title))
        self.wait(0.5)
        self.play(Write(final_answer))
        self.wait(0.5)
        self.play(Create(answer_box))
        self.wait(1.5)

        # Highlight alternating sign pattern
        signs = VGroup(
            final_answer[0],   # x^5 (positive, implicit +)
            final_answer[1],   # -
            final_answer[3],   # +
            final_answer[5],   # -
            final_answer[7],   # +
            final_answer[9],   # -
        )

        # Create sign indicators
        sign_text = Text("+  −  +  −  +  −", font_size=32, color=YELLOW)
        sign_text.next_to(final_answer, DOWN, buff=0.5)

        self.play(Write(sign_text))
        self.wait(1)

        # Key insight
        insight = Text(
            "When the constant is NEGATIVE,\nsigns ALTERNATE: +, −, +, −, ...",
            font_size=28,
            color=YELLOW,
            line_spacing=1.2
        )
        insight.next_to(sign_text, DOWN, buff=0.5)
        insight_box = SurroundingRectangle(insight, color=YELLOW, buff=0.2)

        self.play(Write(insight))
        self.play(Create(insight_box))
        self.wait(2)

        # Fade out everything
        self.play(
            FadeOut(step4_title),
            FadeOut(final_answer),
            FadeOut(answer_box),
            FadeOut(sign_text),
            FadeOut(insight),
            FadeOut(insight_box)
        )
        self.wait()
