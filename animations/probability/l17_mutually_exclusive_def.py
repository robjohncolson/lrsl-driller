"""
Mutually Exclusive Events Definition Animation

Renders:
    manim -qm --format=mp4 l17_mutually_exclusive_def.py MutuallyExclusiveDef
"""

from manim import *


class MutuallyExclusiveDef(Scene):
    def construct(self):
        # Title
        title = Text("Mutually Exclusive Events", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Subtitle
        subtitle = Text("(Disjoint Events)", font_size=32, color=GRAY)
        subtitle.next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(subtitle))
        self.wait(1)

        # Show non-overlapping circles
        circle_a = Circle(radius=1.2, color=BLUE, fill_opacity=0.3)
        circle_a.shift(LEFT * 2.5 + UP * 0.5)
        circle_b = Circle(radius=1.2, color=RED, fill_opacity=0.3)
        circle_b.shift(RIGHT * 2.5 + UP * 0.5)

        label_a = Text("A", font_size=40, color=BLUE).move_to(circle_a)
        label_b = Text("B", font_size=40, color=RED).move_to(circle_b)

        self.play(
            Create(circle_a),
            Create(circle_b),
            Write(label_a),
            Write(label_b)
        )
        self.wait(0.5)

        # Arrow showing gap
        gap_arrow = DoubleArrow(
            circle_a.get_right(),
            circle_b.get_left(),
            color=YELLOW,
            buff=0
        )
        gap_label = Text("Cannot happen\ntogether", font_size=24, color=YELLOW)
        gap_label.next_to(gap_arrow, DOWN, buff=0.2)

        self.play(
            GrowFromCenter(gap_arrow),
            FadeIn(gap_label)
        )
        self.wait(1)

        # Formula
        formula = MathTex(
            r"P(A \cap B) = 0",
            font_size=44,
            color=YELLOW
        )
        formula.next_to(gap_label, DOWN, buff=0.5)
        self.play(Write(formula))
        self.wait(1.5)

        # Clear for examples
        self.play(
            FadeOut(circle_a),
            FadeOut(circle_b),
            FadeOut(label_a),
            FadeOut(label_b),
            FadeOut(gap_arrow),
            FadeOut(gap_label),
            FadeOut(subtitle)
        )
        self.wait(0.3)

        # Examples section
        examples_title = Text("Examples:", font_size=36, weight=BOLD, color=GREEN)
        examples_title.next_to(formula, DOWN, buff=0.5)
        self.play(Write(examples_title))
        self.wait(0.5)

        # Example 1
        ex1 = Text("Rolling EVEN and ODD on one die", font_size=28)
        ex1.next_to(examples_title, DOWN, buff=0.3)
        self.play(FadeIn(ex1))
        self.wait(1)

        # Example 2
        ex2 = Text("Being in 9th grade AND 10th grade", font_size=28)
        ex2.next_to(ex1, DOWN, buff=0.2)
        self.play(FadeIn(ex2))
        self.wait(1.5)

        # Clear examples
        self.play(
            FadeOut(ex1),
            FadeOut(ex2),
            FadeOut(examples_title)
        )
        self.wait(0.3)

        # Counter-example
        counter_title = Text("NOT Mutually Exclusive:", font_size=36, weight=BOLD, color=RED)
        counter_title.next_to(formula, DOWN, buff=0.5)
        self.play(Write(counter_title))
        self.wait(0.5)

        # Show overlapping circles for counter-example
        overlap_a = Circle(radius=1, color=BLUE, fill_opacity=0.2)
        overlap_a.shift(LEFT * 0.8 + DOWN * 2)
        overlap_b = Circle(radius=1, color=RED, fill_opacity=0.2)
        overlap_b.shift(RIGHT * 0.8 + DOWN * 2)

        overlap_label_a = Text("Basketball\nPlayers", font_size=20, color=BLUE)
        overlap_label_a.move_to(overlap_a).shift(LEFT * 0.5)
        overlap_label_b = Text("Tall\nPeople", font_size=20, color=RED)
        overlap_label_b.move_to(overlap_b).shift(RIGHT * 0.5)

        self.play(
            Create(overlap_a),
            Create(overlap_b),
            Write(overlap_label_a),
            Write(overlap_label_b)
        )
        self.wait(0.5)

        # Highlight intersection
        intersection_label = Text("CAN overlap!", font_size=24, color=YELLOW)
        intersection_label.next_to(overlap_a, DOWN, buff=1)
        arrow_to_overlap = Arrow(
            intersection_label.get_top(),
            overlap_a.get_bottom() + RIGHT * 0.3,
            color=YELLOW
        )
        self.play(
            Write(intersection_label),
            GrowArrow(arrow_to_overlap)
        )
        self.wait(2)

        # Fade out everything
        self.play(
            *[FadeOut(mob) for mob in self.mobjects]
        )
        self.wait(0.5)
