"""
Difference of Squares: a² - b² = (a + b)(a - b)
Geometric proof animation for Algebra 2 students

Run with: manim -pql difference_of_squares.py DifferenceOfSquares
"""
from manim import *

class DifferenceOfSquares(Scene):
    def construct(self):
        # Title
        title = Text("Difference of Squares", font_size=48)
        formula = MathTex("a^2 - b^2 = (a+b)(a-b)", font_size=36)
        title.to_edge(UP)
        formula.next_to(title, DOWN)

        self.play(Write(title))
        self.play(Write(formula))
        self.wait(1)

        # Parameters
        a = 3  # side length of large square
        b = 1  # side length of small square
        scale = 0.8

        # Create the large square (a²)
        large_square = Square(side_length=a*scale, color=BLUE, fill_opacity=0.5)
        large_square.shift(LEFT * 2.5 + DOWN * 0.5)

        a_label = MathTex("a", font_size=28)
        a_label.next_to(large_square, DOWN)
        a_label2 = MathTex("a", font_size=28)
        a_label2.next_to(large_square, LEFT)

        large_label = MathTex("a^2", font_size=32, color=BLUE)
        large_label.move_to(large_square.get_center())

        self.play(
            Create(large_square),
            Write(a_label), Write(a_label2),
            Write(large_label)
        )
        self.wait(0.5)

        # Create the small square (b²) to subtract - positioned at top-right corner
        small_square = Square(side_length=b*scale, color=RED, fill_opacity=0.7)
        small_square.move_to(
            large_square.get_corner(UR) +
            np.array([-b*scale/2, -b*scale/2, 0])
        )

        b_label = MathTex("b", font_size=24)
        b_label.next_to(small_square, RIGHT, buff=0.1)

        small_label = MathTex("b^2", font_size=24, color=RED)
        small_label.move_to(small_square.get_center())

        minus_text = MathTex("-", font_size=36)
        minus_text.next_to(large_square, RIGHT, buff=0.3)

        self.play(
            Write(minus_text),
            Create(small_square),
            Write(b_label),
            Write(small_label)
        )
        self.wait(1)

        # Show what we're computing
        expression = MathTex("a^2 - b^2 = ?", font_size=32)
        expression.to_edge(DOWN, buff=1)
        self.play(Write(expression))
        self.wait(1)

        # Fade out labels for transformation
        self.play(
            FadeOut(large_label),
            FadeOut(small_label),
            FadeOut(minus_text),
            FadeOut(expression)
        )

        # Now show the L-shaped region (a² - b²)
        # The remaining area after cutting b² from corner

        explanation = Text("The remaining L-shape is a² - b²", font_size=24)
        explanation.to_edge(DOWN, buff=1.5)
        self.play(Write(explanation))
        self.wait(1)

        # Show cutting into two rectangles
        cut_text = Text("Cut it into two rectangles...", font_size=24)
        cut_text.next_to(explanation, DOWN)
        self.play(Write(cut_text))

        # Create two rectangles that make up the L-shape
        # Rectangle 1: a × (a-b) - bottom portion
        rect1 = Rectangle(
            width=a*scale,
            height=(a-b)*scale,
            color=GREEN,
            fill_opacity=0.5
        )
        rect1.move_to(large_square.get_bottom() + UP * (a-b)*scale/2)

        # Rectangle 2: b × (a-b) - right side portion (rotated view of the piece)
        rect2 = Rectangle(
            width=b*scale,
            height=(a-b)*scale,
            color=YELLOW,
            fill_opacity=0.5
        )
        rect2.move_to(
            large_square.get_corner(UR) +
            LEFT * b*scale/2 +
            DOWN * (b*scale + (a-b)*scale/2)
        )

        self.wait(1)

        # Show the cutting line
        cut_line = DashedLine(
            start=large_square.get_corner(UL) + DOWN * b*scale,
            end=small_square.get_corner(DL),
            color=WHITE
        )
        self.play(Create(cut_line))
        self.wait(0.5)

        # Highlight the two pieces
        self.play(
            FadeIn(rect1),
            FadeIn(rect2)
        )
        self.wait(1)

        # Label dimensions
        dim1_h = MathTex("a", font_size=24)
        dim1_h.next_to(rect1, DOWN)
        dim1_v = MathTex("a-b", font_size=24)
        dim1_v.next_to(rect1, LEFT)

        dim2_h = MathTex("b", font_size=24)
        dim2_h.next_to(rect2, DOWN)

        self.play(
            Write(dim1_h), Write(dim1_v), Write(dim2_h)
        )
        self.wait(1)

        # Clear and show rearrangement
        self.play(
            FadeOut(large_square),
            FadeOut(small_square),
            FadeOut(cut_line),
            FadeOut(a_label), FadeOut(a_label2), FadeOut(b_label),
            FadeOut(explanation), FadeOut(cut_text),
            FadeOut(dim1_h), FadeOut(dim1_v), FadeOut(dim2_h)
        )

        # Move rectangles to show they form (a+b) × (a-b)
        rearrange_text = Text("Rearrange into one rectangle!", font_size=28)
        rearrange_text.to_edge(DOWN, buff=1)
        self.play(Write(rearrange_text))

        # Position rect1 and rotate/move rect2 to form combined rectangle
        combined_center = RIGHT * 0 + DOWN * 0.5

        new_rect1 = Rectangle(
            width=a*scale,
            height=(a-b)*scale,
            color=GREEN,
            fill_opacity=0.5
        )
        new_rect1.move_to(combined_center + LEFT * b*scale/2)

        new_rect2 = Rectangle(
            width=b*scale,
            height=(a-b)*scale,
            color=YELLOW,
            fill_opacity=0.5
        )
        new_rect2.move_to(combined_center + RIGHT * a*scale/2)

        self.play(
            Transform(rect1, new_rect1),
            Transform(rect2, new_rect2),
            run_time=2
        )
        self.wait(1)

        # Label the combined rectangle
        combined_width = MathTex("a + b", font_size=28)
        combined_width.next_to(VGroup(rect1, rect2), DOWN)

        combined_height = MathTex("a - b", font_size=28)
        combined_height.next_to(VGroup(rect1, rect2), LEFT)

        self.play(Write(combined_width), Write(combined_height))
        self.wait(1)

        # Show final formula
        final = MathTex(
            "\\text{Area} = (a+b)(a-b) = a^2 - b^2",
            font_size=36,
            color=YELLOW
        )
        final.to_edge(DOWN, buff=0.5)

        self.play(
            FadeOut(rearrange_text),
            Write(final)
        )
        self.wait(2)

        # Final emphasis
        box = SurroundingRectangle(formula, color=YELLOW, buff=0.2)
        self.play(Create(box))
        self.wait(2)


class DifferenceOfSquaresNumeric(Scene):
    """Shows how to use a² - b² for mental math like 49 × 51"""
    def construct(self):
        title = Text("Mental Math with Difference of Squares", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Problem
        problem = MathTex("49 \\times 51 = ?", font_size=48)
        self.play(Write(problem))
        self.wait(1)

        # Rewrite
        step1 = MathTex("= (50 - 1)(50 + 1)", font_size=42)
        step1.next_to(problem, DOWN, buff=0.5)

        self.play(Write(step1))
        self.wait(1)

        # Apply identity
        step2 = MathTex("= 50^2 - 1^2", font_size=42)
        step2.next_to(step1, DOWN, buff=0.3)

        identity_note = MathTex(
            "\\text{Using } (a-b)(a+b) = a^2 - b^2",
            font_size=28,
            color=YELLOW
        )
        identity_note.next_to(step2, RIGHT, buff=0.5)

        self.play(Write(step2), Write(identity_note))
        self.wait(1)

        # Calculate
        step3 = MathTex("= 2500 - 1", font_size=42)
        step3.next_to(step2, DOWN, buff=0.3)
        self.play(Write(step3))
        self.wait(0.5)

        step4 = MathTex("= 2499", font_size=48, color=GREEN)
        step4.next_to(step3, DOWN, buff=0.3)
        self.play(Write(step4))
        self.wait(1)

        # Box the answer
        box = SurroundingRectangle(step4, color=GREEN, buff=0.2)
        self.play(Create(box))
        self.wait(2)
