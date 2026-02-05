"""
Sampling Distribution Buildup (Unit 5, Topic 5.1b)

Visualizes the Central Limit Theorem in action: start with a population
distribution (slightly skewed), repeatedly take samples of n=30 and compute
x-bar, then watch the histogram of sample means build up into an approximately
Normal shape centered at the population mean mu.

Run with: manim -qm --format=mp4 sampling_distribution_buildup.py SamplingDistributionBuildup
"""
from manim import *
import numpy as np


class SamplingDistributionBuildup(Scene):
    def construct(self):
        np.random.seed(7)

        # ========== Population Setup ==========
        # Right-skewed population (e.g., household incomes in $1000s)
        # Using a gamma-ish shape via chi-squared shifted/scaled
        pop_size = 10000
        raw = np.random.exponential(scale=2.0, size=pop_size) + 3.0
        raw = np.clip(raw, 1, 15)
        pop_mean = np.mean(raw)

        title = Text("Building a Sampling Distribution", font_size=40)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== PART 1: Show Population Distribution ==========
        pop_title = Text("Population Distribution", font_size=28, color=BLUE)
        pop_title.next_to(title, DOWN, buff=0.3)
        self.play(Write(pop_title))

        # Build a histogram of the population (bar chart)
        bins_pop = np.arange(1, 16, 1)  # bins: 1,2,...,14
        counts_pop, _ = np.histogram(raw, bins=bins_pop)
        max_count_pop = counts_pop.max()

        pop_bars = VGroup()
        bar_width_pop = 0.5
        max_height_pop = 2.2
        pop_bar_base_y = -0.2

        for i, count in enumerate(counts_pop):
            height = (count / max_count_pop) * max_height_pop
            bar = Rectangle(
                width=bar_width_pop,
                height=max(height, 0.02),
                fill_color=BLUE,
                fill_opacity=0.6,
                stroke_color=WHITE,
                stroke_width=1
            )
            x_pos = (i - len(counts_pop) / 2 + 0.5) * (bar_width_pop + 0.05)
            bar.move_to(
                RIGHT * x_pos + UP * (pop_bar_base_y + height / 2)
            )
            pop_bars.add(bar)

        pop_bars.next_to(pop_title, DOWN, buff=0.3)

        # X-axis labels for population
        pop_axis = Line(
            pop_bars.get_left() + DOWN * 0.15 + LEFT * 0.2,
            pop_bars.get_right() + DOWN * 0.15 + RIGHT * 0.2,
            color=WHITE,
            stroke_width=2
        )
        pop_axis.next_to(pop_bars, DOWN, buff=0.05)

        skew_label = Text("(right-skewed)", font_size=20, color=GRAY)
        skew_label.next_to(pop_axis, DOWN, buff=0.1)

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in pop_bars],
                lag_ratio=0.04
            ),
            Create(pop_axis),
            run_time=1.2
        )
        self.play(Write(skew_label))
        self.wait(0.5)

        # Show population mean
        pop_mu_text = Text(
            f"\u03bc = {pop_mean:.2f}",
            font_size=24,
            color=YELLOW
        )
        pop_mu_text.next_to(pop_bars, RIGHT, buff=0.4)
        self.play(Write(pop_mu_text))
        self.wait(0.5)

        # ========== PART 2: The Process ==========
        # Shrink population into upper-left corner
        pop_group = VGroup(pop_title, pop_bars, pop_axis, skew_label, pop_mu_text)
        self.play(
            pop_group.animate.scale(0.45).to_corner(UL, buff=0.5).shift(DOWN * 0.5),
            run_time=0.8
        )

        # Explain the process
        process_steps = VGroup(
            Text("1. Take a random sample of n = 30", font_size=26),
            Text("2. Compute x\u0304", font_size=28),
            Text("3. Plot it on a histogram", font_size=26),
            Text("4. Repeat many times!", font_size=26, color=YELLOW),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        process_steps.move_to(RIGHT * 1.5 + UP * 1.0)

        for step in process_steps:
            self.play(Write(step), run_time=0.4)
            self.wait(0.2)

        self.wait(0.5)
        self.play(FadeOut(process_steps), run_time=0.4)

        # ========== PART 3: Build Sampling Distribution ==========
        n_sample = 30
        total_samples = 200

        # Pre-compute all sample means
        sample_means = []
        for _ in range(total_samples):
            sample = np.random.choice(raw, size=n_sample, replace=True)
            sample_means.append(np.mean(sample))

        sample_means = np.array(sample_means)

        # Set up histogram axes for sample means
        xbar_min = 3.0
        xbar_max = 8.0
        bin_width = 0.25
        bins_xbar = np.arange(xbar_min, xbar_max + bin_width, bin_width)
        num_bins = len(bins_xbar) - 1

        # Create axes for the sampling distribution histogram
        axes = Axes(
            x_range=[xbar_min, xbar_max, 0.5],
            y_range=[0, 50, 10],
            x_length=9,
            y_length=3.5,
            axis_config={"include_tip": False, "include_numbers": True},
            x_axis_config={
                "numbers_to_include": np.arange(xbar_min, xbar_max + 0.1, 0.5),
                "font_size": 18
            },
            y_axis_config={
                "numbers_to_include": [0, 10, 20, 30, 40],
                "font_size": 18
            },
        )
        axes.shift(DOWN * 1.0)

        x_label = Text("x\u0304", font_size=24)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)
        y_label = Text("Count", font_size=18)
        y_label.rotate(PI / 2)
        y_label.next_to(axes.y_axis, LEFT, buff=0.3)

        dist_title = Text(
            "Sampling Distribution of x-bar (n = 30)",
            font_size=24
        )
        dist_title.next_to(axes, UP, buff=0.2)

        self.play(Create(axes), Write(x_label), Write(y_label), Write(dist_title))
        self.wait(0.3)

        # Counter display
        counter = Text("Samples: 0", font_size=22, color=GREEN)
        counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)
        self.play(Write(counter))

        # Current sample mean display
        current_mean_display = Text(
            "x\u0304 = ?", font_size=24, color=GREEN
        )
        current_mean_display.next_to(counter, DOWN, buff=0.2)
        self.play(Write(current_mean_display))

        # We will build bars incrementally
        # Keep a running count per bin
        bin_counts = np.zeros(num_bins, dtype=int)
        bar_objects = [None] * num_bins  # store current bar mobjects

        def get_bin_index(val):
            idx = int((val - xbar_min) / bin_width)
            return max(0, min(idx, num_bins - 1))

        def create_bar(bin_idx, count):
            """Create a bar rectangle for the given bin and count."""
            left_edge = xbar_min + bin_idx * bin_width
            center_x = left_edge + bin_width / 2
            bar = Rectangle(
                width=axes.x_length * bin_width / (xbar_max - xbar_min) * 0.9,
                height=max(count * (axes.y_length / 50), 0.02),
                fill_color=GREEN,
                fill_opacity=0.7,
                stroke_color=WHITE,
                stroke_width=0.5
            )
            bar.move_to(axes.c2p(center_x, count / 2))
            return bar

        # Phase 1: First 8 samples individually (slow, show the process)
        for i in range(8):
            s_mean = sample_means[i]
            b_idx = get_bin_index(s_mean)
            bin_counts[b_idx] += 1

            # Update counter
            new_counter = Text(f"Samples: {i + 1}", font_size=22, color=GREEN)
            new_counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)

            new_mean = Text(
                f"x\u0304 = {s_mean:.2f}",
                font_size=24,
                color=GREEN
            )
            new_mean.next_to(new_counter, DOWN, buff=0.2)

            # Animate a dot dropping from top to the histogram position
            drop_dot = Dot(
                axes.c2p(s_mean, 55),
                color=YELLOW,
                radius=0.08
            )
            target_pos = axes.c2p(
                xbar_min + b_idx * bin_width + bin_width / 2,
                bin_counts[b_idx]
            )

            new_bar = create_bar(b_idx, bin_counts[b_idx])

            anims = [
                Transform(counter, new_counter),
                Transform(current_mean_display, new_mean),
            ]

            self.play(*anims, FadeIn(drop_dot), run_time=0.3)

            # Drop the dot
            self.play(
                drop_dot.animate.move_to(target_pos),
                run_time=0.3
            )

            # Replace bar
            if bar_objects[b_idx] is not None:
                self.play(
                    Transform(bar_objects[b_idx], new_bar),
                    FadeOut(drop_dot),
                    run_time=0.2
                )
            else:
                bar_objects[b_idx] = new_bar
                self.play(
                    FadeIn(new_bar),
                    FadeOut(drop_dot),
                    run_time=0.2
                )

        self.wait(0.3)

        # Phase 2: Samples 9-40 in quick batches of 4
        for batch_start in range(8, 40, 4):
            batch_end = min(batch_start + 4, 40)
            for i in range(batch_start, batch_end):
                s_mean = sample_means[i]
                b_idx = get_bin_index(s_mean)
                bin_counts[b_idx] += 1

            # Update all changed bars at once
            bar_anims = []
            for b_idx in range(num_bins):
                if bin_counts[b_idx] > 0:
                    new_bar = create_bar(b_idx, bin_counts[b_idx])
                    if bar_objects[b_idx] is not None:
                        bar_anims.append(Transform(bar_objects[b_idx], new_bar))
                    else:
                        bar_objects[b_idx] = new_bar
                        bar_anims.append(FadeIn(new_bar))

            new_counter = Text(f"Samples: {batch_end}", font_size=22, color=GREEN)
            new_counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)

            self.play(
                *bar_anims,
                Transform(counter, new_counter),
                run_time=0.3
            )

        self.wait(0.2)

        # Phase 3: Remaining samples 40-200 in one big batch
        for i in range(40, total_samples):
            s_mean = sample_means[i]
            b_idx = get_bin_index(s_mean)
            bin_counts[b_idx] += 1

        bar_anims = []
        for b_idx in range(num_bins):
            if bin_counts[b_idx] > 0:
                new_bar = create_bar(b_idx, bin_counts[b_idx])
                if bar_objects[b_idx] is not None:
                    bar_anims.append(Transform(bar_objects[b_idx], new_bar))
                else:
                    bar_objects[b_idx] = new_bar
                    bar_anims.append(FadeIn(new_bar))

        new_counter = Text(f"Samples: {total_samples}", font_size=22, color=GREEN)
        new_counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)

        speed_label = Text("(speed up!)", font_size=18, color=YELLOW)
        speed_label.next_to(new_counter, DOWN, buff=0.5)

        self.play(Write(speed_label), run_time=0.2)
        self.play(
            *bar_anims,
            Transform(counter, new_counter),
            run_time=1.5
        )
        self.play(FadeOut(speed_label), FadeOut(current_mean_display), run_time=0.3)
        self.wait(0.3)

        # ========== PART 4: Mark the Center ==========
        # Draw a dashed line at the population mean
        mean_of_xbars = np.mean(sample_means)

        mean_line = DashedLine(
            axes.c2p(pop_mean, 0),
            axes.c2p(pop_mean, 48),
            color=YELLOW,
            stroke_width=3
        )
        mean_label = Text(
            f"\u03bc = {pop_mean:.2f}",
            font_size=22,
            color=YELLOW
        )
        mean_label.next_to(mean_line, UP, buff=0.1)

        self.play(Create(mean_line), Write(mean_label))
        self.wait(0.3)

        # Point out the bell shape
        shape_text = Text("Approximately Normal!", font_size=26, color=RED)
        shape_text.next_to(axes, UP, buff=0.05).shift(RIGHT * 2)
        self.play(Write(shape_text))
        self.wait(0.5)

        # ========== PART 5: Overlay a Normal Curve ==========
        sd_xbar = np.std(sample_means)

        normal_curve = axes.plot(
            lambda x: 45 * np.exp(-0.5 * ((x - pop_mean) / sd_xbar) ** 2),
            x_range=[xbar_min + 0.1, xbar_max - 0.1],
            color=RED,
            stroke_width=3
        )

        self.play(Create(normal_curve), run_time=1)
        self.wait(0.5)

        # ========== PART 6: Key Insight Box ==========
        self.play(
            FadeOut(shape_text),
            FadeOut(counter),
            run_time=0.3
        )

        insight_lines = VGroup(
            Text("The sampling distribution of", font_size=24),
            Text("x\u0304", font_size=32, color=GREEN),
            Text("is centered at", font_size=24),
            Text("\u03bc", font_size=32, color=YELLOW),
            Text("and approximately Normal", font_size=24, color=RED),
        ).arrange(RIGHT, buff=0.15)

        # If it's too wide, rearrange into two lines
        insight_top = VGroup(
            Text("The sampling distribution of", font_size=24),
            Text("x\u0304", font_size=32, color=GREEN),
        ).arrange(RIGHT, buff=0.15)

        insight_bottom = VGroup(
            Text("is centered at", font_size=24),
            Text("\u03bc", font_size=32, color=YELLOW),
            Text("and approximately Normal", font_size=24, color=RED),
        ).arrange(RIGHT, buff=0.15)

        insight_group = VGroup(insight_top, insight_bottom).arrange(DOWN, buff=0.15)
        insight_group.to_edge(DOWN, buff=0.3)

        box = SurroundingRectangle(
            insight_group, color=YELLOW, buff=0.2, corner_radius=0.1
        )

        self.play(Write(insight_top), run_time=0.8)
        self.play(Write(insight_bottom), run_time=0.8)
        self.play(Create(box))
        self.wait(2)
