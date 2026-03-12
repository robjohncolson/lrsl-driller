"""
Standard Deviation of a Discrete Random Variable (AP Stats Unit 4, Topic 4.8b)

Shows sigma = sqrt(sum (xi - mu)^2 * P(xi)) with a concrete example.

Run with: manim -qm --format=mp4 standard_deviation_formula.py StandardDeviationFormula
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class StandardDeviationFormula(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Standard Deviation of a Random Variable", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== FORMULA ==========
        formula = MathTex(
            r"\sigma_X = \sqrt{\sum (x_i - \mu)^2 \cdot P(x_i)}",
            font_size=32, color=ManimColor(TEAL_3B1B),
        )
        formula.next_to(title, DOWN, buff=0.3)
        formula_box = SurroundingRectangle(formula, color=ManimColor(TEAL_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(formula), Create(formula_box), run_time=0.5)
        self.wait(0.3)

        meaning = Text(
            "Average distance from the mean, weighted by probability",
            font_size=18, color=GREY_B,
        )
        meaning.next_to(formula_box, DOWN, buff=0.15)
        self.play(Write(meaning), run_time=0.3)

        # ========== EXAMPLE ==========
        ex = Text("Example: X = pets, E(X) = 1.10", font_size=20, color=ManimColor(BLUE_3B1B), weight=BOLD)
        ex.next_to(meaning, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex), run_time=0.3)

        # Show each deviation squared * probability
        rows = [
            ("x=0:", "(0-1.1)^2(0.30) = 0.363"),
            ("x=1:", "(1-1.1)^2(0.40) = 0.004"),
            ("x=2:", "(2-1.1)^2(0.20) = 0.162"),
            ("x=3:", "(3-1.1)^2(0.10) = 0.361"),
        ]

        prev = ex
        for label, calc in rows:
            row = VGroup(
                Text(label, font_size=17, color=GREY_B),
                MathTex(calc, font_size=20),
            ).arrange(RIGHT, buff=0.2)
            row.next_to(prev, DOWN, buff=0.1).align_to(LEFT * 4.5, LEFT)
            self.play(Write(row), run_time=0.25)
            prev = row

        # ========== RESULT ==========
        total = MathTex(
            r"\sigma^2 = 0.890 \quad \Rightarrow \quad \sigma = \sqrt{0.890} \approx 0.943",
            font_size=24, color=ManimColor(GREEN_3B1B),
        )
        total.next_to(prev, DOWN, buff=0.3)
        self.play(Write(total), run_time=0.5)
        self.wait(0.5)

        closing = Text(
            "The typical household deviates about 0.94 pets from the mean.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
