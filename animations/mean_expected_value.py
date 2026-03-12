"""
Mean (Expected Value) of a Discrete Random Variable (AP Stats Unit 4, Topic 4.8a)

Shows E(X) = sum of xi * P(xi) with a concrete example.

Run with: manim -qm --format=mp4 mean_expected_value.py MeanExpectedValue
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class MeanExpectedValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Mean (Expected Value)", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== FORMULA ==========
        formula = MathTex(
            r"\mu_X = E(X) = \sum x_i \cdot P(x_i)",
            font_size=34, color=ManimColor(TEAL_3B1B),
        )
        formula.next_to(title, DOWN, buff=0.3)
        formula_box = SurroundingRectangle(formula, color=ManimColor(TEAL_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(formula), Create(formula_box), run_time=0.5)
        self.wait(0.5)

        meaning = Text(
            "Weighted average — each value weighted by its probability",
            font_size=18, color=GREY_B,
        )
        meaning.next_to(formula_box, DOWN, buff=0.2)
        self.play(Write(meaning), run_time=0.3)

        # ========== EXAMPLE ==========
        ex_title = Text("Example: Number of pets per household", font_size=22, color=ManimColor(BLUE_3B1B), weight=BOLD)
        ex_title.next_to(meaning, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex_title), run_time=0.3)

        headers = ["X", "0", "1", "2", "3"]
        probs = ["P(X)", "0.30", "0.40", "0.20", "0.10"]

        table = Table(
            [probs],
            col_labels=[Text(h, font_size=18) for h in headers],
            include_outer_lines=True,
            line_config={"color": GREY_B},
        ).scale(0.6).next_to(ex_title, DOWN, buff=0.2)
        self.play(Create(table), run_time=0.5)
        self.wait(0.3)

        # ========== CALCULATION ==========
        calc = MathTex(
            r"E(X) = 0(0.30) + 1(0.40) + 2(0.20) + 3(0.10)",
            font_size=24,
        )
        calc.next_to(table, DOWN, buff=0.3)
        self.play(Write(calc), run_time=0.4)

        result = MathTex(
            r"= 0 + 0.40 + 0.40 + 0.30 = 1.10",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        result.next_to(calc, DOWN, buff=0.15)
        self.play(Write(result), run_time=0.4)
        self.wait(0.5)

        closing = Text(
            "On average, households have 1.10 pets (a long-run average, not a single outcome).",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
