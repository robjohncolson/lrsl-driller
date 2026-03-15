"""
Match the alternative hypothesis to the correct p-value region.

Render:
manim -qm --format=mp4 animations/apstat_79_identify_p_value_region.py MeanDiffTestPValueRegion
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanDiffTestPValueRegion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Pick the Right Tail Area", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "The alternative hypothesis tells you where the p-value lives",
            font_size=24,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        panels = VGroup()
        panel_specs = [
            ("Hₐ: μ1 - μ2 > 0", BLUE_3B1B, "right tail", RIGHT * 0.9),
            ("Hₐ: μ1 - μ2 < 0", TEAL_3B1B, "left tail", LEFT * 0.9),
            ("Hₐ: μ1 - μ2 ≠ 0", PINK_3B1B, "both tails", ORIGIN),
        ]

        for label_text, color, region_text, marker_shift in panel_specs:
            box = RoundedRectangle(
                corner_radius=0.18,
                width=3.55,
                height=4.9,
                stroke_color=color,
                stroke_width=4,
            )
            box.set_fill(color, opacity=0.10)

            label = Text(label_text, font_size=23, color=color, weight=BOLD)
            label.move_to(box.get_top() + DOWN * 0.45)

            baseline = Line(LEFT * 1.1, RIGHT * 1.1, color=GRAY_B, stroke_width=4)
            baseline.move_to(box.get_center() + DOWN * 0.65)

            curve = ParametricFunction(
                lambda t: np.array([t, 0.8 * np.exp(-1.8 * t * t), 0]),
                t_range=[-1.2, 1.2],
                color=WHITE,
                stroke_width=5,
            )
            curve.move_to(baseline.get_center() + UP * 0.25)

            marker = Line(UP * 0.85, DOWN * 0.05, color=YELLOW_3B1B, stroke_width=6)
            marker.move_to(curve.get_center() + marker_shift + DOWN * 0.1)

            if region_text == "both tails":
                shade = VGroup(
                    Rectangle(width=0.65, height=1.0, stroke_width=0, fill_color=color, fill_opacity=0.35),
                    Rectangle(width=0.65, height=1.0, stroke_width=0, fill_color=color, fill_opacity=0.35),
                )
                shade[0].move_to(curve.get_center() + LEFT * 1.05 + DOWN * 0.1)
                shade[1].move_to(curve.get_center() + RIGHT * 1.05 + DOWN * 0.1)
            else:
                shade = Rectangle(width=0.8, height=1.0, stroke_width=0, fill_color=color, fill_opacity=0.35)
                shade.move_to(curve.get_center() + marker_shift + DOWN * 0.1)

            region = Text(region_text, font_size=22, weight=BOLD)
            region.move_to(box.get_bottom() + UP * 0.52)

            panels.add(VGroup(box, label, baseline, curve, shade, marker, region))

        panels.arrange(RIGHT, buff=0.28)
        panels.shift(DOWN * 0.55)

        footer_box = RoundedRectangle(
            corner_radius=0.18,
            width=10.9,
            height=1.2,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        footer_box.set_fill(GREEN_3B1B, opacity=0.12)
        footer_box.to_edge(DOWN, buff=0.35)
        footer = Text(
            "Direction decides the tail. No direction means use both tails.",
            font_size=24,
            color=GREEN_3B1B,
            weight=BOLD,
        )
        footer.move_to(footer_box.get_center())

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2))
        self.wait(0.6)
        self.play(LaggedStart(*[FadeIn(panel[0], shift=UP * 0.2) for panel in panels], lag_ratio=0.18))
        self.play(LaggedStart(*[Write(panel[1]) for panel in panels], lag_ratio=0.15))
        self.play(LaggedStart(*[Create(panel[2]) for panel in panels], lag_ratio=0.12))
        self.play(LaggedStart(*[Create(panel[3]) for panel in panels], lag_ratio=0.12))
        self.play(LaggedStart(*[FadeIn(panel[4]) for panel in panels], lag_ratio=0.15))
        self.play(LaggedStart(*[Create(panel[5]) for panel in panels], lag_ratio=0.15))
        self.play(LaggedStart(*[Write(panel[6]) for panel in panels], lag_ratio=0.15))
        self.wait(1.0)
        self.play(FadeIn(footer_box, shift=UP * 0.2), Write(footer))
        self.wait(2)
