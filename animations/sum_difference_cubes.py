"""
Sum and Difference of Cubes:
a³ + b³ = (a + b)(a² - ab + b²)
a³ - b³ = (a - b)(a² + ab + b²)

The tricky part: the sign in the trinomial is OPPOSITE!

Run with: manim -pql sum_difference_cubes.py SumDifferenceCubes
"""
from manim import *

class SumDifferenceCubes(Scene):
    def construct(self):
        title = Text("Sum and Difference of Cubes", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Show both formulas
        sum_formula = MathTex(
            "a^3 + b^3 = (a + b)(a^2 - ab + b^2)",
            font_size=36
        )
        diff_formula = MathTex(
            "a^3 - b^3 = (a - b)(a^2 + ab + b^2)",
            font_size=36
        )

        formulas = VGroup(sum_formula, diff_formula).arrange(DOWN, buff=0.5)
        formulas.next_to(title, DOWN, buff=0.8)

        self.play(Write(sum_formula))
        self.wait(0.5)
        self.play(Write(diff_formula))
        self.wait(1)

        # Highlight the key pattern
        key = Text(
            "KEY: The middle sign in the trinomial is OPPOSITE!",
            font_size=28,
            color=YELLOW
        )
        key.next_to(formulas, DOWN, buff=0.8)
        self.play(Write(key))
        self.wait(1)

        # Color code the signs
        # Sum of cubes: + outside means - inside
        sum_plus = sum_formula[0][3]  # The + in a³+b³
        sum_minus = sum_formula[0][14]  # The - in a²-ab

        # Difference of cubes: - outside means + inside
        diff_minus = diff_formula[0][3]  # The - in a³-b³
        diff_plus = diff_formula[0][14]  # The + in a²+ab

        # Create colored boxes
        box1 = SurroundingRectangle(sum_plus, color=GREEN, buff=0.05)
        box2 = SurroundingRectangle(sum_minus, color=RED, buff=0.05)
        box3 = SurroundingRectangle(diff_minus, color=RED, buff=0.05)
        box4 = SurroundingRectangle(diff_plus, color=GREEN, buff=0.05)

        self.play(Create(box1), Create(box2))
        self.wait(0.5)
        self.play(Create(box3), Create(box4))
        self.wait(1)

        # Show mnemonic
        self.play(FadeOut(box1), FadeOut(box2), FadeOut(box3), FadeOut(box4))

        mnemonic = VGroup(
            Text("Memory Trick: SOAP", font_size=32, color=YELLOW),
            MathTex("\\textbf{S}\\text{ame sign} \\quad \\textbf{O}\\text{pposite sign} \\quad \\textbf{A}\\text{lways} \\quad \\textbf{P}\\text{ositive}", font_size=24),
            MathTex("(a \\pm b)(a^2 \\mp ab + b^2)", font_size=28),
        ).arrange(DOWN, buff=0.3)
        mnemonic.next_to(key, DOWN, buff=0.5)

        self.play(Write(mnemonic))
        self.wait(2)

        # Clear for example
        self.play(
            FadeOut(formulas),
            FadeOut(key),
            FadeOut(mnemonic)
        )

        # Concrete example
        example_title = Text("Example: Factor 8x³ - 27", font_size=32, color=GREEN)
        example_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(example_title))

        # Step 1: Identify cubes
        step1 = VGroup(
            Text("Step 1: Identify a³ and b³", font_size=28, color=YELLOW),
            MathTex("8x^3 = (2x)^3 \\quad \\text{so } a = 2x", font_size=28),
            MathTex("27 = 3^3 \\quad \\text{so } b = 3", font_size=28),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        step1.next_to(example_title, DOWN, buff=0.5)
        step1.to_edge(LEFT, buff=0.5)

        self.play(Write(step1))
        self.wait(1)

        # Step 2: Apply formula
        step2 = VGroup(
            Text("Step 2: Apply difference of cubes", font_size=28, color=YELLOW),
            MathTex("a^3 - b^3 = (a-b)(a^2 + ab + b^2)", font_size=24, color=BLUE),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        step2.next_to(step1, DOWN, buff=0.5)

        self.play(Write(step2))
        self.wait(0.5)

        # Step 3: Substitute
        step3 = VGroup(
            Text("Step 3: Substitute a=2x, b=3", font_size=28, color=YELLOW),
            MathTex("= (2x - 3)((2x)^2 + (2x)(3) + 3^2)", font_size=26),
            MathTex("= (2x - 3)(4x^2 + 6x + 9)", font_size=28, color=GREEN),
        ).arrange(DOWN, buff=0.2, aligned_edge=LEFT)
        step3.next_to(step2, DOWN, buff=0.5)

        self.play(Write(step3))
        self.wait(1)

        # Box final answer
        box = SurroundingRectangle(step3[2], color=GREEN, buff=0.1)
        self.play(Create(box))
        self.wait(1)

        # Emphasize the + in the trinomial
        emphasis = Text(
            "Notice: MINUS outside → PLUS inside (+6x)",
            font_size=24,
            color=YELLOW
        )
        emphasis.to_edge(DOWN, buff=0.5)
        self.play(Write(emphasis))
        self.wait(2)


class CubesSignComparison(Scene):
    """Side-by-side comparison showing the sign pattern"""
    def construct(self):
        title = Text("Sign Pattern Comparison", font_size=44)
        title.to_edge(UP)
        self.play(Write(title))

        # Sum of cubes column
        sum_title = Text("SUM of Cubes", font_size=32, color=BLUE)
        sum_title.shift(LEFT * 3.5 + UP * 1.5)

        sum_example = VGroup(
            MathTex("x^3 + 8", font_size=30),
            MathTex("= x^3 + 2^3", font_size=28),
            MathTex("= (x + 2)(x^2 - 2x + 4)", font_size=28),
        ).arrange(DOWN, buff=0.2)
        sum_example.next_to(sum_title, DOWN, buff=0.3)

        # Difference of cubes column
        diff_title = Text("DIFFERENCE of Cubes", font_size=32, color=RED)
        diff_title.shift(RIGHT * 3.5 + UP * 1.5)

        diff_example = VGroup(
            MathTex("x^3 - 8", font_size=30),
            MathTex("= x^3 - 2^3", font_size=28),
            MathTex("= (x - 2)(x^2 + 2x + 4)", font_size=28),
        ).arrange(DOWN, buff=0.2)
        diff_example.next_to(diff_title, DOWN, buff=0.3)

        # Show sum side
        self.play(Write(sum_title))
        self.play(Write(sum_example))
        self.wait(0.5)

        # Show difference side
        self.play(Write(diff_title))
        self.play(Write(diff_example))
        self.wait(1)

        # Highlight opposite signs
        # In sum: (x + 2)(x² - 2x + 4)
        sum_plus_box = SurroundingRectangle(
            sum_example[2][0][1:4],  # +2 in first factor
            color=GREEN, buff=0.05
        )
        sum_minus_box = SurroundingRectangle(
            sum_example[2][0][7:10],  # -2x in second factor
            color=RED, buff=0.05
        )

        # In diff: (x - 2)(x² + 2x + 4)
        diff_minus_box = SurroundingRectangle(
            diff_example[2][0][1:4],  # -2 in first factor
            color=RED, buff=0.05
        )
        diff_plus_box = SurroundingRectangle(
            diff_example[2][0][7:10],  # +2x in second factor
            color=GREEN, buff=0.05
        )

        arrow_text = Text("Signs are OPPOSITE!", font_size=28, color=YELLOW)
        arrow_text.shift(DOWN * 1.5)

        self.play(
            Create(sum_plus_box),
            Create(sum_minus_box),
            Create(diff_minus_box),
            Create(diff_plus_box),
            Write(arrow_text)
        )
        self.wait(2)

        # Show the pattern summary
        self.play(
            FadeOut(sum_plus_box),
            FadeOut(sum_minus_box),
            FadeOut(diff_minus_box),
            FadeOut(diff_plus_box),
        )

        pattern = VGroup(
            MathTex("a^3 + b^3 = (a+b)(a^2 \\textcolor{red}{-} ab + b^2)", font_size=32),
            MathTex("a^3 - b^3 = (a-b)(a^2 \\textcolor{green}{+} ab + b^2)", font_size=32),
        ).arrange(DOWN, buff=0.3)
        pattern.shift(DOWN * 2.5)

        self.play(Write(pattern))
        self.wait(2)


class CubesCommonMistakes(Scene):
    """Shows common mistakes students make with cubes"""
    def construct(self):
        title = Text("Common Mistakes with Cubes", font_size=40)
        title.to_edge(UP)
        title.set_color(RED)
        self.play(Write(title))

        # Mistake 1: Wrong sign in middle
        mistake1_title = Text("Mistake 1: Wrong middle sign", font_size=28, color=RED)
        mistake1_title.shift(UP * 1.5 + LEFT * 3)

        mistake1 = VGroup(
            MathTex("x^3 + 27", font_size=26),
            MathTex("\\neq (x+3)(x^2 + 3x + 9)", font_size=26, color=RED),
            Text("Should be MINUS 3x!", font_size=20, color=RED),
        ).arrange(DOWN, buff=0.15)
        mistake1.next_to(mistake1_title, DOWN, buff=0.2)

        correct1 = VGroup(
            MathTex("= (x+3)(x^2 - 3x + 9)", font_size=26, color=GREEN),
        )
        correct1.next_to(mistake1, DOWN, buff=0.2)

        self.play(Write(mistake1_title))
        self.play(Write(mistake1))
        self.play(Write(correct1))
        self.wait(1)

        # Mistake 2: Confusing with difference of squares
        mistake2_title = Text("Mistake 2: Using wrong identity", font_size=28, color=RED)
        mistake2_title.shift(UP * 1.5 + RIGHT * 3)

        mistake2 = VGroup(
            MathTex("8 - x^3", font_size=26),
            MathTex("\\neq (\\sqrt[3]{8})^2 - (x)^2", font_size=26, color=RED),
            Text("This is CUBES, not squares!", font_size=20, color=RED),
        ).arrange(DOWN, buff=0.15)
        mistake2.next_to(mistake2_title, DOWN, buff=0.2)

        correct2 = VGroup(
            MathTex("= (2-x)(4 + 2x + x^2)", font_size=26, color=GREEN),
        )
        correct2.next_to(mistake2, DOWN, buff=0.2)

        self.play(Write(mistake2_title))
        self.play(Write(mistake2))
        self.play(Write(correct2))
        self.wait(1)

        # Quick check method
        check = VGroup(
            Text("Quick Check: Multiply it back!", font_size=28, color=YELLOW),
            MathTex("(x+3)(x^2 - 3x + 9)", font_size=26),
            MathTex("= x^3 - 3x^2 + 9x + 3x^2 - 9x + 27", font_size=24),
            MathTex("= x^3 + 27 \\checkmark", font_size=26, color=GREEN),
        ).arrange(DOWN, buff=0.2)
        check.to_edge(DOWN, buff=0.3)

        self.play(Write(check), run_time=2)
        self.wait(2)
