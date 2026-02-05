"""
Sampling Variability (Unit 5, Topic 5.1a)

Demonstrates WHY different random samples from the same population produce
different statistics. Shows a population of ~50 dots, draws 3 different
samples, computes each sample mean, and reveals that variation itself
is predictable even though individual samples are not.

Run with: manim -qm --format=mp4 sampling_variability.py SamplingVariability
"""
from manim import *
import numpy as np


class SamplingVariability(Scene):
    def construct(self):
        # Seed for reproducibility
        np.random.seed(42)

        # ========== PART 1: Title ==========
        title = Text("Why Do Samples Vary?", font_size=44)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # ========== PART 2: Build the Population ==========
        # Generate population of 50 individuals with a known distribution
        # Values represent "hours of sleep" — range roughly 4-10
        pop_size = 50
        pop_values = np.round(np.random.normal(loc=7.0, scale=1.2, size=pop_size), 1)
        pop_values = np.clip(pop_values, 4.0, 10.0)
        pop_mean = np.mean(pop_values)

        pop_label = Text("Population (N = 50)", font_size=28, color=GRAY)
        pop_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(pop_label))

        # Create a cloud of dots arranged in a 10x5 grid
        # Color each dot on a blue-to-red gradient based on its value
        dots = VGroup()
        dot_data = []  # store (dot_group, value) pairs for later

        min_val = pop_values.min()
        max_val = pop_values.max()

        for i in range(pop_size):
            row = i // 10
            col = i % 10
            x = (col - 4.5) * 0.55
            y = (2 - row) * 0.55 - 0.3

            # Color interpolation: low values = BLUE, high = RED
            t = (pop_values[i] - min_val) / (max_val - min_val)
            color = interpolate_color(BLUE, RED, t)

            dot = Dot(
                point=RIGHT * x + UP * y,
                radius=0.14,
                color=color,
                fill_opacity=0.75
            )
            dots.add(dot)
            dot_data.append((dot, pop_values[i]))

        dots.next_to(pop_label, DOWN, buff=0.4)

        self.play(
            LaggedStart(*[FadeIn(d, scale=0.5) for d in dots], lag_ratio=0.02),
            run_time=1.5
        )
        self.wait(0.3)

        # Show population mean
        mu_text = Text(
            f"\u03bc = {pop_mean:.2f}",
            font_size=28,
            color=YELLOW
        )
        mu_text.next_to(dots, RIGHT, buff=0.6)
        mu_label = Text("(true mean)", font_size=18, color=YELLOW)
        mu_label.next_to(mu_text, DOWN, buff=0.1)

        self.play(Write(mu_text), Write(mu_label))
        self.wait(0.5)

        # ========== PART 3: Draw Three Different Samples ==========
        sample_size = 7
        sample_colors = [GREEN, ORANGE, PURPLE]
        sample_names = ["Sample A", "Sample B", "Sample C"]

        # Pre-select 3 non-overlapping samples
        all_indices = np.random.permutation(pop_size)
        sample_indices = [
            all_indices[0:sample_size],
            all_indices[sample_size:2 * sample_size],
            all_indices[2 * sample_size:3 * sample_size],
        ]

        # Area below dots for showing sample means
        means_title = Text("Sample Means:", font_size=26)
        means_title.next_to(dots, DOWN, buff=0.7)
        self.play(Write(means_title))

        mean_displays = VGroup()
        sample_mean_values = []

        for s_idx in range(3):
            color = sample_colors[s_idx]
            name = sample_names[s_idx]
            indices = sample_indices[s_idx]
            sample_vals = pop_values[indices]
            s_mean = np.mean(sample_vals)
            sample_mean_values.append(s_mean)

            # Highlight dots in this sample
            highlight_anims = []
            rings = VGroup()
            for idx in indices:
                ring = Circle(
                    radius=0.2,
                    color=color,
                    stroke_width=3
                )
                ring.move_to(dots[idx].get_center())
                rings.add(ring)
                highlight_anims.append(Create(ring))

            # Sample label
            s_label = Text(f"{name} (n={sample_size})", font_size=22, color=color)
            s_label.next_to(dots, LEFT, buff=0.5).shift(DOWN * s_idx * 0.4)

            self.play(
                Write(s_label),
                LaggedStart(*highlight_anims, lag_ratio=0.05),
                run_time=0.8
            )
            self.wait(0.3)

            # Show this sample's mean
            mean_text = Text(
                "x\u0304" + chr(65 + s_idx) + f" = {s_mean:.2f}",
                font_size=26,
                color=color
            )
            mean_text.next_to(means_title, DOWN, buff=0.15 + s_idx * 0.4)
            mean_text.shift(LEFT * (1 - s_idx) * 1.8)

            mean_displays.add(mean_text)
            self.play(Write(mean_text), run_time=0.5)
            self.wait(0.2)

            # Fade the rings before next sample
            self.play(
                FadeOut(rings),
                FadeOut(s_label),
                run_time=0.4
            )

        self.wait(0.5)

        # ========== PART 4: Visual Comparison — Number Line ==========
        # Clear the dot cloud to make room
        self.play(
            FadeOut(dots),
            FadeOut(pop_label),
            FadeOut(mu_text),
            FadeOut(mu_label),
            FadeOut(means_title),
            title.animate.scale(0.8).to_edge(UP, buff=0.2),
            run_time=0.8
        )

        # Reposition mean displays
        for m in mean_displays:
            self.play(FadeOut(m), run_time=0.2)

        # Draw a number line showing the three means spread around mu
        nl_label = Text("Where did each sample land?", font_size=28)
        nl_label.next_to(title, DOWN, buff=0.4)
        self.play(Write(nl_label))

        # Determine range for the number line
        all_means = sample_mean_values + [pop_mean]
        nl_min = min(all_means) - 0.8
        nl_max = max(all_means) + 0.8

        number_line = NumberLine(
            x_range=[nl_min, nl_max, 0.5],
            length=10,
            include_numbers=False,
        )
        number_line.next_to(nl_label, DOWN, buff=0.8)

        # Add manual tick labels
        tick_labels = VGroup()
        for val in np.arange(np.floor(nl_min * 2) / 2, np.ceil(nl_max * 2) / 2 + 0.1, 0.5):
            tick_label = Text(f"{val:.1f}", font_size=20)
            tick_label.next_to(number_line.n2p(val), DOWN, buff=0.15)
            tick_labels.add(tick_label)
            self.add(tick_label)

        self.play(Create(number_line), run_time=1)

        # Plot population mean
        mu_dot = Dot(
            number_line.n2p(pop_mean),
            radius=0.15,
            color=YELLOW
        )
        mu_marker = Text("\u03bc", font_size=28, color=YELLOW)
        mu_marker.next_to(mu_dot, DOWN, buff=0.25)

        self.play(FadeIn(mu_dot, scale=1.5), Write(mu_marker))
        self.wait(0.3)

        # Plot each sample mean with arrows dropping in from above
        sample_markers = VGroup()
        for s_idx in range(3):
            color = sample_colors[s_idx]
            s_mean = sample_mean_values[s_idx]
            name_char = chr(65 + s_idx)

            s_dot = Dot(
                number_line.n2p(s_mean),
                radius=0.12,
                color=color
            )
            s_text = Text(
                f"x\u0304{name_char}={s_mean:.2f}",
                font_size=22,
                color=color
            )
            # Stagger labels above/below to avoid overlap
            if s_idx % 2 == 0:
                s_text.next_to(s_dot, UP, buff=0.2 + s_idx * 0.15)
            else:
                s_text.next_to(s_dot, UP, buff=0.2 + s_idx * 0.15)

            arrow = Arrow(
                start=s_dot.get_center() + UP * 1.5,
                end=s_dot.get_center() + UP * 0.2,
                color=color,
                stroke_width=3,
                buff=0
            )

            self.play(
                GrowArrow(arrow),
                run_time=0.4
            )
            self.play(
                FadeIn(s_dot, scale=1.5),
                Write(s_text),
                FadeOut(arrow),
                run_time=0.5
            )
            sample_markers.add(VGroup(s_dot, s_text))
            self.wait(0.2)

        self.wait(0.5)

        # ========== PART 5: The Key Point ==========
        # Emphasize that every sample gives a DIFFERENT answer
        diff_text = Text(
            "Each sample gives a DIFFERENT mean!",
            font_size=28,
            color=RED
        )
        diff_text.next_to(number_line, DOWN, buff=0.8)
        self.play(Write(diff_text))
        self.wait(0.5)

        but_text = Text(
            "But they all cluster around the true mean...",
            font_size=24,
            color=GRAY
        )
        but_text.next_to(diff_text, DOWN, buff=0.2)
        self.play(Write(but_text))
        self.wait(0.8)

        # ========== PART 6: Boxed Insight ==========
        self.play(
            FadeOut(nl_label),
            FadeOut(diff_text),
            FadeOut(but_text),
            FadeOut(number_line),
            FadeOut(mu_dot),
            FadeOut(mu_marker),
            FadeOut(sample_markers),
            FadeOut(tick_labels),
            run_time=0.6
        )

        insight_lines = VGroup(
            Text("Different random samples", font_size=30),
            Text("\u2193", font_size=36),
            Text("Different statistics", font_size=30),
            Text("\u2193", font_size=36),
            Text("= Sampling Variability", font_size=34, color=YELLOW, weight=BOLD),
        ).arrange(DOWN, buff=0.2)
        insight_lines.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_lines, color=YELLOW, buff=0.3, corner_radius=0.15
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_lines],
                lag_ratio=0.3
            ),
            run_time=2
        )
        self.play(Create(box))
        self.wait(0.5)

        # Final takeaway
        takeaway = Text(
            "A single sample is unpredictable, but the pattern of variation is not.",
            font_size=22,
            color=GRAY
        )
        takeaway.next_to(box, DOWN, buff=0.4)
        self.play(Write(takeaway))
        self.wait(2)
