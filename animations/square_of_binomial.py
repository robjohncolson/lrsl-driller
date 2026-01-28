"""
Square of a Binomial: (a + b)² = a² + 2ab + b²
Area model animation showing WHY the middle term appears

Run with: manim -pql square_of_binomial.py SquareOfBinomial
"""
from manim import *

class SquareOfBinomial(Scene):
    def construct(self):
        # Title
        title = Text("Square of a Binomial", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        # Common mistake
        mistake = MathTex(
            "(a + b)^2 \\neq a^2 + b^2",
            font_size=36,
            color=RED
        )
        mistake.next_to(title, DOWN)
        self.play(Write(mistake))
        self.wait(1)

        # Correct formula
        correct = MathTex(
            "(a + b)^2 = a^2 + 2ab + b^2",
            font_size=36,
            color=GREEN
        )
        correct.next_to(mistake, DOWN)
        self.play(Write(correct))
        self.wait(1)

        why_text = Text("But WHY? Let's see with an area model!", font_size=28)
        why_text.next_to(correct, DOWN, buff=0.5)
        self.play(Write(why_text))
        self.wait(1)

        self.play(FadeOut(mistake), FadeOut(why_text))

        # Create the square with side (a + b)
        a = 2.0
        b = 1.0
        total = a + b

        # Main square outline
        main_square = Square(side_length=total, color=WHITE)
        main_square.shift(DOWN * 0.5)

        # Labels for the full side
        side_label_bottom = MathTex("a + b", font_size=28)
        side_label_bottom.next_to(main_square, DOWN)
        side_label_left = MathTex("a + b", font_size=28)
        side_label_left.next_to(main_square, LEFT)

        self.play(
            Create(main_square),
            Write(side_label_bottom),
            Write(side_label_left)
        )
        self.wait(1)

        # Show area = (a+b)²
        area_label = MathTex("\\text{Area} = (a+b)^2", font_size=32)
        area_label.next_to(main_square, RIGHT, buff=0.8)
        self.play(Write(area_label))
        self.wait(1)

        # Now divide into 4 regions
        divide_text = Text("Divide into 4 parts...", font_size=24)
        divide_text.to_edge(DOWN)
        self.play(Write(divide_text))

        # Create the 4 rectangles
        # a² square (bottom-left)
        a_square = Square(side_length=a, color=BLUE, fill_opacity=0.5)
        a_square.move_to(
            main_square.get_corner(DL) + np.array([a/2, a/2, 0])
        )

        # b² square (top-right)
        b_square = Square(side_length=b, color=RED, fill_opacity=0.5)
        b_square.move_to(
            main_square.get_corner(UR) + np.array([-b/2, -b/2, 0])
        )

        # ab rectangle 1 (top-left)
        ab_rect1 = Rectangle(width=a, height=b, color=GREEN, fill_opacity=0.5)
        ab_rect1.move_to(
            main_square.get_corner(UL) + np.array([a/2, -b/2, 0])
        )

        # ab rectangle 2 (bottom-right)
        ab_rect2 = Rectangle(width=b, height=a, color=YELLOW, fill_opacity=0.5)
        ab_rect2.move_to(
            main_square.get_corner(DR) + np.array([-b/2, a/2, 0])
        )

        # Draw dividing lines
        h_line = Line(
            start=main_square.get_corner(DL) + UP * a,
            end=main_square.get_corner(DR) + UP * a,
            color=WHITE
        )
        v_line = Line(
            start=main_square.get_corner(DL) + RIGHT * a,
            end=main_square.get_corner(UL) + RIGHT * a,
            color=WHITE
        )

        self.play(
            Create(h_line),
            Create(v_line)
        )
        self.wait(0.5)

        # Show each piece one by one
        # a² piece
        self.play(FadeIn(a_square))
        a_sq_label = MathTex("a^2", font_size=28, color=BLUE)
        a_sq_label.move_to(a_square.get_center())
        self.play(Write(a_sq_label))

        # Dimension labels for a
        a_dim_h = MathTex("a", font_size=24)
        a_dim_h.next_to(a_square, DOWN, buff=0.1)
        a_dim_v = MathTex("a", font_size=24)
        a_dim_v.next_to(a_square, LEFT, buff=0.1)
        self.play(Write(a_dim_h), Write(a_dim_v))
        self.wait(0.5)

        # b² piece
        self.play(FadeIn(b_square))
        b_sq_label = MathTex("b^2", font_size=24, color=RED)
        b_sq_label.move_to(b_square.get_center())
        self.play(Write(b_sq_label))

        # Dimension labels for b
        b_dim_h = MathTex("b", font_size=24)
        b_dim_h.next_to(b_square, UP, buff=0.1)
        b_dim_v = MathTex("b", font_size=24)
        b_dim_v.next_to(b_square, RIGHT, buff=0.1)
        self.play(Write(b_dim_h), Write(b_dim_v))
        self.wait(0.5)

        # First ab rectangle
        self.play(FadeIn(ab_rect1))
        ab1_label = MathTex("ab", font_size=24, color=GREEN)
        ab1_label.move_to(ab_rect1.get_center())
        self.play(Write(ab1_label))
        self.wait(0.3)

        # Second ab rectangle
        self.play(FadeIn(ab_rect2))
        ab2_label = MathTex("ab", font_size=24, color=YELLOW)
        ab2_label.move_to(ab_rect2.get_center())
        self.play(Write(ab2_label))
        self.wait(1)

        # Emphasize TWO ab rectangles
        self.play(FadeOut(divide_text))

        two_ab_text = Text("TWO rectangles of area ab!", font_size=28, color=YELLOW)
        two_ab_text.to_edge(DOWN)
        self.play(Write(two_ab_text))

        # Flash both ab rectangles
        self.play(
            Indicate(ab_rect1, color=WHITE, scale_factor=1.1),
            Indicate(ab_rect2, color=WHITE, scale_factor=1.1),
            run_time=1.5
        )
        self.wait(1)

        # Show the sum
        self.play(FadeOut(two_ab_text), FadeOut(area_label))

        sum_text = MathTex(
            "\\text{Total Area} = a^2 + ab + ab + b^2",
            font_size=32
        )
        sum_text.to_edge(DOWN, buff=1.5)
        self.play(Write(sum_text))
        self.wait(1)

        final_text = MathTex(
            "= a^2 + 2ab + b^2",
            font_size=36,
            color=GREEN
        )
        final_text.next_to(sum_text, DOWN)
        self.play(Write(final_text))
        self.wait(1)

        # Highlight the formula at top
        box = SurroundingRectangle(correct, color=GREEN, buff=0.2)
        self.play(Create(box))
        self.wait(2)


class SquareOfDifference(Scene):
    """Shows (a - b)² = a² - 2ab + b²"""
    def construct(self):
        title = Text("Square of a Difference", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))

        formula = MathTex(
            "(a - b)^2 = a^2 - 2ab + b^2",
            font_size=40
        )
        formula.next_to(title, DOWN)
        self.play(Write(formula))
        self.wait(1)

        # Explain the sign
        explain = VGroup(
            Text("Notice: the middle term is NEGATIVE", font_size=28),
            MathTex("-2ab", font_size=36, color=RED),
            Text("because we're subtracting b", font_size=24)
        ).arrange(DOWN, buff=0.3)
        explain.shift(DOWN * 0.5)

        self.play(Write(explain))
        self.wait(2)

        # Show expansion
        expansion = MathTex(
            "(a-b)^2 &= (a-b)(a-b)\\\\",
            "&= a \\cdot a - a \\cdot b - b \\cdot a + b \\cdot b\\\\",
            "&= a^2 - ab - ab + b^2\\\\",
            "&= a^2 - 2ab + b^2",
            font_size=32
        )
        expansion.shift(DOWN * 0.5)

        self.play(FadeOut(explain))
        self.play(Write(expansion), run_time=4)
        self.wait(2)

        # Comparison
        self.play(FadeOut(expansion))

        compare = VGroup(
            MathTex("(a+b)^2 = a^2 + 2ab + b^2", font_size=32, color=GREEN),
            MathTex("(a-b)^2 = a^2 - 2ab + b^2", font_size=32, color=BLUE)
        ).arrange(DOWN, buff=0.5)
        compare.shift(DOWN * 0.5)

        tip = Text(
            "Tip: The sign of the middle term matches the sign inside!",
            font_size=24,
            color=YELLOW
        )
        tip.next_to(compare, DOWN, buff=0.5)

        self.play(Write(compare))
        self.play(Write(tip))
        self.wait(3)
