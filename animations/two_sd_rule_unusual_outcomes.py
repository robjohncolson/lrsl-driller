"""
The 2-SD Rule: Identifying Unusual Outcomes

Render command:
    manim -qm --format=mp4 two_sd_rule_unusual_outcomes.py TwoSDRuleUnusualOutcomes

This animation demonstrates the 2-SD rule for identifying unusual outcomes
in a binomial distribution. Uses n=100, p=0.3 as the example.
"""

from manim import *
import numpy as np
from scipy.stats import binom


class TwoSDRuleUnusualOutcomes(Scene):
    def construct(self):
        # Parameters for binomial distribution
        n = 100
        p = 0.3
        mu = n * p  # 30
        sigma = np.sqrt(n * p * (1 - p))  # approximately 4.58

        # Title
        title = Text("The 2-SD Rule: Identifying Unusual Outcomes", font_size=36)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # Show the parameters
        params_text = MathTex(
            r"n = 100, \quad p = 0.3",
            font_size=32
        ).next_to(title, DOWN, buff=0.3)
        self.play(FadeIn(params_text))
        self.wait(0.5)

        # Calculate mean and standard deviation display
        mu_formula = MathTex(
            r"\mu = np = 100 \times 0.3 = 30",
            font_size=28
        )
        sigma_formula = MathTex(
            r"\sigma = \sqrt{np(1-p)} = \sqrt{100 \times 0.3 \times 0.7} \approx 4.58",
            font_size=28
        )
        formulas = VGroup(mu_formula, sigma_formula).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        formulas.next_to(params_text, DOWN, buff=0.3)

        self.play(Write(mu_formula))
        self.wait(0.3)
        self.play(Write(sigma_formula))
        self.wait(0.5)

        # Move formulas to the side and create histogram
        self.play(
            FadeOut(params_text),
            formulas.animate.scale(0.7).to_corner(UL, buff=0.5).shift(DOWN * 0.8)
        )

        # Create histogram data
        x_values = np.arange(10, 51)  # Show range from 10 to 50
        y_values = [binom.pmf(x, n, p) for x in x_values]
        max_y = max(y_values)

        # Normalize heights for display
        bar_width = 0.15
        max_bar_height = 3.0

        # Create axes
        axes = Axes(
            x_range=[10, 50, 5],
            y_range=[0, 0.1, 0.02],
            x_length=10,
            y_length=3,
            axis_config={"include_numbers": True, "font_size": 20},
            x_axis_config={"numbers_to_include": [10, 15, 20, 25, 30, 35, 40, 45, 50]},
            y_axis_config={"numbers_to_include": [0, 0.02, 0.04, 0.06, 0.08]},
        ).shift(DOWN * 0.8)

        x_label = Text("Number of Successes", font_size=20).next_to(axes.x_axis, DOWN, buff=0.3)
        y_label = Text("Probability", font_size=20).next_to(axes.y_axis, LEFT, buff=0.3).rotate(90 * DEGREES)

        self.play(Create(axes), Write(x_label), Write(y_label))
        self.wait(0.3)

        # Calculate boundaries
        lower_bound = mu - 2 * sigma  # approximately 20.84
        upper_bound = mu + 2 * sigma  # approximately 39.16

        # Create bars with appropriate colors
        bars = VGroup()
        for x in x_values:
            prob = binom.pmf(x, n, p)
            bar_height = prob * (max_bar_height / 0.09)  # Scale to fit

            # Determine color based on position
            if x < lower_bound or x > upper_bound:
                color = RED
            else:
                color = GREEN

            bar = Rectangle(
                width=bar_width,
                height=max(bar_height, 0.01),
                fill_color=color,
                fill_opacity=0.7,
                stroke_color=WHITE,
                stroke_width=0.5
            )
            bar.move_to(axes.c2p(x, prob / 2))
            bars.add(bar)

        self.play(LaggedStart(*[GrowFromEdge(bar, DOWN) for bar in bars], lag_ratio=0.02))
        self.wait(0.5)

        # Add mean line
        mean_line = DashedLine(
            axes.c2p(mu, 0),
            axes.c2p(mu, 0.095),
            color=BLUE,
            stroke_width=3
        )
        mean_label = MathTex(r"\mu = 30", font_size=24, color=BLUE)
        mean_label.next_to(mean_line, UP, buff=0.1)

        self.play(Create(mean_line), Write(mean_label))
        self.wait(0.5)

        # Add boundary lines
        lower_line = DashedLine(
            axes.c2p(lower_bound, 0),
            axes.c2p(lower_bound, 0.08),
            color=YELLOW,
            stroke_width=2
        )
        upper_line = DashedLine(
            axes.c2p(upper_bound, 0),
            axes.c2p(upper_bound, 0.08),
            color=YELLOW,
            stroke_width=2
        )

        lower_label = MathTex(r"\mu - 2\sigma", font_size=20, color=YELLOW)
        lower_label.next_to(lower_line, DOWN, buff=0.1)
        lower_value = MathTex(r"\approx 21", font_size=18, color=YELLOW)
        lower_value.next_to(lower_label, DOWN, buff=0.05)

        upper_label = MathTex(r"\mu + 2\sigma", font_size=20, color=YELLOW)
        upper_label.next_to(upper_line, DOWN, buff=0.1)
        upper_value = MathTex(r"\approx 39", font_size=18, color=YELLOW)
        upper_value.next_to(upper_label, DOWN, buff=0.05)

        self.play(
            Create(lower_line), Create(upper_line),
            Write(lower_label), Write(upper_label),
            Write(lower_value), Write(upper_value)
        )
        self.wait(0.5)

        # Add zone labels
        typical_label = Text("TYPICAL", font_size=20, color=GREEN, weight=BOLD)
        typical_label.move_to(axes.c2p(30, 0.07))

        unusual_left = Text("UNUSUAL", font_size=16, color=RED, weight=BOLD)
        unusual_left.move_to(axes.c2p(15, 0.03))

        unusual_right = Text("UNUSUAL", font_size=16, color=RED, weight=BOLD)
        unusual_right.move_to(axes.c2p(45, 0.03))

        self.play(
            Write(typical_label),
            Write(unusual_left),
            Write(unusual_right)
        )
        self.wait(0.5)

        # Key insight
        insight_box = Rectangle(
            width=8,
            height=0.6,
            fill_color=BLUE_E,
            fill_opacity=0.3,
            stroke_color=BLUE
        ).to_edge(DOWN, buff=0.5)

        insight_text = Text(
            "About 95% of outcomes fall within μ ± 2σ",
            font_size=24,
            color=WHITE
        ).move_to(insight_box)

        self.play(Create(insight_box), Write(insight_text))
        self.wait(1)

        # Highlight example unusual outcomes
        example_text = Text(
            "Examples: 15 or 45 successes would be unusual!",
            font_size=22,
            color=RED
        ).next_to(insight_box, UP, buff=0.2)

        self.play(Write(example_text))
        self.wait(1)

        # Clear for final rule
        self.play(
            FadeOut(example_text),
            FadeOut(insight_box),
            FadeOut(insight_text)
        )

        # Final rule box
        rule_box = Rectangle(
            width=10,
            height=1.2,
            fill_color=GOLD_E,
            fill_opacity=0.2,
            stroke_color=GOLD,
            stroke_width=3
        ).to_edge(DOWN, buff=0.3)

        rule_title = Text("The 2-SD Rule", font_size=24, color=GOLD, weight=BOLD)
        rule_formula = MathTex(
            r"\text{Unusual if: } \quad \text{outcome} < \mu - 2\sigma \quad \text{or} \quad \text{outcome} > \mu + 2\sigma",
            font_size=26
        )
        rule_group = VGroup(rule_title, rule_formula).arrange(DOWN, buff=0.15)
        rule_group.move_to(rule_box)

        self.play(Create(rule_box))
        self.play(Write(rule_title))
        self.play(Write(rule_formula))
        self.wait(2)

        # Final pause
        self.wait(1)
