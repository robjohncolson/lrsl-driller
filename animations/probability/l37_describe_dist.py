"""
Manim animation for Lesson 37: Describing a Probability Distribution

Shows how to describe distributions using shape, center, and spread.

To render:
manim -qm --format=mp4 l37_describe_dist.py DescribeDistribution
"""

from manim import *
import numpy as np

class DescribeDistribution(Scene):
    def construct(self):
        # Title
        title = Text("Describing a Probability Distribution", font_size=36)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Show example distribution (symmetric)
        values = [1, 2, 3, 4, 5, 6]
        probs = [0.05, 0.2, 0.35, 0.25, 0.12, 0.03]

        chart = self.create_bar_chart(values, probs, position=UP*0.5)
        self.play(Create(chart))
        self.wait(0.5)

        # Three characteristics
        characteristics = VGroup(
            Text("1. SHAPE", font_size=28, color=BLUE),
            Text("2. CENTER", font_size=28, color=GREEN),
            Text("3. SPREAD", font_size=28, color=ORANGE)
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        characteristics.to_edge(LEFT).shift(DOWN*1.5)

        self.play(FadeIn(characteristics[0]))
        self.wait(0.5)

        # SHAPE: Show different shape types
        self.play(FadeOut(chart))

        # Symmetric
        shape_label = Text("Symmetric", font_size=24, color=BLUE)
        shape_label.next_to(characteristics[0], RIGHT, buff=1.5).shift(UP*0.5)
        sym_chart = self.create_mini_symmetric_chart()
        sym_chart.next_to(shape_label, DOWN, buff=0.2)
        self.play(Write(shape_label), Create(sym_chart))
        self.wait(0.8)

        # Skewed right
        skew_right_label = Text("Skewed Right", font_size=24, color=BLUE)
        skew_right_label.next_to(sym_chart, DOWN, buff=0.4)
        skew_right_chart = self.create_mini_skewed_right_chart()
        skew_right_chart.next_to(skew_right_label, DOWN, buff=0.2)
        self.play(
            FadeOut(shape_label, sym_chart),
            Write(skew_right_label),
            Create(skew_right_chart)
        )
        self.wait(0.8)

        # Clear shapes and move to CENTER
        self.play(
            FadeOut(skew_right_label, skew_right_chart),
            FadeIn(characteristics[1])
        )
        self.wait(0.3)

        # Show distribution with center marked
        center_chart = self.create_bar_chart(values, probs, position=UP*0.5, scale=0.8)
        self.play(Create(center_chart))

        # Mark the mean
        mean_val = sum(v * p for v, p in zip(values, probs))
        mean_arrow = Arrow(
            start=UP*1.5 + RIGHT*0.5,
            end=UP*0.3 + RIGHT*0.5,
            color=GREEN,
            buff=0.1
        )
        mean_label = MathTex(r"\mu", color=GREEN, font_size=32)
        mean_label.next_to(mean_arrow, UP, buff=0.1)

        self.play(
            GrowArrow(mean_arrow),
            Write(mean_label)
        )
        self.wait(0.8)

        # Clear and move to SPREAD
        self.play(
            FadeOut(center_chart, mean_arrow, mean_label),
            FadeIn(characteristics[2])
        )
        self.wait(0.3)

        # Show distributions with different spreads
        spread_chart1 = self.create_narrow_spread_chart()
        spread_chart1.shift(UP*0.5)

        spread_label1 = Text("Small σ", font_size=24, color=ORANGE)
        spread_label1.next_to(spread_chart1, DOWN, buff=0.3)

        self.play(Create(spread_chart1), Write(spread_label1))
        self.wait(0.8)

        # Wide spread
        spread_chart2 = self.create_wide_spread_chart()
        spread_chart2.shift(UP*0.5)
        spread_label2 = Text("Large σ", font_size=24, color=ORANGE)
        spread_label2.next_to(spread_chart2, DOWN, buff=0.3)

        self.play(
            FadeOut(spread_chart1, spread_label1),
            Create(spread_chart2),
            Write(spread_label2)
        )
        self.wait(0.8)

        # Final insight
        self.play(
            FadeOut(spread_chart2, spread_label2, characteristics),
            title.animate.shift(UP*0.5).scale(0.8)
        )

        insight_box = Rectangle(
            width=10,
            height=2,
            color=YELLOW,
            fill_opacity=0.1
        )

        insight_text = VGroup(
            Text("Shape, Center, Spread", font_size=32, color=YELLOW, weight=BOLD),
            Text("Same as quantitative data!", font_size=26)
        ).arrange(DOWN, buff=0.3)

        insight_group = VGroup(insight_box, insight_text)
        insight_group.move_to(ORIGIN)

        self.play(
            Create(insight_box),
            Write(insight_text)
        )
        self.wait(1.5)

        self.play(FadeOut(insight_group, title))
        self.wait(0.3)

    def create_bar_chart(self, values, probs, position=ORIGIN, scale=1.0):
        """Create a bar chart for a probability distribution"""
        bars = VGroup()
        max_height = 2.0 * scale
        bar_width = 0.4 * scale
        spacing = 0.6 * scale

        # Normalize heights
        max_prob = max(probs)

        for i, (val, prob) in enumerate(zip(values, probs)):
            height = (prob / max_prob) * max_height
            bar = Rectangle(
                width=bar_width,
                height=height,
                color=BLUE,
                fill_opacity=0.7
            )
            bar.move_to(position + RIGHT * (i - len(values)/2 + 0.5) * spacing + DOWN * (max_height - height) / 2)
            bars.add(bar)

        return bars

    def create_mini_symmetric_chart(self):
        """Create small symmetric distribution"""
        probs = [0.1, 0.2, 0.4, 0.2, 0.1]
        bars = VGroup()
        max_height = 1.0
        bar_width = 0.25

        for i, prob in enumerate(probs):
            height = prob * 2.5
            bar = Rectangle(
                width=bar_width,
                height=height,
                color=BLUE,
                fill_opacity=0.6
            )
            bar.move_to(RIGHT * (i - 2) * 0.35 + DOWN * (max_height - height) / 2)
            bars.add(bar)

        bars.shift(RIGHT*2 + UP*0.3)
        return bars

    def create_mini_skewed_right_chart(self):
        """Create small right-skewed distribution"""
        probs = [0.4, 0.3, 0.15, 0.1, 0.05]
        bars = VGroup()
        max_height = 1.0
        bar_width = 0.25

        for i, prob in enumerate(probs):
            height = prob * 2.5
            bar = Rectangle(
                width=bar_width,
                height=height,
                color=BLUE,
                fill_opacity=0.6
            )
            bar.move_to(RIGHT * (i - 2) * 0.35 + DOWN * (max_height - height) / 2)
            bars.add(bar)

        bars.shift(RIGHT*2 + UP*0.3)
        return bars

    def create_narrow_spread_chart(self):
        """Create distribution with small spread"""
        probs = [0.05, 0.15, 0.6, 0.15, 0.05]
        bars = VGroup()
        bar_width = 0.3

        for i, prob in enumerate(probs):
            height = prob * 2.0
            bar = Rectangle(
                width=bar_width,
                height=height,
                color=ORANGE,
                fill_opacity=0.6
            )
            bar.move_to(RIGHT * (i - 2) * 0.4 + DOWN * (1.2 - height) / 2)
            bars.add(bar)

        return bars

    def create_wide_spread_chart(self):
        """Create distribution with large spread"""
        probs = [0.15, 0.2, 0.3, 0.2, 0.15]
        bars = VGroup()
        bar_width = 0.3

        for i, prob in enumerate(probs):
            height = prob * 2.0
            bar = Rectangle(
                width=bar_width,
                height=height,
                color=ORANGE,
                fill_opacity=0.6
            )
            bar.move_to(RIGHT * (i - 2) * 0.4 + DOWN * (1.2 - height) / 2)
            bars.add(bar)

        return bars
