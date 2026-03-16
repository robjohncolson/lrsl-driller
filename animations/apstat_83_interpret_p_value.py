"""
Show that the p-value is the upper-tail probability for a chi-square GOF test.

Render:
manim -qm --format=mp4 animations/apstat_83_interpret_p_value.py ChiSquarePValueInterpretation
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ChiSquarePValueInterpretation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Interpret the P-value", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "For chi-square GOF, it is the area to the right of the test statistic",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        axis = Line(LEFT * 4.8, RIGHT * 4.8, color=GRAY_B, stroke_width=4)
        axis.shift(DOWN * 0.5)
        zero = Text("0", font_size=24, color=GRAY_C)
        zero.next_to(axis.get_start(), DOWN, buff=0.15)

        curve = VMobject(color=BLUE_3B1B, stroke_width=6)
        curve.set_points_smoothly(
            [
                axis.get_start() + UP * 0.05,
                LEFT * 3.5 + UP * 1.3 + DOWN * 0.5,
                LEFT * 2.0 + UP * 2.0 + DOWN * 0.5,
                ORIGIN + UP * 1.1 + DOWN * 0.5,
                RIGHT * 2.0 + UP * 0.35 + DOWN * 0.5,
                axis.get_end() + UP * 0.05,
            ]
        )

        threshold_x = RIGHT * 1.8 + DOWN * 0.5
        threshold = DashedLine(
            threshold_x + DOWN * 0.1,
            threshold_x + UP * 1.15,
            color=YELLOW_3B1B,
            stroke_width=4,
        )
        stat_label = Text("χ² = 7.746", font_size=26, color=YELLOW_3B1B, weight=BOLD)
        stat_label.next_to(threshold, DOWN, buff=0.22)

        tail = Polygon(
            threshold_x,
            threshold_x + UP * 0.55,
            RIGHT * 2.9 + UP * 0.18 + DOWN * 0.5,
            RIGHT * 4.8 + UP * 0.03 + DOWN * 0.5,
            RIGHT * 4.8 + DOWN * 0.5,
            threshold_x,
            color=PINK_3B1B,
            stroke_opacity=0,
            fill_opacity=0.3,
        )
        tail_text = Text("p-value", font_size=28, color=PINK_3B1B, weight=BOLD)
        tail_text.move_to(RIGHT * 3.2 + UP * 0.95)

        definition_box = RoundedRectangle(
            corner_radius=0.22,
            width=10.2,
            height=1.8,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        definition_box.set_fill(GREEN_3B1B, opacity=0.08)
        definition_box.to_edge(DOWN, buff=0.55)
        definition = Text(
            "Probability of getting a χ² value this large or larger\nby chance alone, assuming H₀ is true",
            font_size=25,
            color=WHITE,
            line_spacing=0.9,
        )
        definition.move_to(definition_box.get_center())

        arrow = Arrow(
            stat_label.get_top() + UP * 0.08,
            tail_text.get_bottom() + DOWN * 0.08,
            buff=0.15,
            color=TEAL_3B1B,
            stroke_width=5,
        )

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.2)
        self.play(Create(axis), FadeIn(zero), Create(curve), run_time=1.6)
        self.play(Create(threshold), FadeIn(stat_label, shift=UP * 0.2), run_time=1.0)
        self.play(FadeIn(tail), Write(tail_text), GrowArrow(arrow), run_time=1.4)
        self.play(DrawBorderThenFill(definition_box), Write(definition), run_time=1.7)
        self.wait(1.8)
