"""
Calculate Binomial Probability P(X=k) (AP Stats Unit 4, Topic 4.10d)

Shows the binomial formula with a concrete calculation.

Run with: manim -qm --format=mp4 calculate_binomial_probability.py CalculateBinomialProbability
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class CalculateBinomialProbability(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Calculate P(X = k)", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== FORMULA ==========
        formula = MathTex(
            r"P(X = k) = \binom{n}{k} p^k (1-p)^{n-k}",
            font_size=34, color=ManimColor(TEAL_3B1B),
        )
        formula.next_to(title, DOWN, buff=0.3)
        formula_box = SurroundingRectangle(formula, color=ManimColor(TEAL_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(formula), Create(formula_box), run_time=0.5)
        self.wait(0.3)

        # ========== LABEL COMPONENTS ==========
        labels = VGroup(
            Text("ways to arrange", font_size=14, color=ManimColor(BLUE_3B1B)),
            Text("success prob", font_size=14, color=ManimColor(GREEN_3B1B)),
            Text("failure prob", font_size=14, color=ManimColor(RED_3B1B)),
        )
        # Position arrows roughly under formula parts
        labels[0].next_to(formula_box, DOWN, buff=0.15).shift(LEFT * 2.5)
        labels[1].next_to(formula_box, DOWN, buff=0.15)
        labels[2].next_to(formula_box, DOWN, buff=0.15).shift(RIGHT * 2.5)
        self.play(*[Write(l) for l in labels], run_time=0.3)

        # ========== EXAMPLE ==========
        ex = Text("n = 10, p = 0.3, find P(X = 4)", font_size=22, color=ManimColor(BLUE_3B1B), weight=BOLD)
        ex.next_to(labels, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex), run_time=0.3)

        step1 = MathTex(
            r"\binom{10}{4} = \frac{10!}{4! \cdot 6!} = 210",
            font_size=24,
        )
        step1.next_to(ex, DOWN, buff=0.2, aligned_edge=LEFT)
        self.play(Write(step1), run_time=0.4)

        step2 = MathTex(
            r"(0.3)^4 = 0.0081", font_size=24,
        )
        step2.next_to(step1, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(step2), run_time=0.3)

        step3 = MathTex(
            r"(0.7)^6 = 0.1176", font_size=24,
        )
        step3.next_to(step2, DOWN, buff=0.1, aligned_edge=LEFT)
        self.play(Write(step3), run_time=0.3)

        result = MathTex(
            r"P(X=4) = 210 \times 0.0081 \times 0.1176 \approx 0.200",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        result.next_to(step3, DOWN, buff=0.25)
        result_box = SurroundingRectangle(result, color=ManimColor(GREEN_3B1B), buff=0.1, corner_radius=0.1)
        self.play(Write(result), Create(result_box), run_time=0.5)
        self.wait(0.5)

        closing = Text(
            "There's about a 20% chance of exactly 4 successes in 10 trials.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        self.play(Write(closing), run_time=0.4)
        self.wait(1.5)
