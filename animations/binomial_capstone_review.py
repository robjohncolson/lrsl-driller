"""
Binomial Capstone Review (AP Stats Unit 4, Topic 4.10 Capstone)

Full binomial problem: check BINS, calculate, interpret.

Run with: manim -qm --format=mp4 binomial_capstone_review.py BinomialCapstoneReview
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class BinomialCapstoneReview(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Binomial Capstone: Full Problem", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== PROBLEM ==========
        problem = Text(
            "A factory produces items with 8% defect rate. In a batch of 20,\nwhat is P(at most 2 defective)?",
            font_size=19, color=GREY_B,
        )
        problem.next_to(title, DOWN, buff=0.3)
        self.play(Write(problem), run_time=0.5)
        self.wait(0.3)

        # ========== STEP 1: BINS ==========
        s1 = Text("Step 1: Verify BINS", font_size=20, color=ManimColor(TEAL_3B1B), weight=BOLD)
        s1.next_to(problem, DOWN, buff=0.3).align_to(LEFT * 5.5, LEFT)
        bins = Text("B: defective/not | I: independent | N: n=20 | S: p=0.08", font_size=16, color=GREY_B)
        bins.next_to(s1, DOWN, buff=0.08, aligned_edge=LEFT)
        self.play(Write(s1), Write(bins), run_time=0.4)

        # ========== STEP 2: CALCULATE ==========
        s2 = Text("Step 2: Calculate P(X <= 2)", font_size=20, color=ManimColor(TEAL_3B1B), weight=BOLD)
        s2.next_to(bins, DOWN, buff=0.25).align_to(LEFT * 5.5, LEFT)
        self.play(Write(s2), run_time=0.3)

        terms = VGroup(
            MathTex(r"P(X=0) = \binom{20}{0}(0.08)^0(0.92)^{20} = 0.1887", font_size=20),
            MathTex(r"P(X=1) = \binom{20}{1}(0.08)^1(0.92)^{19} = 0.3282", font_size=20),
            MathTex(r"P(X=2) = \binom{20}{2}(0.08)^2(0.92)^{18} = 0.2711", font_size=20),
        ).arrange(DOWN, buff=0.06, aligned_edge=LEFT).next_to(s2, DOWN, buff=0.1, aligned_edge=LEFT)
        for t in terms:
            self.play(Write(t), run_time=0.3)

        total = MathTex(
            r"P(X \leq 2) = 0.1887 + 0.3282 + 0.2711 = 0.7880",
            font_size=22, color=ManimColor(GREEN_3B1B),
        )
        total.next_to(terms, DOWN, buff=0.15)
        self.play(Write(total), run_time=0.4)
        self.wait(0.5)

        # ========== STEP 3: INTERPRET ==========
        closing = Text(
            "About 79% chance of at most 2 defective items in a batch of 20.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
