"""
Binomial Standard Deviation (AP Stats Unit 4, Topic 4.11b)

Focuses specifically on sigma = sqrt(np(1-p)) and interpreting spread.

Run with: manim -qm --format=mp4 binomial_standard_deviation.py BinomialStandardDeviation
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class BinomialStandardDeviation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Binomial Standard Deviation", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== FORMULA ==========
        formula = MathTex(
            r"\sigma_X = \sqrt{n \cdot p \cdot (1-p)}",
            font_size=36, color=ManimColor(TEAL_3B1B),
        )
        formula.next_to(title, DOWN, buff=0.3)
        formula_box = SurroundingRectangle(formula, color=ManimColor(TEAL_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(formula), Create(formula_box), run_time=0.5)
        self.wait(0.3)

        note = Text("Measures typical deviation from the mean in a binomial distribution",
                     font_size=16, color=GREY_B)
        note.next_to(formula_box, DOWN, buff=0.15)
        self.play(Write(note), run_time=0.3)

        # ========== EXAMPLE ==========
        ex = Text("Example: n = 100, p = 0.25", font_size=22, color=ManimColor(BLUE_3B1B), weight=BOLD)
        ex.next_to(note, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex), run_time=0.3)

        mean_calc = MathTex(
            r"\mu = np = 100(0.25) = 25",
            font_size=24,
        )
        mean_calc.next_to(ex, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(mean_calc), run_time=0.3)

        sd_calc = MathTex(
            r"\sigma = \sqrt{100(0.25)(0.75)} = \sqrt{18.75} \approx 4.33",
            font_size=24, color=ManimColor(GREEN_3B1B),
        )
        sd_calc.next_to(mean_calc, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(sd_calc), run_time=0.4)
        self.wait(0.5)

        # ========== INTERPRETATION ==========
        interp = Text(
            "Expect about 25 successes, typically within 4.33 of that.",
            font_size=19, color=GREY_B,
        )
        interp.next_to(sd_calc, DOWN, buff=0.3)
        self.play(Write(interp), run_time=0.3)

        # ========== KEY INSIGHT ==========
        insight = VGroup(
            Text("SD is largest when p = 0.5 (most variability)", font_size=18, color=ManimColor(ORANGE_3B1B)),
            Text("SD is smallest when p is near 0 or 1 (less variability)", font_size=18, color=ManimColor(ORANGE_3B1B)),
        ).arrange(DOWN, buff=0.1)
        insight.next_to(interp, DOWN, buff=0.3)
        self.play(Write(insight[0]), run_time=0.3)
        self.play(Write(insight[1]), run_time=0.3)
        self.wait(0.5)

        closing = Text(
            "The (1-p) factor means both success AND failure rates affect spread.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
