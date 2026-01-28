"""
Conditional Probability Definition Animation

Demonstrates P(B|A) = P(A ∩ B) / P(A) by showing how "given A" restricts the sample space.

Run with:
manim -qm --format=mp4 l20_conditional_def.py ConditionalProbabilityDef
"""

from manim import *

class ConditionalProbabilityDef(Scene):
    def construct(self):
        # Title
        title = Text("Conditional Probability P(B|A)", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Sample space (rectangle)
        sample_space = Rectangle(width=6, height=4, color=WHITE, fill_opacity=0.1)
        sample_space_label = MathTex(r"S", font_size=36).next_to(sample_space, UP + LEFT, buff=0.1)

        self.play(Create(sample_space), Write(sample_space_label))
        self.wait(0.5)

        # Event A (circle on the left)
        circle_a = Circle(radius=1.2, color=BLUE, fill_opacity=0.3)
        circle_a.shift(LEFT * 0.8)
        label_a = MathTex(r"A", font_size=36, color=BLUE).move_to(circle_a.get_center() + LEFT * 0.6)

        # Event B (circle on the right, overlapping)
        circle_b = Circle(radius=1.2, color=YELLOW, fill_opacity=0.3)
        circle_b.shift(RIGHT * 0.8)
        label_b = MathTex(r"B", font_size=36, color=YELLOW).move_to(circle_b.get_center() + RIGHT * 0.6)

        self.play(
            Create(circle_a), Write(label_a),
            Create(circle_b), Write(label_b)
        )
        self.wait(0.5)

        # Highlight intersection
        intersection = Intersection(circle_a, circle_b, color=GREEN, fill_opacity=0.5)
        intersection_label = MathTex(r"A \cap B", font_size=28, color=GREEN)
        intersection_label.move_to(intersection.get_center() + UP * 0.3)

        self.play(FadeIn(intersection), Write(intersection_label))
        self.wait(0.8)

        # Key insight: "Given A restricts the sample space"
        given_text = Text('"Given A occurred" means...', font_size=30, color=BLUE)
        given_text.to_edge(DOWN)
        self.play(Write(given_text))
        self.wait(0.5)

        # Fade out everything outside A
        outside_a = Difference(sample_space, circle_a, color=GRAY, fill_opacity=0.7)

        self.play(
            FadeIn(outside_a),
            circle_b.animate.set_fill_opacity(0.1),
            label_b.animate.set_opacity(0.3),
            sample_space_label.animate.set_opacity(0.3),
            FadeOut(given_text)
        )
        self.wait(0.5)

        # New text: restrict sample space
        restrict_text = Text("...restrict sample space to A only!", font_size=30, color=BLUE)
        restrict_text.to_edge(DOWN)
        self.play(Write(restrict_text))
        self.wait(0.8)

        # Remove the faded regions, keep only A
        self.play(
            FadeOut(outside_a),
            FadeOut(restrict_text),
            circle_a.animate.set_fill_opacity(0.4)
        )
        self.wait(0.5)

        # Show formula derivation
        formula_text = Text("P(B|A) = ?", font_size=32)
        formula_text.to_edge(DOWN).shift(UP * 0.5)
        self.play(Write(formula_text))
        self.wait(0.5)

        # Formula: P(B|A) = P(A ∩ B) / P(A)
        formula = MathTex(
            r"P(B|A) = \frac{P(A \cap B)}{P(A)}",
            font_size=40
        )
        formula.to_edge(DOWN)

        self.play(Transform(formula_text, formula))
        self.wait(0.8)

        # Annotate the formula parts
        numerator_arrow = Arrow(
            start=formula.get_top() + LEFT * 0.8,
            end=intersection.get_bottom(),
            color=GREEN,
            buff=0.1,
            stroke_width=3
        )
        numerator_text = Text("overlap", font_size=24, color=GREEN)
        numerator_text.next_to(numerator_arrow.get_start(), UP, buff=0.1)

        denominator_arrow = Arrow(
            start=formula.get_top() + RIGHT * 0.8,
            end=circle_a.get_bottom() + DOWN * 0.3,
            color=BLUE,
            buff=0.1,
            stroke_width=3
        )
        denominator_text = Text("A total", font_size=24, color=BLUE)
        denominator_text.next_to(denominator_arrow.get_start(), UP, buff=0.1)

        self.play(
            GrowArrow(numerator_arrow), Write(numerator_text),
            GrowArrow(denominator_arrow), Write(denominator_text)
        )
        self.wait(1)

        # Final insight
        self.play(
            FadeOut(numerator_arrow), FadeOut(numerator_text),
            FadeOut(denominator_arrow), FadeOut(denominator_text)
        )

        insight = Text(
            '"Given" restricts the sample space!',
            font_size=34,
            color=YELLOW,
            weight=BOLD
        )
        insight.move_to(sample_space.get_center())

        self.play(
            FadeOut(circle_a), FadeOut(circle_b),
            FadeOut(label_a), FadeOut(label_b),
            FadeOut(intersection), FadeOut(intersection_label),
            FadeOut(sample_space), FadeOut(sample_space_label),
            Write(insight)
        )
        self.wait(1.5)

        # Fade out
        self.play(
            FadeOut(insight),
            FadeOut(formula_text),
            FadeOut(title)
        )
        self.wait(0.5)
