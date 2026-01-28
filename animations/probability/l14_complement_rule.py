"""
Manim animation for the Complement Rule in probability.

Run with:
    manim -qm --format=mp4 l14_complement_rule.py ComplementRule

This animation demonstrates:
- The concept of complement (not A)
- Visual representation using Venn diagrams
- The formula P(A') = 1 - P(A)
- A practical example with rain probability
"""

from manim import *

class ComplementRule(Scene):
    def construct(self):
        # Title
        title = Text("The Complement Rule", font_size=48, weight=BOLD)
        self.play(Write(title))
        self.wait(1)
        self.play(title.animate.to_edge(UP))
        self.wait(0.5)

        # Universal set (rectangle)
        universe = Rectangle(width=6, height=4, color=WHITE, stroke_width=3)
        universe_label = Text("S (Sample Space)", font_size=24).next_to(universe, UP, buff=0.2)

        self.play(Create(universe), Write(universe_label))
        self.wait(1)

        # Event A (circle)
        event_a = Circle(radius=1.2, color=BLUE, fill_opacity=0.5).shift(LEFT * 0.5)
        a_label = Text("A", font_size=36, color=BLUE).move_to(event_a.get_center())

        self.play(FadeIn(event_a), Write(a_label))
        self.wait(1)

        # Complement A' (everything outside A)
        # Create the complement by using a rectangle with a hole
        complement_text = Text("A' or Aᶜ", font_size=28, color=ORANGE).move_to(universe.get_right() + LEFT * 1.2 + UP * 1)
        complement_desc = Text("(not A)", font_size=20, color=ORANGE).next_to(complement_text, DOWN, buff=0.1)

        # Visual highlight of complement region
        complement_region = Rectangle(
            width=6, height=4,
            color=ORANGE,
            fill_opacity=0.3,
            stroke_width=0
        ).move_to(universe.get_center())

        # Layer order: complement behind, event A on top
        self.add(complement_region)
        self.bring_to_back(complement_region)
        self.add(event_a, a_label)

        self.play(
            FadeIn(complement_region),
            Write(complement_text),
            Write(complement_desc)
        )
        self.wait(1.5)

        # Show that A + A' = entire space = 1
        equation1 = MathTex("A", "+", "A'", "=", "S", font_size=40)
        equation1[0].set_color(BLUE)
        equation1[2].set_color(ORANGE)
        equation1.next_to(universe, DOWN, buff=0.6)

        self.play(Write(equation1))
        self.wait(1)

        # Show probability equation
        equation2 = MathTex("P(A)", "+", "P(A')", "=", "1", font_size=40)
        equation2[0].set_color(BLUE)
        equation2[2].set_color(ORANGE)
        equation2.next_to(equation1, DOWN, buff=0.3)

        self.play(Write(equation2))
        self.wait(1.5)

        # Clear for formula
        self.play(
            FadeOut(universe_label),
            FadeOut(universe),
            FadeOut(event_a),
            FadeOut(a_label),
            FadeOut(complement_region),
            FadeOut(complement_text),
            FadeOut(complement_desc),
            FadeOut(equation1)
        )
        self.wait(0.5)

        # Main formula
        self.play(equation2.animate.move_to(UP * 2))

        formula = MathTex("P(A')", "=", "1", "-", "P(A)", font_size=48)
        formula[0].set_color(ORANGE)
        formula[4].set_color(BLUE)
        formula.move_to(UP * 0.5)

        box = SurroundingRectangle(formula, color=YELLOW, buff=0.3, stroke_width=3)

        self.play(TransformFromCopy(equation2, formula))
        self.play(Create(box))
        self.wait(1.5)

        # Example
        example_title = Text("Example:", font_size=32, weight=BOLD).to_edge(LEFT).shift(DOWN * 1.2)
        example_text = Text("P(rain) = 0.3", font_size=28, color=BLUE).next_to(example_title, RIGHT, buff=0.3)

        self.play(Write(example_title), Write(example_text))
        self.wait(1)

        # Calculate complement
        calc1 = MathTex("P(\\text{no rain})", "=", "1", "-", "0.3", font_size=32)
        calc1[0].set_color(ORANGE)
        calc1.next_to(example_text, DOWN, buff=0.4, aligned_edge=LEFT).shift(RIGHT * 0.5)

        self.play(Write(calc1))
        self.wait(1)

        calc2 = MathTex("P(\\text{no rain})", "=", "0.7", font_size=32)
        calc2[0].set_color(ORANGE)
        calc2[2].set_color(ORANGE)
        calc2.next_to(calc1, DOWN, buff=0.3, aligned_edge=LEFT)

        self.play(Write(calc2))
        self.wait(2)

        # Final fade out
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5)
