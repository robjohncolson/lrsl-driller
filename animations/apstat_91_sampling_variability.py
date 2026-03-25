"""
Show that different random samples produce different regression slopes,
then begin building a sampling distribution on a number line.

Render:
manim -qm --format=mp4 animations/apstat_91_sampling_variability.py SamplingVariability
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"

SAMPLE_COLORS = [BLUE_3B1B, GREEN_3B1B, PINK_3B1B]
SAMPLE_SLOPES = [14.46, 11.97, 12.85]


class SamplingVariability(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Sampling Variability of Slopes", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Different samples give different slopes",
            font_size=22, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Axes for the scatter region (top half) ---
        ax_origin = UP * 0.3

        # A simple bounding box to represent the scatterplot area
        scatter_box = Rectangle(
            width=8.0, height=3.2,
            stroke_color=GRAY_C, stroke_width=1,
        )
        scatter_box.set_fill(WHITE, opacity=0.02)
        scatter_box.move_to(ax_origin)

        # Three sample regression lines at different slopes
        # Map slope value to visual angle (centered at pop slope ~13.3)
        def slope_to_line(slope, color):
            # Normalise: 13.3 is horizontal center; +-3 maps to visual rise
            rise = (slope - 13.3) / 3.0 * 1.2
            line = Line(
                ax_origin + LEFT * 3.5 + DOWN * rise,
                ax_origin + RIGHT * 3.5 + UP * rise,
                color=color, stroke_width=3.5,
            )
            return line

        sample_lines = []
        sample_labels = []
        for i, (slope, col) in enumerate(zip(SAMPLE_SLOPES, SAMPLE_COLORS)):
            line = slope_to_line(slope, col)
            label = Text(
                f"Sample {i+1}: b\u2081 = {slope}",
                font_size=22, color=col,
            )
            label.next_to(line.get_end(), RIGHT, buff=0.15).shift(DOWN * 0.15 * i)
            sample_lines.append(line)
            sample_labels.append(label)

        # --- Number line (bottom) for sampling distribution dots ---
        nl_center = DOWN * 2.4
        nl = NumberLine(
            x_range=[10, 17, 1],
            length=9.0,
            include_numbers=True,
            font_size=20,
            color=GRAY_B,
        )
        nl.move_to(nl_center)

        nl_title = Text(
            "Sampling Distribution of b\u2081",
            font_size=22, color=TEAL_3B1B, weight=BOLD,
        )
        nl_title.next_to(nl, UP, buff=0.2)

        # Dots on the number line for each slope
        nl_dots = []
        for slope, col in zip(SAMPLE_SLOPES, SAMPLE_COLORS):
            dot = Dot(
                point=nl.n2p(slope) + UP * 0.15,
                radius=0.09, color=col,
            )
            nl_dots.append(dot)

        # --- Animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(FadeIn(scatter_box), run_time=0.5)

        # Draw each sample line one at a time
        for line, label in zip(sample_lines, sample_labels):
            self.play(Create(line), FadeIn(label, shift=LEFT * 0.2), run_time=1.0)

        # Show the number line
        self.play(Create(nl), Write(nl_title), run_time=0.8)

        # Drop dots onto number line
        for dot in nl_dots:
            self.play(FadeIn(dot, shift=DOWN * 0.3), run_time=0.4)

        # Callout
        callout = Text(
            "Each sample slope is different — this is expected!",
            font_size=24, color=YELLOW_3B1B,
        )
        callout.to_edge(DOWN, buff=0.3)
        self.play(FadeIn(callout, shift=UP * 0.2), run_time=0.8)
        self.wait(1.8)
