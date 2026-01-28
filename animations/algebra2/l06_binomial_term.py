"""
Level 6: Binomial Term Finder (Error Analysis)
Shows how to find specific terms in binomial expansion and common errors.

Run with: python -m manim -qm --format=mp4 l06_binomial_term.py BinomialTermFinder
"""
from manim import *


class BinomialTermFinder(Scene):
    def construct(self):
        # Title
        title = Text("Binomial Term Finder", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Show Binomial Theorem
        theorem = MathTex(
            r"(x+y)^n = \sum_{k=0}^{n} \binom{n}{k} x^{n-k} y^k",
            font_size=36, color=YELLOW
        )
        theorem.shift(UP * 2)
        self.play(Write(theorem))
        self.wait(1)

        # Example: Find the x^3 term in (2x + 3)^5
        problem = Text("Find the x^3 term in (2x + 3)^5", font_size=28, color=WHITE)
        problem.shift(UP * 1)
        self.play(Write(problem))
        self.wait(0.5)

        # Step 1: Identify
        step1 = VGroup(
            Text("Step 1: Set up", font_size=24, color=BLUE),
            MathTex(r"n = 5, \quad x \to 2x, \quad y \to 3", font_size=28),
        ).arrange(DOWN, buff=0.1)
        step1.shift(UP * 0.2)
        self.play(Write(step1))
        self.wait(0.5)

        # Step 2: Find k
        step2 = VGroup(
            Text("Step 2: Find k where exponent of x is 3", font_size=24, color=BLUE),
            MathTex(r"(2x)^{5-k} \text{ gives } x^3 \Rightarrow 5-k = 3 \Rightarrow k = 2", font_size=28),
        ).arrange(DOWN, buff=0.1)
        step2.shift(DOWN * 0.7)
        self.play(Write(step2))
        self.wait(0.5)

        # Step 3: Calculate
        step3 = VGroup(
            Text("Step 3: Calculate the term", font_size=24, color=BLUE),
            MathTex(r"\binom{5}{2}(2x)^3(3)^2", font_size=32),
            MathTex(r"= 10 \cdot 8x^3 \cdot 9", font_size=32),
            MathTex(r"= 720x^3", font_size=36, color=GREEN),
        ).arrange(DOWN, buff=0.15)
        step3.shift(DOWN * 2)

        for item in step3:
            self.play(Write(item), run_time=0.6)
            self.wait(0.3)

        box = SurroundingRectangle(step3[-1], color=GREEN, buff=0.1)
        self.play(Create(box))
        self.wait(1)

        # Clear and show common error
        self.play(
            FadeOut(problem), FadeOut(step1), FadeOut(step2),
            FadeOut(step3), FadeOut(box)
        )

        error_title = Text("Common Error to Avoid", font_size=32, color=RED)
        error_title.shift(UP * 1.5)
        self.play(Write(error_title))

        # Wrong approach
        wrong = VGroup(
            MathTex(r"\text{Wrong: } (2x)^3 \cdot 3^2 = 8x^3 \cdot 9 = 72x^3", font_size=30, color=RED),
            Text("Forgot the binomial coefficient!", font_size=24, color=RED),
        ).arrange(DOWN, buff=0.2)
        wrong.shift(UP * 0.3)
        self.play(Write(wrong))
        self.wait(1)

        # Correct approach
        correct = VGroup(
            MathTex(r"\text{Correct: } \binom{5}{2}(2x)^3 \cdot 3^2 = 10 \cdot 72x^3 = 720x^3", font_size=30, color=GREEN),
            Text("Always include C(n,k) from Pascal's Triangle!", font_size=24, color=GREEN),
        ).arrange(DOWN, buff=0.2)
        correct.shift(DOWN * 1)
        self.play(Write(correct))
        self.wait(1)

        # Key insight box
        insight = VGroup(
            Text("Remember:", font_size=26, color=YELLOW),
            Text("Term = C(n,k) * (first)^(n-k) * (second)^k", font_size=22),
            Text("Exponents must add to n", font_size=22),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        insight.to_edge(DOWN, buff=0.5)

        insight_box = SurroundingRectangle(insight, color=YELLOW, buff=0.15)
        self.play(Write(insight), Create(insight_box))
        self.wait(2)
