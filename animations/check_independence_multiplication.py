"""
Check Independence via Multiplication Rule (AP Stats Unit 4, Topic 4.6c)

Tests whether P(A and B) = P(A) * P(B) to verify independence.

Run with: manim -qm --format=mp4 check_independence_multiplication.py CheckIndependenceMultiplication
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class CheckIndependenceMultiplication(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Check Independence: Multiplication Rule", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== THE TEST ==========
        test = MathTex(
            r"\text{Independent if } P(A \cap B) = P(A) \cdot P(B)",
            font_size=30, color=ManimColor(TEAL_3B1B),
        )
        test.next_to(title, DOWN, buff=0.3)
        test_box = SurroundingRectangle(test, color=ManimColor(TEAL_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(test), Create(test_box), run_time=0.5)
        self.wait(0.5)

        # ========== EXAMPLE: INDEPENDENT ==========
        ex1_title = Text("Example 1: Coin flip + Die roll", font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD)
        ex1_title.next_to(test_box, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex1_title), run_time=0.3)

        ex1_data = VGroup(
            MathTex(r"P(\text{Heads}) = 0.5", font_size=22),
            MathTex(r"P(\text{Six}) = 1/6 \approx 0.167", font_size=22),
            MathTex(r"P(\text{Heads and Six}) = 1/12 \approx 0.083", font_size=22),
        ).arrange(DOWN, buff=0.06, aligned_edge=LEFT).next_to(ex1_title, DOWN, buff=0.1, aligned_edge=LEFT)
        for line in ex1_data:
            self.play(Write(line), run_time=0.25)

        ex1_check = MathTex(
            r"0.5 \times 0.167 = 0.083 \;\checkmark",
            font_size=24, color=ManimColor(GREEN_3B1B),
        )
        ex1_check.next_to(ex1_data, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(ex1_check), run_time=0.4)
        self.wait(0.5)

        # ========== EXAMPLE: NOT INDEPENDENT ==========
        ex2_title = Text("Example 2: Draw 2 cards without replacement", font_size=22, color=ManimColor(RED_3B1B), weight=BOLD)
        ex2_title.next_to(ex1_check, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex2_title), run_time=0.3)

        ex2_data = VGroup(
            MathTex(r"P(\text{1st Ace}) = 4/52 \approx 0.077", font_size=22),
            MathTex(r"P(\text{2nd Ace}) = 4/52 \approx 0.077", font_size=22),
            MathTex(r"P(\text{both Aces}) = 12/2652 \approx 0.0045", font_size=22),
        ).arrange(DOWN, buff=0.06, aligned_edge=LEFT).next_to(ex2_title, DOWN, buff=0.1, aligned_edge=LEFT)
        for line in ex2_data:
            self.play(Write(line), run_time=0.25)

        ex2_check = MathTex(
            r"0.077 \times 0.077 = 0.0059 \neq 0.0045",
            font_size=24, color=ManimColor(RED_3B1B),
        )
        ex2_check.next_to(ex2_data, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(ex2_check), run_time=0.4)
        self.wait(0.5)

        closing = Text(
            "If the product doesn't match, the events are NOT independent.",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.3)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
