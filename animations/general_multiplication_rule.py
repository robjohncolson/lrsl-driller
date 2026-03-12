"""
General Multiplication Rule (AP Stats Unit 4, Topic 4.5c)

P(A and B) = P(B) * P(A|B)

Run with: manim -qm --format=mp4 general_multiplication_rule.py GeneralMultiplicationRule
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class GeneralMultiplicationRule(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("General Multiplication Rule", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== FORMULA ==========
        formula = MathTex(
            r"P(A \cap B)", r"=", r"P(B)", r"\cdot", r"P(A \mid B)",
            font_size=40,
        )
        formula[0].set_color(ManimColor(GREEN_3B1B))
        formula[2].set_color(ManimColor(BLUE_3B1B))
        formula[4].set_color(ManimColor(ORANGE_3B1B))
        formula.next_to(title, DOWN, buff=0.4)
        box = SurroundingRectangle(formula, color=ManimColor(YELLOW_3B1B), buff=0.15, corner_radius=0.1)
        self.play(Write(formula), Create(box), run_time=0.6)
        self.wait(0.5)

        # ========== TREE DIAGRAM EXAMPLE ==========
        context = Text(
            "Example: Draw 2 cards without replacement. P(both Aces)?",
            font_size=20, color=GREY_B,
        )
        context.next_to(box, DOWN, buff=0.4)
        self.play(Write(context), run_time=0.4)

        # Branch 1
        b1_label = Text("1st card Ace", font_size=18, color=ManimColor(BLUE_3B1B))
        b1_prob = MathTex(r"P(B) = \frac{4}{52}", font_size=24, color=ManimColor(BLUE_3B1B))
        b1 = VGroup(b1_label, b1_prob).arrange(RIGHT, buff=0.3)
        b1.next_to(context, DOWN, buff=0.35).align_to(LEFT * 5, LEFT)

        # Branch 2
        b2_label = Text("2nd card Ace | 1st was Ace", font_size=18, color=ManimColor(ORANGE_3B1B))
        b2_prob = MathTex(r"P(A|B) = \frac{3}{51}", font_size=24, color=ManimColor(ORANGE_3B1B))
        b2 = VGroup(b2_label, b2_prob).arrange(RIGHT, buff=0.3)
        b2.next_to(b1, DOWN, buff=0.2).align_to(b1, LEFT)

        self.play(Write(b1), run_time=0.4)
        self.play(Write(b2), run_time=0.4)
        self.wait(0.5)

        # ========== CALCULATION ==========
        calc = MathTex(
            r"P(\text{both Aces}) = \frac{4}{52} \times \frac{3}{51} = \frac{12}{2652} \approx 0.0045",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        calc.next_to(b2, DOWN, buff=0.4)
        self.play(Write(calc), run_time=0.5)
        self.wait(0.5)

        # ========== KEY POINT ==========
        closing = Text(
            "Multiply along the branches of a tree diagram.",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
