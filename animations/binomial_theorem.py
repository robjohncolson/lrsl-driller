"""
Binomial Theorem: (x + y)^n expansion
Shows how Pascal's Triangle coefficients work with the expansion

Run with: manim -pql binomial_theorem.py BinomialTheorem
"""
from manim import *
import math

def binomial(n, k):
    return math.factorial(n) // (math.factorial(k) * math.factorial(n - k))


class BinomialTheorem(Scene):
    def construct(self):
        title = Text("The Binomial Theorem", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        # Show the general formula
        formula = MathTex(
            "(x + y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^k",
            font_size=36
        )
        formula.next_to(title, DOWN)
        self.play(Write(formula))
        self.wait(1)

        # Explain the parts
        explanation = VGroup(
            MathTex("\\binom{n}{k}", "= \\text{binomial coefficient from Pascal's Triangle}", font_size=24),
            MathTex("x^{n-k}", "= \\text{power of x decreases from n to 0}", font_size=24),
            MathTex("y^k", "= \\text{power of y increases from 0 to n}", font_size=24),
        ).arrange(DOWN, buff=0.3, aligned_edge=LEFT)
        explanation.shift(DOWN * 0.5)

        for line in explanation:
            line[0].set_color(YELLOW)
            self.play(Write(line), run_time=0.7)
        self.wait(1)

        self.play(FadeOut(explanation))

        # Example with n = 3
        example_title = Text("Example: n = 3", font_size=32, color=GREEN)
        example_title.shift(UP * 0.5)
        self.play(Write(example_title))

        # Show Pascal's row 3
        pascal_row = MathTex(
            "\\text{Row 3 of Pascal's: } 1, 3, 3, 1",
            font_size=28
        )
        pascal_row.next_to(example_title, DOWN)
        self.play(Write(pascal_row))
        self.wait(0.5)

        # Build the expansion term by term
        terms_title = Text("Building each term:", font_size=24)
        terms_title.next_to(pascal_row, DOWN, buff=0.5)
        self.play(Write(terms_title))

        # Create term explanations
        term_data = [
            ("k=0:", "\\binom{3}{0}", "x^3", "y^0", "= 1 \\cdot x^3 \\cdot 1 = x^3"),
            ("k=1:", "\\binom{3}{1}", "x^2", "y^1", "= 3 \\cdot x^2 \\cdot y = 3x^2y"),
            ("k=2:", "\\binom{3}{2}", "x^1", "y^2", "= 3 \\cdot x \\cdot y^2 = 3xy^2"),
            ("k=3:", "\\binom{3}{3}", "x^0", "y^3", "= 1 \\cdot 1 \\cdot y^3 = y^3"),
        ]

        term_group = VGroup()
        for k_label, coeff, x_pow, y_pow, result in term_data:
            term = MathTex(
                k_label, "\\quad", coeff, x_pow, y_pow, "\\quad", result,
                font_size=24
            )
            term[2].set_color(YELLOW)  # coefficient
            term[3].set_color(BLUE)    # x power
            term[4].set_color(RED)     # y power
            term_group.add(term)

        term_group.arrange(DOWN, buff=0.25, aligned_edge=LEFT)
        term_group.next_to(terms_title, DOWN, buff=0.3)

        for term in term_group:
            self.play(Write(term), run_time=0.6)
        self.wait(1)

        # Show final result
        self.play(
            FadeOut(term_group),
            FadeOut(terms_title),
            FadeOut(pascal_row),
            FadeOut(example_title)
        )

        final = MathTex(
            "(x + y)^3 = x^3 + 3x^2y + 3xy^2 + y^3",
            font_size=40,
            color=GREEN
        )
        final.shift(DOWN * 0.5)
        self.play(Write(final))

        box = SurroundingRectangle(final, color=GREEN, buff=0.2)
        self.play(Create(box))
        self.wait(2)


class BinomialExponentPattern(Scene):
    """Shows the exponent pattern: always sum to n"""
    def construct(self):
        title = Text("Exponent Pattern in Binomial Expansion", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        key_rule = MathTex(
            "\\text{Key Rule: Powers always add to } n",
            font_size=32,
            color=YELLOW
        )
        key_rule.next_to(title, DOWN)
        self.play(Write(key_rule))
        self.wait(1)

        # Show (x + y)^4 expansion with exponents highlighted
        expansion = VGroup(
            MathTex("(x+y)^4 =", font_size=30),
            MathTex("x^4y^0", font_size=30),  # 4+0=4
            MathTex("+ x^3y^1", font_size=30),  # 3+1=4
            MathTex("+ x^2y^2", font_size=30),  # 2+2=4
            MathTex("+ x^1y^3", font_size=30),  # 1+3=4
            MathTex("+ x^0y^4", font_size=30),  # 0+4=4
        ).arrange(RIGHT, buff=0.15)
        expansion.shift(UP * 0.3)

        self.play(Write(expansion))
        self.wait(1)

        # Show exponent sums below each term
        sums = VGroup(
            MathTex("", font_size=24),  # placeholder for =
            MathTex("4+0=4", font_size=24, color=GREEN),
            MathTex("3+1=4", font_size=24, color=GREEN),
            MathTex("2+2=4", font_size=24, color=GREEN),
            MathTex("1+3=4", font_size=24, color=GREEN),
            MathTex("0+4=4", font_size=24, color=GREEN),
        )

        for i, s in enumerate(sums):
            s.next_to(expansion[i], DOWN, buff=0.3)

        self.play(*[Write(s) for s in sums[1:]], run_time=1.5)
        self.wait(1)

        # Show pattern arrow
        pattern = VGroup(
            MathTex("x:\\quad 4 \\to 3 \\to 2 \\to 1 \\to 0", font_size=28, color=BLUE),
            MathTex("\\text{decreasing}", font_size=24, color=BLUE)
        ).arrange(RIGHT, buff=0.5)
        pattern.next_to(expansion, DOWN, buff=1.2)

        pattern2 = VGroup(
            MathTex("y:\\quad 0 \\to 1 \\to 2 \\to 3 \\to 4", font_size=28, color=RED),
            MathTex("\\text{increasing}", font_size=24, color=RED)
        ).arrange(RIGHT, buff=0.5)
        pattern2.next_to(pattern, DOWN, buff=0.3)

        self.play(Write(pattern))
        self.play(Write(pattern2))
        self.wait(2)


class BinomialTermFinder(Scene):
    """Shows how to find a specific term in binomial expansion"""
    def construct(self):
        title = Text("Finding a Specific Term", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Problem
        problem = MathTex(
            "\\text{Find the } x^2y^3 \\text{ term in } (x+y)^5",
            font_size=32
        )
        problem.next_to(title, DOWN, buff=0.5)
        self.play(Write(problem))
        self.wait(1)

        # Step 1: Identify k
        step1 = VGroup(
            Text("Step 1: What is k?", font_size=28, color=YELLOW),
            MathTex("y^k = y^3 \\Rightarrow k = 3", font_size=28),
        ).arrange(DOWN, buff=0.2)
        step1.shift(UP * 0.3)
        self.play(Write(step1))
        self.wait(1)

        # Step 2: Find coefficient
        step2 = VGroup(
            Text("Step 2: Find the coefficient", font_size=28, color=YELLOW),
            MathTex("\\binom{5}{3} = \\frac{5!}{3! \\cdot 2!} = \\frac{5 \\cdot 4}{2 \\cdot 1} = 10", font_size=28),
        ).arrange(DOWN, buff=0.2)
        step2.next_to(step1, DOWN, buff=0.5)
        self.play(Write(step2))
        self.wait(1)

        # Step 3: Write the term
        step3 = VGroup(
            Text("Step 3: Write the complete term", font_size=28, color=YELLOW),
            MathTex("\\binom{5}{3} x^{5-3} y^3 = 10x^2y^3", font_size=32),
        ).arrange(DOWN, buff=0.2)
        step3.next_to(step2, DOWN, buff=0.5)
        self.play(Write(step3))
        self.wait(1)

        # Box the answer
        answer = step3[1]
        box = SurroundingRectangle(answer, color=GREEN, buff=0.2)
        self.play(Create(box))
        self.wait(2)


class CommonBinomialError(Scene):
    """Shows the common error of forgetting the binomial coefficient"""
    def construct(self):
        title = Text("Common Error: Forgetting the Coefficient!", font_size=36)
        title.to_edge(UP)
        title.set_color(RED)
        self.play(Write(title))

        # Problem setup
        problem = MathTex(
            "\\text{Find the 3rd term of } (2x + 3y)^4",
            font_size=32
        )
        problem.next_to(title, DOWN, buff=0.5)
        self.play(Write(problem))
        self.wait(1)

        # Wrong approach
        wrong_title = Text("WRONG approach:", font_size=28, color=RED)
        wrong_title.shift(UP * 0.5 + LEFT * 3)
        self.play(Write(wrong_title))

        wrong = VGroup(
            MathTex("\\text{3rd term means } k=2", font_size=24),
            MathTex("= (2x)^2 (3y)^2", font_size=24),
            MathTex("= 4x^2 \\cdot 9y^2", font_size=24),
            MathTex("= 36x^2y^2", font_size=24, color=RED),
            Text("Missing the binomial coefficient!", font_size=20, color=RED)
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        wrong.next_to(wrong_title, DOWN, buff=0.3)

        self.play(Write(wrong), run_time=2)
        cross = Cross(wrong[3], color=RED)
        self.play(Create(cross))
        self.wait(1)

        # Correct approach
        correct_title = Text("CORRECT approach:", font_size=28, color=GREEN)
        correct_title.shift(UP * 0.5 + RIGHT * 3)
        self.play(Write(correct_title))

        correct = VGroup(
            MathTex("\\text{3rd term means } k=2", font_size=24),
            MathTex("= \\binom{4}{2} (2x)^{4-2} (3y)^2", font_size=24),
            MathTex("= 6 \\cdot (2x)^2 \\cdot (3y)^2", font_size=24),
            MathTex("= 6 \\cdot 4x^2 \\cdot 9y^2", font_size=24),
            MathTex("= 216x^2y^2", font_size=24, color=GREEN),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        correct.next_to(correct_title, DOWN, buff=0.3)

        self.play(Write(correct), run_time=2.5)

        box = SurroundingRectangle(correct[4], color=GREEN, buff=0.1)
        self.play(Create(box))
        self.wait(1)

        # Show the coefficient from Pascal's
        pascal_note = MathTex(
            "\\binom{4}{2} = 6 \\text{ (from Row 4 of Pascal's: 1, 4, 6, 4, 1)}",
            font_size=24,
            color=YELLOW
        )
        pascal_note.to_edge(DOWN, buff=0.5)
        self.play(Write(pascal_note))
        self.wait(2)

        # Key takeaway
        takeaway = Text(
            "Always multiply by the binomial coefficient!",
            font_size=28,
            color=YELLOW
        )
        takeaway.next_to(pascal_note, UP, buff=0.3)
        self.play(Write(takeaway))
        self.wait(2)
