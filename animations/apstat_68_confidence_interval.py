"""
Build a confidence interval for the difference in two proportions on a number line.

Run with: manim -qm --format=mp4 animations/apstat_68_confidence_interval.py TwoPropConfidenceInterval
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoPropConfidenceInterval(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Confidence Interval for p1 - p2", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text("Point estimate +/- margin of error", font_size=24, color=GREY_B)
        subtitle.next_to(title, DOWN, buff=0.2)

        line = Line(LEFT * 5.3, RIGHT * 5.3, color=GREY_B).shift(DOWN * 0.4)
        tick_positions = [(-0.35, "-0.35"), (-0.29, "-0.291"), (-0.16, "-0.163"), (-0.03, "-0.034"), (0.05, "0.05")]
        ticks = VGroup()
        labels = VGroup()
        for value, label in tick_positions:
            x = np.interp(value, [-0.35, 0.05], [line.get_left()[0], line.get_right()[0]])
            tick = Line([x, -0.55, 0], [x, -0.25, 0], color=GREY_B)
            txt = Text(label, font_size=18, color=GREY_B)
            txt.next_to(tick, DOWN, buff=0.1)
            ticks.add(tick)
            labels.add(txt)

        left_x = np.interp(-0.2907, [-0.35, 0.05], [line.get_left()[0], line.get_right()[0]])
        center_x = np.interp(-0.1625, [-0.35, 0.05], [line.get_left()[0], line.get_right()[0]])
        right_x = np.interp(-0.0343, [-0.35, 0.05], [line.get_left()[0], line.get_right()[0]])

        interval = Line([left_x, -0.4, 0], [right_x, -0.4, 0], color=YELLOW_3B1B, stroke_width=10)
        left_dot = Dot([left_x, -0.4, 0], color=BLUE_3B1B, radius=0.08)
        center_dot = Dot([center_x, -0.4, 0], color=PINK_3B1B, radius=0.09)
        right_dot = Dot([right_x, -0.4, 0], color=BLUE_3B1B, radius=0.08)

        center_label = Text("point estimate = -0.1625", font_size=24, color=PINK_3B1B, weight=BOLD)
        center_label.next_to(center_dot, UP, buff=0.4)

        left_me = Arrow(center_dot.get_center(), left_dot.get_center(), buff=0.08, color=TEAL_3B1B)
        right_me = Arrow(center_dot.get_center(), right_dot.get_center(), buff=0.08, color=TEAL_3B1B)
        me_label = Text("ME = 0.1282", font_size=24, color=TEAL_3B1B, weight=BOLD)
        me_label.shift(DOWN * 1.55)

        final_text = Text("Interval: (-0.2907, -0.0343)", font_size=30, color=GREEN_3B1B, weight=BOLD)
        final_text.next_to(me_label, DOWN, buff=0.4)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.15))
        self.wait(0.3)
        self.play(Create(line), LaggedStart(*[Create(tick) for tick in ticks], lag_ratio=0.1), LaggedStart(*[Write(label) for label in labels], lag_ratio=0.1), run_time=1.2)
        self.play(FadeIn(center_dot, scale=0.8), Write(center_label), run_time=0.8)
        self.wait(0.4)
        self.play(Create(left_me), Create(right_me), FadeIn(me_label, shift=UP * 0.15), run_time=0.9)
        self.play(Create(interval), FadeIn(left_dot, scale=0.8), FadeIn(right_dot, scale=0.8), run_time=0.8)
        self.play(Write(final_text), run_time=0.7)
        self.wait(2.4)
