"""
Randomization P-Value (AP Stats Unit 5, Topic 5.3d)

Shows how to find and interpret a p-value from a randomization distribution.
Displays a completed randomization distribution (bell-shaped near 0), marks
the observed experimental result, shades the area at or beyond the observed
value, and calculates the proportion (p-value). The key insight: a small
p-value means the observed result is unlikely by chance, providing evidence
of a real effect.

Run with: manim -qm --format=mp4 apstat_53_randomization_pvalue.py RandomizationPValue
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class RandomizationPValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Finding the P-Value", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Using a Randomization Distribution",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.3)

        # ========== PART 1: Setup Context ==========
        context_lines = VGroup(
            Text("Experiment: New study technique vs. standard", font_size=22, color=GRAY),
            Text("H0: No difference in scores (difference = 0)", font_size=22),
            Text("Ha: New technique produces higher scores", font_size=22),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
        context_lines.next_to(subtitle, DOWN, buff=0.3)

        for line in context_lines:
            self.play(Write(line), run_time=0.4)
            self.wait(0.15)

        self.wait(0.3)

        # ========== PART 2: Show Completed Randomization Distribution ==========
        self.play(FadeOut(context_lines), FadeOut(subtitle), run_time=0.4)

        # Generate a randomization distribution (centered near 0)
        n_shuffles = 1000
        rand_diffs = np.random.normal(0, 2.0, n_shuffles)
        observed_diff = 4.8  # The observed experimental result (significant)

        # Axes
        x_min, x_max = -8.0, 8.0
        axes = Axes(
            x_range=[x_min, x_max, 1],
            y_range=[0, 200, 50],
            x_length=10,
            y_length=3.8,
            axis_config={"include_tip": False, "include_numbers": True},
            x_axis_config={
                "numbers_to_include": np.arange(-8, 9, 2),
                "font_size": 16,
            },
            y_axis_config={
                "numbers_to_include": [0, 50, 100, 150, 200],
                "font_size": 14,
            },
        )
        axes.shift(DOWN * 0.4)

        x_label = Text("Difference in means (shuffled)", font_size=18)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)

        dist_label = Text(
            "Randomization Distribution (1000 shuffles)",
            font_size=22, color=TEAL_3B1B,
        )
        dist_label.next_to(title, DOWN, buff=0.25)

        self.play(Create(axes), Write(x_label), Write(dist_label), run_time=0.6)

        # Build histogram
        bin_width = 0.5
        bins = np.arange(x_min, x_max + bin_width, bin_width)
        counts, _ = np.histogram(rand_diffs, bins=bins)
        num_bins = len(counts)

        # All bars
        all_bars = VGroup()
        bar_data = []  # (bar, center_x, count)
        for i, count in enumerate(counts):
            if count == 0:
                continue
            left_edge = x_min + i * bin_width
            center_x = left_edge + bin_width / 2
            bar = Rectangle(
                width=axes.x_length * bin_width / (x_max - x_min) * 0.9,
                height=max(count * (axes.y_length / 200), 0.01),
                fill_color=TEAL_3B1B,
                fill_opacity=0.6,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            bar.move_to(axes.c2p(center_x, count / 2))
            all_bars.add(bar)
            bar_data.append((bar, center_x, count))

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in all_bars],
                lag_ratio=0.01,
            ),
            run_time=1,
        )
        self.wait(0.3)

        # Zero line
        zero_line = DashedLine(
            axes.c2p(0, 0), axes.c2p(0, 190),
            color=WHITE, stroke_width=2,
        )
        zero_note = Text("H0: diff = 0", font_size=16, color=WHITE)
        zero_note.next_to(zero_line, UP, buff=0.05)
        self.play(Create(zero_line), Write(zero_note), run_time=0.4)
        self.wait(0.3)

        # ========== PART 3: Mark the Observed Result ==========
        step1_label = Text("Step 1: Mark the observed result", font_size=22, color=RED)
        step1_label.to_corner(UR, buff=0.4).shift(DOWN * 0.3)
        self.play(Write(step1_label))

        obs_line = DashedLine(
            axes.c2p(observed_diff, 0),
            axes.c2p(observed_diff, 180),
            color=RED, stroke_width=3,
        )
        obs_label = Text(
            f"Observed = {observed_diff}",
            font_size=22, color=RED, weight=BOLD,
        )
        obs_label.next_to(obs_line, UP, buff=0.05)

        # Animate the observed value dropping in
        obs_dot = Dot(axes.c2p(observed_diff, 210), color=RED, radius=0.1)
        self.play(FadeIn(obs_dot), run_time=0.3)
        self.play(
            obs_dot.animate.move_to(axes.c2p(observed_diff, 0)),
            Create(obs_line),
            Write(obs_label),
            run_time=0.8,
        )
        self.play(FadeOut(obs_dot), run_time=0.2)
        self.wait(0.3)

        # ========== PART 4: Shade the Tail ==========
        step2_label = Text(
            "Step 2: Count values at or beyond observed",
            font_size=22, color=PINK_3B1B,
        )
        step2_label.next_to(step1_label, DOWN, buff=0.2)
        self.play(Write(step2_label))
        self.wait(0.3)

        # Color bars beyond observed_diff RED
        shade_anims = []
        for bar, center_x, count in bar_data:
            if center_x >= observed_diff:
                shade_bar = bar.copy()
                shade_bar.set_fill(RED, opacity=0.8)
                shade_bar.set_stroke(RED, width=1)
                shade_anims.append(Transform(bar, shade_bar))

        if shade_anims:
            self.play(*shade_anims, run_time=0.8)
        self.wait(0.3)

        # Arrow pointing to the shaded region
        tail_label = Text("Extreme tail", font_size=18, color=RED)
        tail_label.move_to(axes.c2p(6, 30))
        tail_arrow = Arrow(
            tail_label.get_left(),
            axes.c2p(observed_diff + 0.5, 10),
            color=RED, stroke_width=2, buff=0.1,
        )
        self.play(Write(tail_label), Create(tail_arrow), run_time=0.5)
        self.wait(0.3)

        # ========== PART 5: Calculate P-Value ==========
        n_extreme = np.sum(rand_diffs >= observed_diff)
        p_value = n_extreme / n_shuffles

        step3_label = Text("Step 3: Calculate the p-value", font_size=22, color=GREEN_3B1B)
        step3_label.next_to(step2_label, DOWN, buff=0.2)
        self.play(Write(step3_label))

        calc_line1 = Text(
            f"# of shuffles >= {observed_diff}: {n_extreme} out of {n_shuffles}",
            font_size=20,
        )
        calc_line1.next_to(step3_label, DOWN, buff=0.15)
        self.play(Write(calc_line1), run_time=0.5)

        p_text = Text(
            f"p-value = {n_extreme}/{n_shuffles} = {p_value:.3f}",
            font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        p_text.next_to(calc_line1, DOWN, buff=0.15)
        self.play(Write(p_text))
        self.wait(0.5)

        # ========== PART 6: Interpret ==========
        self.play(
            FadeOut(step1_label), FadeOut(step2_label), FadeOut(step3_label),
            FadeOut(calc_line1), FadeOut(tail_label), FadeOut(tail_arrow),
            run_time=0.4,
        )

        # Move p-value to top-right corner
        self.play(
            p_text.animate.to_corner(UR, buff=0.4).shift(DOWN * 0.3),
            run_time=0.4,
        )

        interp_title = Text("Interpretation:", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        interp_title.next_to(p_text, DOWN, buff=0.25)
        self.play(Write(interp_title))

        if p_value < 0.05:
            interp_text = VGroup(
                Text(f"p-value = {p_value:.3f} < 0.05", font_size=20, color=GREEN_3B1B),
                Text("This is a SMALL p-value!", font_size=20, color=RED),
                Text("Result is unlikely by", font_size=18),
                Text("chance alone", font_size=18),
            ).arrange(DOWN, buff=0.1)
        else:
            interp_text = VGroup(
                Text(f"p-value = {p_value:.3f}", font_size=20, color=TEAL_3B1B),
                Text("Could plausibly happen", font_size=18),
                Text("by chance", font_size=18),
            ).arrange(DOWN, buff=0.1)

        interp_text.next_to(interp_title, DOWN, buff=0.15)

        for line in interp_text:
            self.play(Write(line), run_time=0.35)

        self.wait(0.5)

        # ========== PART 7: Key Insight Box ==========
        self.play(
            FadeOut(axes), FadeOut(x_label), FadeOut(dist_label),
            FadeOut(all_bars), FadeOut(zero_line), FadeOut(zero_note),
            FadeOut(obs_line), FadeOut(obs_label),
            FadeOut(p_text), FadeOut(interp_title), FadeOut(interp_text),
            run_time=0.5,
        )

        insight_content = VGroup(
            Text("P-Value Interpretation", font_size=30, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=6),
            Text(
                "Small p-value (< 0.05):",
                font_size=26, color=RED,
            ),
            Text(
                "Observed result unlikely by chance",
                font_size=24,
            ),
            Text(
                "= Evidence of a REAL effect",
                font_size=24, color=GREEN_3B1B,
            ),
            Text("", font_size=6),
            Text(
                "Large p-value (>= 0.05):",
                font_size=26, color=TEAL_3B1B,
            ),
            Text(
                "Result could happen by chance",
                font_size=24,
            ),
            Text(
                "= NOT convincing evidence",
                font_size=24, color=GRAY,
            ),
        ).arrange(DOWN, buff=0.1)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.2,
            ),
            run_time=2.5,
        )
        self.play(Create(box))
        self.wait(2)
