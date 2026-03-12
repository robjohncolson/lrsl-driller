"""
Order Matters: P(A|B) vs P(B|A) (AP Stats Unit 4, Topic 4.5d)

Demonstrates that conditional probability is NOT symmetric.

Run with: manim -qm --format=mp4 order_matters_conditional.py OrderMattersConditional
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class OrderMattersConditional(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("P(A|B) vs P(B|A): Order Matters!", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== CONTEXT ==========
        context = Text(
            "100 students: 30 play sports, 20 are honor roll, 10 do both.",
            font_size=20, color=GREY_B,
        )
        context.next_to(title, DOWN, buff=0.3)
        self.play(Write(context), run_time=0.4)
        self.wait(0.3)

        # ========== QUESTION 1 ==========
        q1 = Text("P(Honor Roll | Sports)?", font_size=24, color=ManimColor(BLUE_3B1B), weight=BOLD)
        q1.next_to(context, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)
        self.play(Write(q1), run_time=0.3)

        a1_restrict = Text("Restrict to Sports (30)", font_size=17, color=GREY_B)
        a1_restrict.next_to(q1, DOWN, buff=0.1, aligned_edge=LEFT)
        a1 = MathTex(
            r"= \frac{10}{30} = \frac{1}{3} \approx 0.333",
            font_size=28, color=ManimColor(BLUE_3B1B),
        )
        a1.next_to(a1_restrict, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(a1_restrict), run_time=0.3)
        self.play(Write(a1), run_time=0.4)
        self.wait(0.5)

        # ========== QUESTION 2 ==========
        q2 = Text("P(Sports | Honor Roll)?", font_size=24, color=ManimColor(ORANGE_3B1B), weight=BOLD)
        q2.next_to(a1, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)
        self.play(Write(q2), run_time=0.3)

        a2_restrict = Text("Restrict to Honor Roll (20)", font_size=17, color=GREY_B)
        a2_restrict.next_to(q2, DOWN, buff=0.1, aligned_edge=LEFT)
        a2 = MathTex(
            r"= \frac{10}{20} = \frac{1}{2} = 0.500",
            font_size=28, color=ManimColor(ORANGE_3B1B),
        )
        a2.next_to(a2_restrict, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(a2_restrict), run_time=0.3)
        self.play(Write(a2), run_time=0.4)
        self.wait(0.5)

        # ========== COMPARISON ==========
        neq = MathTex(
            r"\frac{1}{3} \neq \frac{1}{2}",
            font_size=36, color=ManimColor(RED_3B1B),
        )
        neq.next_to(a2, DOWN, buff=0.4)
        self.play(Write(neq), run_time=0.3)

        closing = Text(
            "The denominator changes depending on which event is GIVEN.",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
