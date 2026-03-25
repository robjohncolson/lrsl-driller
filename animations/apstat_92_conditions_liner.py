"""
Conditions for Regression Inference: L-I-N-E-R (AP Stats Unit 9, Topic 9.2)

Animates the five conditions for inference about regression slopes as a
checklist. Each letter expands to its full condition name with a brief
description: Linear, Independent, Normal, Equal SD, Random.

Run with: manim -qm --format=mp4 apstat_92_conditions_liner.py ConditionsLINER
"""
from manim import *

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

CONDITION_DATA = [
    ("L", "Linear", "The scatterplot of x vs y shows a linear pattern\n(check the residual plot for no curved pattern)"),
    ("I", "Independent", "Observations are independent of each other\n(10% condition: n < 10% of the population)"),
    ("N", "Normal", "For any given x, the y-values are\nnormally distributed (check residual plot for normality)"),
    ("E", "Equal SD", "The standard deviation of y is the same\nfor all values of x (constant spread in residual plot)"),
    ("R", "Random", "Data come from a random sample\nor a randomized experiment"),
]

LETTER_COLORS = [BLUE_3B1B, TEAL_3B1B, YELLOW_3B1B, PINK_3B1B, GREEN_3B1B]


class ConditionsLINER(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Conditions for Regression Inference", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "The L-I-N-E-R Checklist",
            font_size=22, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== SHOW ALL 5 LETTERS IN A ROW ==========
        letters = VGroup()
        for i, (letter, _, _) in enumerate(CONDITION_DATA):
            txt = Text(letter, font_size=60, weight=BOLD, color=LETTER_COLORS[i])
            letters.add(txt)
        letters.arrange(RIGHT, buff=0.8)
        letters.move_to(ORIGIN)

        self.play(
            LaggedStart(
                *[FadeIn(l, shift=UP * 0.3) for l in letters],
                lag_ratio=0.15,
            ),
            run_time=1.2,
        )
        self.wait(0.6)

        # ========== MOVE LETTERS TO LEFT SIDE, EXPAND EACH ==========
        self.play(
            FadeOut(subtitle),
            letters.animate.scale(0.6).arrange(DOWN, buff=0.55, aligned_edge=LEFT).move_to(LEFT * 5.2 + DOWN * 0.2),
            run_time=0.8,
        )

        expanded_items = VGroup()
        for i, (letter, name, desc) in enumerate(CONDITION_DATA):
            letter_mob = letters[i]

            # Full condition name
            name_text = Text(
                f"  {name}",
                font_size=28, weight=BOLD, color=LETTER_COLORS[i],
            )
            name_text.next_to(letter_mob, RIGHT, buff=0.15)

            # Description
            desc_text = Text(desc, font_size=20, color=GRAY_A)
            desc_text.next_to(name_text, RIGHT, buff=0.3)

            # Checkmark
            check = Text("\u2713", font_size=30, color=GREEN_3B1B, weight=BOLD)
            check.next_to(desc_text, RIGHT, buff=0.25)

            row = VGroup(name_text, desc_text, check)
            expanded_items.add(row)

            # Animate: name appears, then description, then check
            self.play(Write(name_text), run_time=0.4)
            self.play(FadeIn(desc_text, shift=RIGHT * 0.2), run_time=0.5)
            self.play(FadeIn(check, scale=1.5), run_time=0.25)
            self.wait(0.3)

        self.wait(0.5)

        # ========== KEY INSIGHT ==========
        all_content = VGroup(letters, expanded_items)
        self.play(FadeOut(all_content), FadeOut(title), run_time=0.5)

        insight_items = VGroup(
            Text("L-I-N-E-R Conditions", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=6),
            Text("L  Linear relationship (residual plot)", font_size=24, color=ManimColor(BLUE_3B1B)),
            Text("I   Independent observations (10% condition)", font_size=24, color=ManimColor(TEAL_3B1B)),
            Text("N  Normal response for each x", font_size=24, color=ManimColor(YELLOW_3B1B)),
            Text("E  Equal standard deviation for all x", font_size=24, color=ManimColor(PINK_3B1B)),
            Text("R  Random sample or randomized experiment", font_size=24, color=ManimColor(GREEN_3B1B)),
            Text("", font_size=6),
            Text("All five must be checked before performing", font_size=22),
            Text("inference on the slope of a regression model.", font_size=22, color=TEAL_3B1B),
        ).arrange(DOWN, buff=0.12)
        insight_items.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_items, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_items],
                lag_ratio=0.18,
            ),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(1.8)
