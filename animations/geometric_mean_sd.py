"""
Geometric Distribution Parameters (AP Stats Unit 4, Topic 4.12c)

Mean = 1/p and SD = sqrt((1-p)/p^2) with interpretation.

Run with: manim -qm --format=mp4 geometric_mean_sd.py GeometricMeanSD
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class GeometricMeanSD(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Geometric Distribution Parameters", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== FORMULAS ==========
        mean_f = MathTex(
            r"\mu = \frac{1}{p}",
            font_size=36, color=ManimColor(GREEN_3B1B),
        )
        sd_f = MathTex(
            r"\sigma = \frac{\sqrt{1-p}}{p}",
            font_size=36, color=ManimColor(ORANGE_3B1B),
        )
        formulas = VGroup(mean_f, sd_f).arrange(RIGHT, buff=1.5)
        formulas.next_to(title, DOWN, buff=0.4)
        formulas_box = SurroundingRectangle(formulas, color=ManimColor(TEAL_3B1B), buff=0.15, corner_radius=0.1)
        self.play(Write(mean_f), Write(sd_f), Create(formulas_box), run_time=0.6)
        self.wait(0.3)

        meaning = Text(
            "X = number of trials until first success",
            font_size=18, color=GREY_B,
        )
        meaning.next_to(formulas_box, DOWN, buff=0.15)
        self.play(Write(meaning), run_time=0.3)

        # ========== EXAMPLE ==========
        ex = Text("Example: Rolling a 6 (p = 1/6)", font_size=22, color=ManimColor(BLUE_3B1B), weight=BOLD)
        ex.next_to(meaning, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        self.play(Write(ex), run_time=0.3)

        mean_calc = MathTex(
            r"\mu = \frac{1}{1/6} = 6 \text{ rolls}",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        mean_calc.next_to(ex, DOWN, buff=0.2, aligned_edge=LEFT)
        self.play(Write(mean_calc), run_time=0.4)

        sd_calc = MathTex(
            r"\sigma = \frac{\sqrt{5/6}}{1/6} = \frac{0.913}{0.167} \approx 5.48 \text{ rolls}",
            font_size=24, color=ManimColor(ORANGE_3B1B),
        )
        sd_calc.next_to(mean_calc, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(sd_calc), run_time=0.4)
        self.wait(0.5)

        interp = VGroup(
            Text("On average, it takes 6 rolls to get a six.", font_size=18, color=GREY_B),
            Text("But there's high variability (SD = 5.48).", font_size=18, color=GREY_B),
        ).arrange(DOWN, buff=0.08).next_to(sd_calc, DOWN, buff=0.3)
        self.play(Write(interp[0]), run_time=0.3)
        self.play(Write(interp[1]), run_time=0.3)
        self.wait(0.5)

        closing = Text(
            "Geometric distributions are right-skewed with large spread.",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
