"""
Central Limit Theorem Demonstration (AP Stats Unit 5, Topic 5.3a)

Demonstrates the Central Limit Theorem visually: starts with a right-skewed
population distribution, repeatedly takes samples and computes means, then
shows the sampling distribution building up into an approximately Normal shape.
Highlights the 3 key CLT properties: centered at mu, spread = sigma/sqrt(n),
shape approximately Normal.

Run with: manim -qm --format=mp4 apstat_53_clt_demo.py CLTDemonstration
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CLTDemonstration(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("The Central Limit Theorem", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "The Most Important Theorem in Statistics",
            font_size=24, color=YELLOW_3B1B
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== PART 1: Population Distribution (Right-Skewed) ==========
        # Generate a right-skewed population (e.g., household income in $1000s)
        pop_size = 10000
        raw = np.random.exponential(scale=3.0, size=pop_size) + 2.0
        raw = np.clip(raw, 0.5, 25)
        pop_mean = np.mean(raw)
        pop_sd = np.std(raw)

        pop_title = Text("Population Distribution", font_size=28, color=BLUE_3B1B)
        pop_title.next_to(subtitle, DOWN, buff=0.4)
        self.play(Write(pop_title))

        # Build histogram bars manually
        bins_pop = np.arange(0, 26, 1.5)
        counts_pop, _ = np.histogram(raw, bins=bins_pop)
        max_count_pop = counts_pop.max()

        pop_bars = VGroup()
        bar_width = 0.42
        max_height = 2.0
        base_y = -0.8

        for i, count in enumerate(counts_pop):
            height = (count / max_count_pop) * max_height
            bar = Rectangle(
                width=bar_width,
                height=max(height, 0.02),
                fill_color=BLUE_3B1B,
                fill_opacity=0.6,
                stroke_color=WHITE,
                stroke_width=1,
            )
            x_pos = (i - len(counts_pop) / 2 + 0.5) * (bar_width + 0.04)
            bar.move_to(RIGHT * x_pos + UP * (base_y + height / 2))
            pop_bars.add(bar)

        pop_bars.next_to(pop_title, DOWN, buff=0.3)

        # X-axis
        pop_axis = Line(
            pop_bars.get_left() + DOWN * 0.15 + LEFT * 0.2,
            pop_bars.get_right() + DOWN * 0.15 + RIGHT * 0.2,
            color=WHITE, stroke_width=2,
        )
        pop_axis.next_to(pop_bars, DOWN, buff=0.05)

        skew_label = Text("(right-skewed, NOT normal)", font_size=20, color=RED)
        skew_label.next_to(pop_axis, DOWN, buff=0.1)

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in pop_bars],
                lag_ratio=0.03,
            ),
            Create(pop_axis),
            run_time=1.2,
        )
        self.play(Write(skew_label))
        self.wait(0.3)

        # Population parameters
        params_group = VGroup(
            Text(f"mu = {pop_mean:.1f}", font_size=22, color=YELLOW_3B1B),
            Text(f"sigma = {pop_sd:.1f}", font_size=22, color=YELLOW_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
        params_group.next_to(pop_bars, RIGHT, buff=0.5)
        self.play(Write(params_group))
        self.wait(0.5)

        # ========== PART 2: Shrink Population, Show Sampling Process ==========
        pop_group = VGroup(pop_title, pop_bars, pop_axis, skew_label, params_group)
        self.play(
            FadeOut(subtitle),
            pop_group.animate.scale(0.4).to_corner(UL, buff=0.4).shift(DOWN * 0.5),
            run_time=0.8,
        )

        # Process description
        process_steps = VGroup(
            Text("The CLT Process:", font_size=28, color=TEAL_3B1B, weight=BOLD),
            Text("1. Take a random sample of size n", font_size=24),
            Text("2. Compute the sample mean x-bar", font_size=24),
            Text("3. Repeat MANY times", font_size=24),
            Text("4. Plot ALL the x-bar values", font_size=24, color=YELLOW_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        process_steps.move_to(RIGHT * 1.5 + UP * 1.5)

        for step in process_steps:
            self.play(Write(step), run_time=0.35)
            self.wait(0.15)

        self.wait(0.5)
        self.play(FadeOut(process_steps), run_time=0.4)

        # ========== PART 3: Build Sampling Distribution (n=30) ==========
        n_sample = 30
        total_samples = 250

        # Pre-compute sample means
        sample_means = []
        for _ in range(total_samples):
            sample = np.random.choice(raw, size=n_sample, replace=True)
            sample_means.append(np.mean(sample))
        sample_means = np.array(sample_means)

        xbar_min = 2.5
        xbar_max = 8.5
        bin_width = 0.25
        bins_xbar = np.arange(xbar_min, xbar_max + bin_width, bin_width)
        num_bins = len(bins_xbar) - 1

        # Axes
        axes = Axes(
            x_range=[xbar_min, xbar_max, 0.5],
            y_range=[0, 50, 10],
            x_length=9,
            y_length=3.2,
            axis_config={"include_tip": False, "include_numbers": True},
            x_axis_config={
                "numbers_to_include": np.arange(3, 9, 0.5),
                "font_size": 16,
            },
            y_axis_config={
                "numbers_to_include": [0, 10, 20, 30, 40],
                "font_size": 16,
            },
        )
        axes.shift(DOWN * 1.0)

        x_label = Text("x-bar", font_size=22)
        x_label.next_to(axes.x_axis, DOWN, buff=0.3)
        dist_title = Text(
            "Sampling Distribution of x-bar (n = 30)",
            font_size=24, color=TEAL_3B1B,
        )
        dist_title.next_to(axes, UP, buff=0.15)

        self.play(Create(axes), Write(x_label), Write(dist_title))
        self.wait(0.3)

        # Counter
        counter = Text("Samples: 0", font_size=20, color=GREEN_3B1B)
        counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)
        self.play(Write(counter))

        # Build histogram incrementally
        bin_counts = np.zeros(num_bins, dtype=int)
        bar_objects = [None] * num_bins

        def get_bin_index(val):
            idx = int((val - xbar_min) / bin_width)
            return max(0, min(idx, num_bins - 1))

        def create_bar(bin_idx, count):
            left_edge = xbar_min + bin_idx * bin_width
            center_x = left_edge + bin_width / 2
            bar = Rectangle(
                width=axes.x_length * bin_width / (xbar_max - xbar_min) * 0.9,
                height=max(count * (axes.y_length / 50), 0.02),
                fill_color=GREEN_3B1B,
                fill_opacity=0.7,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            bar.move_to(axes.c2p(center_x, count / 2))
            return bar

        # Phase 1: First 6 samples individually
        for i in range(6):
            s_mean = sample_means[i]
            b_idx = get_bin_index(s_mean)
            bin_counts[b_idx] += 1

            new_counter = Text(f"Samples: {i + 1}", font_size=20, color=GREEN_3B1B)
            new_counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)

            drop_dot = Dot(
                axes.c2p(s_mean, 52), color=YELLOW_3B1B, radius=0.07
            )
            target_pos = axes.c2p(
                xbar_min + b_idx * bin_width + bin_width / 2,
                bin_counts[b_idx],
            )
            new_bar = create_bar(b_idx, bin_counts[b_idx])

            self.play(
                Transform(counter, new_counter),
                FadeIn(drop_dot),
                run_time=0.25,
            )
            self.play(drop_dot.animate.move_to(target_pos), run_time=0.25)

            if bar_objects[b_idx] is not None:
                self.play(
                    Transform(bar_objects[b_idx], new_bar),
                    FadeOut(drop_dot),
                    run_time=0.2,
                )
            else:
                bar_objects[b_idx] = new_bar
                self.play(FadeIn(new_bar), FadeOut(drop_dot), run_time=0.2)

        # Phase 2: Samples 7-50 in batches of 5
        for batch_start in range(6, 50, 5):
            batch_end = min(batch_start + 5, 50)
            for i in range(batch_start, batch_end):
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

            new_counter = Text(f"Samples: {batch_end}", font_size=20, color=GREEN_3B1B)
            new_counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)
            self.play(*bar_anims, Transform(counter, new_counter), run_time=0.25)

        # Phase 3: Remaining 50-250 in one batch
        for i in range(50, total_samples):
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

        new_counter = Text(f"Samples: {total_samples}", font_size=20, color=GREEN_3B1B)
        new_counter.to_corner(UR, buff=0.5).shift(DOWN * 0.5)

        speed_label = Text("(speed up!)", font_size=16, color=YELLOW_3B1B)
        speed_label.next_to(new_counter, DOWN, buff=0.3)
        self.play(Write(speed_label), run_time=0.2)
        self.play(
            *bar_anims,
            Transform(counter, new_counter),
            run_time=1.2,
        )
        self.play(FadeOut(speed_label), run_time=0.2)
        self.wait(0.3)

        # ========== PART 4: Overlay Normal Curve ==========
        sd_xbar = np.std(sample_means)

        normal_curve = axes.plot(
            lambda x: 42 * np.exp(-0.5 * ((x - pop_mean) / sd_xbar) ** 2),
            x_range=[xbar_min + 0.1, xbar_max - 0.1],
            color=RED,
            stroke_width=3,
        )
        self.play(Create(normal_curve), run_time=1)
        self.wait(0.3)

        # Mean line
        mean_line = DashedLine(
            axes.c2p(pop_mean, 0),
            axes.c2p(pop_mean, 48),
            color=YELLOW_3B1B, stroke_width=3,
        )
        mean_label = Text(f"mu = {pop_mean:.1f}", font_size=20, color=YELLOW_3B1B)
        mean_label.next_to(mean_line, UP, buff=0.05)
        self.play(Create(mean_line), Write(mean_label))
        self.wait(0.3)

        # ========== PART 5: Three Key Properties ==========
        self.play(FadeOut(counter), run_time=0.2)

        props_title = Text("3 Key CLT Properties:", font_size=26, color=RED, weight=BOLD)
        props_title.to_corner(UR, buff=0.4).shift(DOWN * 0.3)
        self.play(Write(props_title))

        prop1 = Text("1. Center: mean of x-bar = mu", font_size=20, color=YELLOW_3B1B)
        prop1.next_to(props_title, DOWN, buff=0.2, aligned_edge=LEFT)
        self.play(Write(prop1))
        self.wait(0.3)

        expected_se = pop_sd / np.sqrt(n_sample)
        prop2 = Text(
            f"2. Spread: SD = sigma/sqrt(n) = {expected_se:.2f}",
            font_size=20, color=TEAL_3B1B,
        )
        prop2.next_to(prop1, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(prop2))
        self.wait(0.3)

        prop3 = Text("3. Shape: approximately Normal!", font_size=20, color=RED)
        prop3.next_to(prop2, DOWN, buff=0.15, aligned_edge=LEFT)
        self.play(Write(prop3))
        self.wait(0.5)

        # ========== PART 6: Key Insight Box ==========
        self.play(
            FadeOut(props_title), FadeOut(prop1), FadeOut(prop2), FadeOut(prop3),
            FadeOut(axes), FadeOut(x_label), FadeOut(dist_title),
            FadeOut(normal_curve), FadeOut(mean_line), FadeOut(mean_label),
            FadeOut(pop_group),
            *[FadeOut(b) for b in bar_objects if b is not None],
            run_time=0.6,
        )

        insight_content = VGroup(
            Text("Central Limit Theorem", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text(
                "No matter the population shape,",
                font_size=26,
            ),
            Text(
                "x-bar is approximately normal for large n",
                font_size=26, color=RED,
            ),
            Text(
                "Centered at mu,  Spread = sigma / sqrt(n)",
                font_size=24, color=TEAL_3B1B,
            ),
        ).arrange(DOWN, buff=0.2)
        insight_content.move_to(ORIGIN)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.3,
            ),
            run_time=2,
        )
        self.play(Create(box))
        self.wait(2)
