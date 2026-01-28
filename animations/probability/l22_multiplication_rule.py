"""
General Multiplication Rule Animation

Demonstrates P(A ∩ B) = P(A) × P(B|A) using a card-drawing example.

Run with:
    manim -qm --format=mp4 l22_multiplication_rule.py GeneralMultiplicationRule
"""

from manim import *


class GeneralMultiplicationRule(Scene):
    def construct(self):
        # Title
        title = Text("General Multiplication Rule", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Formula
        formula = MathTex(
            r"P(A \cap B) = P(A) \times P(B|A)",
            font_size=44
        )
        formula.next_to(title, DOWN, buff=0.6)
        self.play(Write(formula))
        self.wait(1)

        # Scenario text
        scenario = Text(
            "Example: Drawing 2 Aces without replacement",
            font_size=28,
            color=YELLOW
        )
        scenario.next_to(formula, DOWN, buff=0.5)
        self.play(FadeIn(scenario))
        self.wait(1)

        # Create tree diagram
        tree_group = VGroup()

        # Root node
        root = Dot(point=LEFT * 4 + UP * 0.5, radius=0.08, color=WHITE)
        tree_group.add(root)

        # First level - First card
        first_ace = Dot(point=LEFT * 1.5 + UP * 1.5, radius=0.08, color=GREEN)
        first_not_ace = Dot(point=LEFT * 1.5 + DOWN * 1.5, radius=0.08, color=RED)

        # Lines from root to first level
        line_to_ace = Line(root.get_center(), first_ace.get_center(), color=GREEN)
        line_to_not_ace = Line(root.get_center(), first_not_ace.get_center(), color=RED, stroke_opacity=0.3)

        tree_group.add(line_to_ace, line_to_not_ace, first_ace, first_not_ace)

        # Labels for first level
        ace_label = MathTex(r"\text{Ace}", font_size=28, color=GREEN)
        ace_label.next_to(first_ace, UP, buff=0.2)

        ace_prob = MathTex(r"\frac{4}{52}", font_size=28, color=GREEN)
        ace_prob.next_to(line_to_ace, UP, buff=0.05)
        ace_prob.shift(RIGHT * 0.3)

        tree_group.add(ace_label, ace_prob)

        # Second level - Second card (only from Ace branch)
        second_ace = Dot(point=RIGHT * 1.5 + UP * 2.2, radius=0.08, color=GREEN)
        second_not_ace = Dot(point=RIGHT * 1.5 + UP * 0.8, radius=0.08, color=ORANGE)

        # Lines from first ace to second level
        line_to_second_ace = Line(first_ace.get_center(), second_ace.get_center(), color=GREEN)
        line_to_second_not_ace = Line(first_ace.get_center(), second_not_ace.get_center(), color=ORANGE, stroke_opacity=0.3)

        tree_group.add(line_to_second_ace, line_to_second_not_ace, second_ace, second_not_ace)

        # Labels for second level
        second_ace_label = MathTex(r"\text{Ace}", font_size=24, color=GREEN)
        second_ace_label.next_to(second_ace, RIGHT, buff=0.15)

        second_ace_prob = MathTex(r"\frac{3}{51}", font_size=28, color=GREEN)
        second_ace_prob.next_to(line_to_second_ace, UP, buff=0.05)

        tree_group.add(second_ace_label, second_ace_prob)

        # Position tree diagram
        tree_group.scale(0.85)
        tree_group.move_to(DOWN * 0.8)

        # Animate tree construction
        self.play(
            FadeOut(scenario),
            FadeIn(root)
        )
        self.wait(0.3)

        # First branch
        self.play(
            Create(line_to_ace),
            Create(line_to_not_ace),
            run_time=0.8
        )
        self.play(
            FadeIn(first_ace),
            FadeIn(first_not_ace),
            Write(ace_label),
            Write(ace_prob),
            run_time=0.8
        )
        self.wait(0.5)

        # Second branch
        self.play(
            Create(line_to_second_ace),
            Create(line_to_second_not_ace),
            run_time=0.8
        )
        self.play(
            FadeIn(second_ace),
            FadeIn(second_not_ace),
            Write(second_ace_label),
            Write(second_ace_prob),
            run_time=0.8
        )
        self.wait(0.5)

        # Highlight the path to both Aces
        path_highlight = VGroup(line_to_ace, line_to_second_ace)
        self.play(
            path_highlight.animate.set_stroke(width=6, color=YELLOW),
            run_time=0.5
        )
        self.wait(0.5)

        # Show calculation
        calc_box = Rectangle(
            width=6,
            height=1.8,
            color=BLUE,
            fill_opacity=0.1,
            stroke_width=2
        )
        calc_box.to_corner(DR, buff=0.3)

        calc_title = Text("Calculation:", font_size=24, color=BLUE)
        calc_title.next_to(calc_box.get_top(), DOWN, buff=0.15)
        calc_title.align_to(calc_box.get_left(), LEFT)
        calc_title.shift(RIGHT * 0.2)

        calc_step1 = MathTex(
            r"P(\text{both Aces}) = \frac{4}{52} \times \frac{3}{51}",
            font_size=28
        )
        calc_step1.next_to(calc_title, DOWN, buff=0.15)

        calc_step2 = MathTex(
            r"= \frac{12}{2652} = \frac{1}{221}",
            font_size=28
        )
        calc_step2.next_to(calc_step1, DOWN, buff=0.2)

        self.play(
            FadeIn(calc_box),
            Write(calc_title)
        )
        self.wait(0.3)
        self.play(Write(calc_step1))
        self.wait(0.8)
        self.play(Write(calc_step2))
        self.wait(1)

        # Key insight highlight
        insight_box = Rectangle(
            width=7.5,
            height=1.2,
            color=RED,
            fill_opacity=0.15,
            stroke_width=3
        )
        insight_box.to_corner(DL, buff=0.3)

        insight = Text(
            "Key: Second probability changes (51 cards left!)",
            font_size=26,
            color=RED,
            weight=BOLD
        )
        insight.move_to(insight_box.get_center())

        # Highlight denominator change
        denom_highlight = VGroup(
            ace_prob[0][2:4].copy().set_color(YELLOW),  # 52
            second_ace_prob[0][2:4].copy().set_color(YELLOW)  # 51
        )

        self.play(
            FadeIn(insight_box),
            Write(insight)
        )

        # Flash the denominators
        self.play(
            ace_prob[0][2:4].animate.set_color(YELLOW).scale(1.3),
            run_time=0.4
        )
        self.play(
            ace_prob[0][2:4].animate.set_color(GREEN).scale(1/1.3),
            run_time=0.3
        )
        self.wait(0.2)

        self.play(
            second_ace_prob[0][2:4].animate.set_color(YELLOW).scale(1.3),
            run_time=0.4
        )
        self.play(
            second_ace_prob[0][2:4].animate.set_color(GREEN).scale(1/1.3),
            run_time=0.3
        )

        self.wait(2)

        # Fade out everything
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=0.8
        )
        self.wait(0.3)
