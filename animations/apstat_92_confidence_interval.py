"""
Confidence Interval for the Slope (AP Stats Unit 9, Topic 9.2)

Shows the formula b1 +/- t* x SE(b1), plugs in values step by step,
computes the interval, then displays the interpretation sentence.

Run with: manim -qm --format=mp4 apstat_92_confidence_interval.py ConfidenceInterval
"""
from manim import *

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ConfidenceInterval(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Confidence Interval for the Slope", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Estimating \u03b2\u2081 with a range of plausible values",
            font_size=22, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== FORMULA ==========
        formula_label = Text("Formula:", font_size=24, color=GRAY_A)
        formula_label.move_to(LEFT * 3 + UP * 1.2)
        self.play(Write(formula_label), run_time=0.3)

        formula = Text(
            "b\u2081  \u00b1  t*  \u00d7  SE(b\u2081)",
            font_size=34, weight=BOLD, color=ManimColor(BLUE_3B1B),
        )
        formula.next_to(formula_label, RIGHT, buff=0.3)
        formula_box = SurroundingRectangle(formula, color=BLUE_3B1B, buff=0.15, corner_radius=0.1)

        self.play(Write(formula), Create(formula_box), run_time=0.8)
        self.wait(0.6)

        # ========== GIVEN VALUES ==========
        given_title = Text("Given (Old Faithful):", font_size=24, color=GRAY_A)
        given_title.move_to(LEFT * 4.5 + UP * 0.2)
        self.play(Write(given_title), run_time=0.3)

        givens = VGroup(
            Text("b\u2081 = 13.29", font_size=26, color=ManimColor(BLUE_3B1B)),
            Text("SE(b\u2081) = 0.340", font_size=26, color=ManimColor(PINK_3B1B)),
            Text("n = 30  \u2192  df = 28", font_size=26, color=WHITE),
            Text("95% confidence  \u2192  t* = 2.048", font_size=26, color=ManimColor(YELLOW_3B1B)),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        givens.next_to(given_title, DOWN, buff=0.2, aligned_edge=LEFT)

        self.play(
            LaggedStart(*[Write(g) for g in givens], lag_ratio=0.2),
            run_time=1.5,
        )
        self.wait(0.6)

        # ========== STEP BY STEP CALCULATION ==========
        self.play(
            FadeOut(formula_label), FadeOut(formula), FadeOut(formula_box),
            FadeOut(subtitle), FadeOut(given_title),
            givens.animate.scale(0.7).to_corner(UL, buff=0.4).shift(DOWN * 0.8),
            run_time=0.6,
        )

        calc_title = Text("Step-by-Step:", font_size=28, weight=BOLD, color=TEAL_3B1B)
        calc_title.move_to(UP * 1.3)
        self.play(Write(calc_title), run_time=0.3)

        # Step 1: margin of error
        step1_label = Text("Margin of error:", font_size=24, color=GRAY_A)
        step1_label.move_to(LEFT * 2 + UP * 0.6)
        step1_calc = Text(
            "t* \u00d7 SE(b\u2081) = 2.048 \u00d7 0.340 = 0.696",
            font_size=26, color=ManimColor(YELLOW_3B1B),
        )
        step1_calc.next_to(step1_label, DOWN, buff=0.12, aligned_edge=LEFT)

        self.play(Write(step1_label), run_time=0.3)
        self.play(Write(step1_calc), run_time=0.8)
        self.wait(0.4)

        # Step 2: lower bound
        step2_label = Text("Lower bound:", font_size=24, color=GRAY_A)
        step2_label.next_to(step1_calc, DOWN, buff=0.3, aligned_edge=LEFT)
        step2_calc = Text(
            "13.29 \u2212 0.696 = 12.594",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        step2_calc.next_to(step2_label, DOWN, buff=0.12, aligned_edge=LEFT)

        self.play(Write(step2_label), run_time=0.3)
        self.play(Write(step2_calc), run_time=0.6)
        self.wait(0.3)

        # Step 3: upper bound
        step3_label = Text("Upper bound:", font_size=24, color=GRAY_A)
        step3_label.next_to(step2_calc, DOWN, buff=0.3, aligned_edge=LEFT)
        step3_calc = Text(
            "13.29 + 0.696 = 13.986",
            font_size=26, color=ManimColor(GREEN_3B1B),
        )
        step3_calc.next_to(step3_label, DOWN, buff=0.12, aligned_edge=LEFT)

        self.play(Write(step3_label), run_time=0.3)
        self.play(Write(step3_calc), run_time=0.6)
        self.wait(0.4)

        # Result
        result = Text(
            "95% CI:  (12.594, 13.986)",
            font_size=30, weight=BOLD, color=ManimColor(BLUE_3B1B),
        )
        result.next_to(step3_calc, DOWN, buff=0.4)
        result_box = SurroundingRectangle(result, color=BLUE_3B1B, buff=0.15, corner_radius=0.1)

        self.play(Write(result), Create(result_box), run_time=0.8)
        self.wait(0.8)

        # ========== INTERPRETATION ==========
        calc_all = VGroup(
            calc_title, step1_label, step1_calc,
            step2_label, step2_calc, step3_label, step3_calc,
            result, result_box, givens, title,
        )
        self.play(FadeOut(calc_all), run_time=0.5)

        interp_title = Text("Interpretation", font_size=32, weight=BOLD, color=YELLOW_3B1B)
        interp_title.to_edge(UP, buff=0.5)
        self.play(Write(interp_title), run_time=0.4)

        interp_text = VGroup(
            Text(
                "We are 95% confident that the true slope",
                font_size=26,
            ),
            Text(
                "of the population regression model relating",
                font_size=26,
            ),
            Text(
                "eruption duration to waiting interval",
                font_size=26, color=TEAL_3B1B,
            ),
            Text(
                "is between 12.594 and 13.986 minutes",
                font_size=26, color=ManimColor(GREEN_3B1B), weight=BOLD,
            ),
            Text(
                "per minute of eruption duration.",
                font_size=26,
            ),
        ).arrange(DOWN, buff=0.15)
        interp_text.next_to(interp_title, DOWN, buff=0.4)

        self.play(
            LaggedStart(*[Write(line) for line in interp_text], lag_ratio=0.25),
            run_time=2.5,
        )

        interp_box = SurroundingRectangle(
            VGroup(interp_title, interp_text),
            color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )
        self.play(Create(interp_box), run_time=0.5)
        self.wait(0.5)

        # Key template
        template_note = Text(
            'Template: "We are C% confident the true slope is between ___ and ___."',
            font_size=20, color=GRAY_A,
        )
        template_note.to_edge(DOWN, buff=0.4)
        self.play(Write(template_note), run_time=0.6)
        self.wait(1.8)
