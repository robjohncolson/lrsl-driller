"""
Independent vs Mutually Exclusive Events

Render command:
manim -qm --format=mp4 l31_indep_vs_me.py IndepVsMutuallyExclusive
"""

from manim import *

class IndepVsMutuallyExclusive(Scene):
    def construct(self):
        # Title
        title = Text("Independent vs Mutually Exclusive", font_size=48, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create two sides
        left_label = Text("INDEPENDENT", font_size=36, color=BLUE).move_to(LEFT * 3.5 + UP * 2)
        right_label = Text("MUTUALLY EXCLUSIVE", font_size=32, color=RED).move_to(RIGHT * 3.5 + UP * 2)

        # Divider line
        divider = Line(UP * 2.5, DOWN * 3.5, color=GRAY)

        self.play(
            Write(left_label),
            Write(right_label),
            Create(divider)
        )
        self.wait(0.5)

        # LEFT SIDE: Independent (overlapping circles)
        circle_a_left = Circle(radius=0.8, color=BLUE, fill_opacity=0.3).move_to(LEFT * 4 + UP * 0.5)
        circle_b_left = Circle(radius=0.8, color=GREEN, fill_opacity=0.3).move_to(LEFT * 3 + UP * 0.5)
        label_a_left = Text("A", font_size=32).move_to(circle_a_left.get_center() + LEFT * 0.4)
        label_b_left = Text("B", font_size=32).move_to(circle_b_left.get_center() + RIGHT * 0.4)

        can_happen = Text("CAN happen together", font_size=24, color=BLUE).move_to(LEFT * 3.5 + DOWN * 0.8)

        # RIGHT SIDE: Mutually Exclusive (non-overlapping circles)
        circle_a_right = Circle(radius=0.8, color=RED, fill_opacity=0.3).move_to(RIGHT * 2.8 + UP * 0.5)
        circle_b_right = Circle(radius=0.8, color=ORANGE, fill_opacity=0.3).move_to(RIGHT * 4.5 + UP * 0.5)
        label_a_right = Text("A", font_size=32).move_to(circle_a_right.get_center())
        label_b_right = Text("B", font_size=32).move_to(circle_b_right.get_center())

        cannot_happen = Text("CANNOT happen together", font_size=24, color=RED).move_to(RIGHT * 3.5 + DOWN * 0.8)

        # Draw circles
        self.play(
            Create(circle_a_left),
            Create(circle_b_left),
            Write(label_a_left),
            Write(label_b_left),
            Create(circle_a_right),
            Create(circle_b_right),
            Write(label_a_right),
            Write(label_b_right)
        )
        self.wait(0.5)

        self.play(
            Write(can_happen),
            Write(cannot_happen)
        )
        self.wait(1)

        # Show formulas
        formula_left = MathTex(
            r"P(A \cap B) = P(A) \times P(B)",
            font_size=28,
            color=BLUE
        ).move_to(LEFT * 3.5 + DOWN * 1.5)
        formula_left_note = MathTex(r"\neq 0", font_size=28, color=BLUE).next_to(formula_left, DOWN, buff=0.1)

        formula_right = MathTex(
            r"P(A \cap B) = 0",
            font_size=32,
            color=RED
        ).move_to(RIGHT * 3.5 + DOWN * 1.5)

        self.play(
            Write(formula_left),
            Write(formula_left_note),
            Write(formula_right)
        )
        self.wait(1.5)

        # Key insight
        insight_box = Rectangle(
            width=6,
            height=1.2,
            color=YELLOW,
            fill_opacity=0.2,
            stroke_width=3
        ).move_to(DOWN * 2.8)

        insight_text = Text(
            "ME events are DEPENDENT!\n(knowing A rules out B)",
            font_size=28,
            color=YELLOW,
            weight=BOLD
        ).move_to(insight_box.get_center())

        self.play(
            Create(insight_box),
            Write(insight_text)
        )
        self.wait(1.5)

        # Warning
        warning = Text(
            "These are OPPOSITE concepts!",
            font_size=32,
            color=RED,
            weight=BOLD
        ).move_to(UP * 1.2)

        self.play(
            title.animate.scale(0.7).to_edge(UP, buff=0.2),
            Write(warning)
        )
        self.wait(2)
