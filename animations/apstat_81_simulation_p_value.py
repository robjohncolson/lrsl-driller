"""
Interpret simulation-based p-values for surprise.

Render:
manim -qm --format=mp4 animations/apstat_81_simulation_p_value.py SimulationPValueInterpretation
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


def build_dot_grid(highlight_count, title_text, conclusion_text, accent_color):
    dots = VGroup()
    for i in range(20):
        dot = Dot(radius=0.11, color=accent_color if i < highlight_count else BLUE_3B1B)
        dot.set_opacity(1 if i < highlight_count else 0.5)
        dots.add(dot)
    dots.arrange_in_grid(rows=4, cols=5, buff=(0.18, 0.18))

    title = Text(title_text, font_size=22, color=accent_color, weight=BOLD)
    title.next_to(dots, UP, buff=0.22)
    line1 = Text("Dots at or above observed", font_size=18, color=YELLOW_3B1B)
    line1.next_to(dots, DOWN, buff=0.18)
    line2 = Text(conclusion_text, font_size=19, color=WHITE)
    line2.next_to(line1, DOWN, buff=0.12)

    frame = RoundedRectangle(
        corner_radius=0.2,
        width=4.9,
        height=4.4,
        stroke_color=accent_color,
        stroke_width=4,
    )
    frame.set_fill(accent_color, opacity=0.1)
    content = VGroup(title, dots, line1, line2)
    content.move_to(frame.get_center())
    dots.shift(UP * 0.15)
    line1.shift(DOWN * 0.12)
    line2.shift(DOWN * 0.18)

    return VGroup(frame, content), dots


class SimulationPValueInterpretation(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Use the Simulation to Judge Surprise", font_size=36, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        subtitle = Text(
            "Count how many simulated chi-square values are at least as large as the observed one",
            font_size=23,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.18)

        common_panel, common_dots = build_dot_grid(
            18,
            "Many simulated values",
            "Result is not unexpected",
            GREEN_3B1B,
        )
        common_panel.shift(LEFT * 3.15 + DOWN * 0.55)

        rare_panel, rare_dots = build_dot_grid(
            1,
            "Very few simulated values",
            "Result is unexpected",
            PINK_3B1B,
        )
        rare_panel.shift(RIGHT * 3.15 + DOWN * 0.55)

        middle_text = Text("Observed χ² is the cutoff", font_size=22, color=TEAL_3B1B, weight=BOLD)
        middle_text.move_to(DOWN * 2.95)

        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.5)
        self.play(FadeIn(common_panel), FadeIn(rare_panel), run_time=1.4)
        self.play(
            LaggedStart(*[FadeIn(dot, scale=0.6) for dot in common_dots], lag_ratio=0.04),
            LaggedStart(*[FadeIn(dot, scale=0.6) for dot in rare_dots], lag_ratio=0.04),
            run_time=2.2,
        )
        self.play(Write(middle_text), run_time=1.0)
        self.wait(2.0)
