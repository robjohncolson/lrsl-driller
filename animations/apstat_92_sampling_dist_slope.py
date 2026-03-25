"""
Sampling Distribution of the Slope b1 (AP Stats Unit 9, Topic 9.2)

Shows a bell curve centered at beta_1 representing the sampling distribution
of b1. Labels center and standard deviation. Demonstrates that larger n
makes the distribution narrower.

Run with: manim -qm --format=mp4 apstat_92_sampling_dist_slope.py SamplingDistSlope
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class SamplingDistSlope(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Sampling Distribution of b\u2081", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "What does the distribution of sample slopes look like?",
            font_size=22, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== PROPERTIES ==========
        props = VGroup(
            Text("When conditions are met:", font_size=24, color=GRAY_A),
            Text("", font_size=4),
            Text("Center:  \u03b2\u2081 (the true population slope)", font_size=26, color=ManimColor(BLUE_3B1B)),
            Text("Shape:   Approximately Normal", font_size=26, color=ManimColor(GREEN_3B1B)),
            Text("SD:        \u03c3 / (s\u2093 \u00d7 \u221a(n\u22121))", font_size=26, color=ManimColor(YELLOW_3B1B)),
        ).arrange(DOWN, buff=0.15, aligned_edge=LEFT)
        props.next_to(subtitle, DOWN, buff=0.35)
        props.shift(LEFT * 1.5)

        self.play(
            LaggedStart(
                *[Write(p) for p in props],
                lag_ratio=0.25,
            ),
            run_time=2.0,
        )
        self.wait(0.8)

        # ========== TRANSITION ==========
        self.play(FadeOut(props), FadeOut(subtitle), run_time=0.5)

        # ========== BELL CURVE ==========
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.45, 0.1],
            x_length=8,
            y_length=3,
            tips=False,
            axis_config={"include_ticks": False, "stroke_width": 2},
        )
        axes.shift(DOWN * 0.5)

        def normal_pdf(x):
            return (1 / np.sqrt(2 * np.pi)) * np.exp(-0.5 * x ** 2)

        curve = axes.plot(normal_pdf, x_range=[-3.5, 3.5], color=BLUE_3B1B, stroke_width=3)
        area = axes.get_area(curve, x_range=[-3.5, 3.5], color=BLUE_3B1B, opacity=0.2)

        self.play(Create(axes), run_time=0.5)
        self.play(Create(curve), FadeIn(area), run_time=1.0)

        # Center label
        center_dot = Dot(axes.c2p(0, 0), color=YELLOW_3B1B, radius=0.08)
        center_label = Text("\u03b2\u2081", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        center_label.next_to(center_dot, DOWN, buff=0.2)

        self.play(FadeIn(center_dot, scale=1.5), Write(center_label), run_time=0.5)

        # SD arrows
        sd_left = axes.c2p(-1, 0)
        sd_right = axes.c2p(1, 0)
        sd_arrow = DoubleArrow(sd_left, sd_right, color=PINK_3B1B, stroke_width=3, buff=0)
        sd_arrow.shift(DOWN * 0.15)
        sd_text = Text("\u03c3 / (s\u2093\u221a(n\u22121))", font_size=20, color=PINK_3B1B)
        sd_text.next_to(sd_arrow, DOWN, buff=0.15)

        self.play(Create(sd_arrow), Write(sd_text), run_time=0.6)
        self.wait(0.8)

        # ========== EFFECT OF SAMPLE SIZE ==========
        effect_title = Text("Effect of Increasing n", font_size=28, weight=BOLD, color=TEAL_3B1B)
        effect_title.to_edge(UP, buff=0.3)
        self.play(
            ReplacementTransform(title, effect_title),
            FadeOut(sd_arrow), FadeOut(sd_text), FadeOut(center_dot), FadeOut(center_label),
            run_time=0.6,
        )

        # Narrow curve (larger n)
        def narrow_pdf(x):
            sigma = 0.5
            return (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * (x / sigma) ** 2)

        curve_narrow = axes.plot(narrow_pdf, x_range=[-3.5, 3.5], color=GREEN_3B1B, stroke_width=3)
        area_narrow = axes.get_area(curve_narrow, x_range=[-3.5, 3.5], color=GREEN_3B1B, opacity=0.15)

        # Labels
        label_small = Text("n = 20", font_size=22, color=ManimColor(BLUE_3B1B))
        label_small.move_to(axes.c2p(2.5, 0.15))
        label_large = Text("n = 100", font_size=22, color=ManimColor(GREEN_3B1B))
        label_large.move_to(axes.c2p(1.2, 0.42))

        self.play(Write(label_small), run_time=0.3)
        self.play(
            Create(curve_narrow), FadeIn(area_narrow),
            Write(label_large),
            run_time=1.0,
        )

        # Restore center label
        center_dot2 = Dot(axes.c2p(0, 0), color=YELLOW_3B1B, radius=0.08)
        center_label2 = Text("\u03b2\u2081", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        center_label2.next_to(center_dot2, DOWN, buff=0.2)
        self.play(FadeIn(center_dot2), Write(center_label2), run_time=0.3)

        insight = Text(
            "Larger n  \u2192  narrower distribution  \u2192  more precise estimate of \u03b2\u2081",
            font_size=22, color=YELLOW_3B1B,
        )
        insight.to_edge(DOWN, buff=0.4)
        self.play(Write(insight), run_time=0.8)
        self.wait(0.8)

        # ========== KEY INSIGHT BOX ==========
        everything = VGroup(
            effect_title, axes, curve, area, curve_narrow, area_narrow,
            label_small, label_large, center_dot2, center_label2, insight,
        )
        self.play(FadeOut(everything), run_time=0.5)

        box_items = VGroup(
            Text("Sampling Distribution of b\u2081", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=6),
            Text("Center = \u03b2\u2081  (unbiased)", font_size=24, color=ManimColor(BLUE_3B1B)),
            Text("Shape = approximately Normal", font_size=24, color=ManimColor(GREEN_3B1B)),
            Text("SD = \u03c3 / (s\u2093 \u00d7 \u221a(n\u22121))", font_size=24, color=ManimColor(YELLOW_3B1B)),
            Text("", font_size=6),
            Text("Larger n or larger spread in x", font_size=22),
            Text("\u2192 smaller SD \u2192 more precise b\u2081", font_size=22, color=TEAL_3B1B),
        ).arrange(DOWN, buff=0.12)
        box_items.move_to(ORIGIN)

        box = SurroundingRectangle(box_items, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15)

        self.play(
            LaggedStart(*[Write(line) for line in box_items], lag_ratio=0.18),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(1.8)
