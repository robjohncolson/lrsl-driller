"""
Compare chi-square test for homogeneity vs independence side by side.

Render:
manim -qm --format=mp4 animations/apstat_85_homogeneity_vs_independence.py HomogeneityVsIndependence
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class HomogeneityVsIndependence(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Homogeneity vs Independence", font_size=38, weight=BOLD)
        title.to_edge(UP, buff=0.35)
        subtitle = Text(
            "Two tests, same math, different designs",
            font_size=22,
            color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.16)

        # --- Left panel: Homogeneity ---
        left_panel = RoundedRectangle(
            corner_radius=0.2, width=5.6, height=4.8,
            stroke_color=BLUE_3B1B, stroke_width=3,
        )
        left_panel.set_fill(BLUE_3B1B, opacity=0.06)
        left_panel.shift(LEFT * 3.3 + DOWN * 0.65)

        left_title = Text("Homogeneity", font_size=30, color=BLUE_3B1B, weight=BOLD)
        left_title.move_to(left_panel.get_top() + DOWN * 0.35)

        left_lines = VGroup(
            Text("Multiple populations", font_size=24, color=WHITE),
            Text("One categorical variable", font_size=24, color=WHITE),
            Text("Compare distributions", font_size=24, color=WHITE),
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT)
        left_lines.next_to(left_title, DOWN, buff=0.35).shift(LEFT * 0.3)

        left_sample_label = Text(
            "Separate random samples",
            font_size=22, color=TEAL_3B1B, weight=BOLD,
        )
        left_sample_label.next_to(left_lines, DOWN, buff=0.35)

        # icons: three small groups representing separate populations
        pop_colors = [BLUE_3B1B, YELLOW_3B1B, PINK_3B1B]
        pop_icons = VGroup()
        for i, col in enumerate(pop_colors):
            dot_group = VGroup()
            for j in range(3):
                d = Dot(radius=0.08, color=col)
                d.shift(RIGHT * j * 0.25)
                dot_group.add(d)
            pop_label = Text(f"Pop {i+1}", font_size=18, color=col)
            pop_label.next_to(dot_group, DOWN, buff=0.1)
            pop_icons.add(VGroup(dot_group, pop_label))
        pop_icons.arrange(RIGHT, buff=0.55)
        pop_icons.next_to(left_sample_label, DOWN, buff=0.3)

        # --- Right panel: Independence ---
        right_panel = RoundedRectangle(
            corner_radius=0.2, width=5.6, height=4.8,
            stroke_color=GREEN_3B1B, stroke_width=3,
        )
        right_panel.set_fill(GREEN_3B1B, opacity=0.06)
        right_panel.shift(RIGHT * 3.3 + DOWN * 0.65)

        right_title = Text("Independence", font_size=30, color=GREEN_3B1B, weight=BOLD)
        right_title.move_to(right_panel.get_top() + DOWN * 0.35)

        right_lines = VGroup(
            Text("One population", font_size=24, color=WHITE),
            Text("Two categorical variables", font_size=24, color=WHITE),
            Text("Test for association", font_size=24, color=WHITE),
        ).arrange(DOWN, buff=0.22, aligned_edge=LEFT)
        right_lines.next_to(right_title, DOWN, buff=0.35).shift(LEFT * 0.3)

        right_sample_label = Text(
            "Single random sample",
            font_size=22, color=TEAL_3B1B, weight=BOLD,
        )
        right_sample_label.next_to(right_lines, DOWN, buff=0.35)

        # icon: one group of mixed dots
        single_dots = VGroup()
        mixed_colors = [BLUE_3B1B, GREEN_3B1B, YELLOW_3B1B, PINK_3B1B,
                        BLUE_3B1B, GREEN_3B1B, YELLOW_3B1B, PINK_3B1B, TEAL_3B1B]
        positions = [
            (-0.4, 0.15), (-0.15, -0.1), (0.1, 0.2), (0.35, -0.05),
            (-0.3, -0.25), (0.0, 0.0), (0.25, -0.2), (-0.1, 0.3), (0.4, 0.15),
        ]
        for pos, col in zip(positions, mixed_colors):
            d = Dot(radius=0.08, color=col)
            d.shift(RIGHT * pos[0] + UP * pos[1])
            single_dots.add(d)
        single_pop_label = Text("1 Population", font_size=18, color=TEAL_3B1B)
        single_pop_group = VGroup(single_dots, single_pop_label).arrange(DOWN, buff=0.12)
        single_pop_group.next_to(right_sample_label, DOWN, buff=0.3)

        # --- VS divider ---
        vs_text = Text("VS", font_size=34, color=GRAY_B, weight=BOLD)
        vs_text.move_to(DOWN * 0.65)

        # --- animations ---
        self.play(Write(title), FadeIn(subtitle, shift=UP * 0.2), run_time=1.0)
        self.play(
            DrawBorderThenFill(left_panel),
            DrawBorderThenFill(right_panel),
            FadeIn(vs_text, scale=1.3),
            run_time=1.0,
        )
        self.play(
            Write(left_title), Write(right_title),
            run_time=0.8,
        )
        self.play(
            LaggedStart(
                FadeIn(left_lines[0], shift=RIGHT * 0.15),
                FadeIn(right_lines[0], shift=LEFT * 0.15),
                lag_ratio=0.2, run_time=1.0,
            )
        )
        self.play(
            LaggedStart(
                FadeIn(left_lines[1], shift=RIGHT * 0.15),
                FadeIn(right_lines[1], shift=LEFT * 0.15),
                lag_ratio=0.2, run_time=1.0,
            )
        )
        self.play(
            LaggedStart(
                FadeIn(left_lines[2], shift=RIGHT * 0.15),
                FadeIn(right_lines[2], shift=LEFT * 0.15),
                lag_ratio=0.2, run_time=1.0,
            )
        )
        self.play(
            FadeIn(left_sample_label, shift=UP * 0.1),
            FadeIn(right_sample_label, shift=UP * 0.1),
            run_time=0.8,
        )
        self.play(
            FadeIn(pop_icons, shift=UP * 0.1),
            FadeIn(single_pop_group, shift=UP * 0.1),
            run_time=1.2,
        )
        self.wait(1.8)
