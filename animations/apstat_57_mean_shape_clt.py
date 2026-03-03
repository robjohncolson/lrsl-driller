"""
Shape of the Sampling Distribution of x-bar (AP Stats Unit 5, Topic 5.7b)

Demonstrates the two paths to normality for x-bar:
  Path 1 - Normal population: x-bar is normal for ANY sample size (even n=3)
  Path 2 - Non-normal population: CLT kicks in at n >= 30
Shows visual progression of a skewed population's sampling distribution
becoming approximately normal as n increases (n=5, 15, 30).
Ends with a summary comparing both rules and connecting back to Topic 5.3.

Run with: manim -qm --format=mp4 apstat_57_mean_shape_clt.py MeanShapeCLT
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class MeanShapeCLT(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text(
            "When is the Sampling Distribution of x-bar Normal?",
            font_size=36, weight=BOLD,
        )
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Two Paths to Normality",
            font_size=26, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== PATH 1: NORMAL POPULATION ==========
        self.play(FadeOut(subtitle), run_time=0.3)

        path1_label = Text(
            "Path 1: Population is Normal",
            font_size=30, color=BLUE_3B1B, weight=BOLD,
        )
        path1_label.next_to(title, DOWN, buff=0.3)
        self.play(Write(path1_label))
        self.wait(0.3)

        # --- Draw a Normal population bell curve ---
        pop_normal_ax = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.45, 0.1],
            x_length=4.5,
            y_length=2.0,
            axis_config={
                "include_tip": False,
                "include_numbers": False,
                "stroke_width": 1.5,
            },
        )
        pop_normal_ax.move_to(LEFT * 3.2 + DOWN * 0.3)

        pop_normal_curve = pop_normal_ax.plot(
            lambda x: (1 / np.sqrt(2 * np.pi)) * np.exp(-0.5 * x ** 2),
            x_range=[-3.5, 3.5],
            color=BLUE_3B1B,
            stroke_width=3,
        )
        pop_normal_fill = pop_normal_ax.get_area(
            pop_normal_curve,
            x_range=[-3.5, 3.5],
            color=BLUE_3B1B,
            opacity=0.25,
        )
        pop_normal_label = Text(
            "Normal Population", font_size=20, color=BLUE_3B1B,
        )
        pop_normal_label.next_to(pop_normal_ax, DOWN, buff=0.15)

        self.play(
            Create(pop_normal_ax),
            Create(pop_normal_curve),
            FadeIn(pop_normal_fill),
            Write(pop_normal_label),
            run_time=1.0,
        )
        self.wait(0.3)

        # --- Arrow to sampling distribution ---
        path1_arrow = Arrow(
            LEFT * 0.7 + DOWN * 0.3,
            RIGHT * 0.7 + DOWN * 0.3,
            color=YELLOW_3B1B,
            stroke_width=3,
            buff=0.1,
        )
        arrow_label = Text("sample", font_size=16, color=YELLOW_3B1B)
        arrow_label.next_to(path1_arrow, UP, buff=0.08)
        self.play(GrowArrow(path1_arrow), Write(arrow_label), run_time=0.5)

        # --- Sampling distribution of x-bar (also bell-shaped) ---
        samp_normal_ax = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 0.45, 0.1],
            x_length=4.5,
            y_length=2.0,
            axis_config={
                "include_tip": False,
                "include_numbers": False,
                "stroke_width": 1.5,
            },
        )
        samp_normal_ax.move_to(RIGHT * 3.2 + DOWN * 0.3)

        # Narrower curve (smaller spread due to sigma/sqrt(n))
        samp_normal_curve = samp_normal_ax.plot(
            lambda x: (1 / np.sqrt(2 * np.pi) / 0.7) * np.exp(-0.5 * (x / 0.7) ** 2),
            x_range=[-3.5, 3.5],
            color=GREEN_3B1B,
            stroke_width=3,
        )
        samp_normal_fill = samp_normal_ax.get_area(
            samp_normal_curve,
            x_range=[-3.5, 3.5],
            color=GREEN_3B1B,
            opacity=0.25,
        )
        samp_normal_label = Text(
            "Distribution of x-bar", font_size=20, color=GREEN_3B1B,
        )
        samp_normal_label.next_to(samp_normal_ax, DOWN, buff=0.15)

        self.play(
            Create(samp_normal_ax),
            Create(samp_normal_curve),
            FadeIn(samp_normal_fill),
            Write(samp_normal_label),
            run_time=1.0,
        )
        self.wait(0.3)

        # Key rule text
        rule1_text = Text(
            "If population is Normal --> x-bar is Normal for ANY n",
            font_size=24, color=GREEN_3B1B,
        )
        rule1_text.move_to(DOWN * 2.2)
        self.play(Write(rule1_text))
        self.wait(0.3)

        # Even n = 3!
        n3_text = Text(
            "Even n = 3 works!",
            font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        n3_text.next_to(rule1_text, DOWN, buff=0.2)
        self.play(Write(n3_text))
        self.wait(0.8)

        # ========== CLEAR PATH 1 ==========
        path1_all = VGroup(
            path1_label,
            pop_normal_ax, pop_normal_curve, pop_normal_fill, pop_normal_label,
            path1_arrow, arrow_label,
            samp_normal_ax, samp_normal_curve, samp_normal_fill, samp_normal_label,
            rule1_text, n3_text,
        )
        self.play(FadeOut(path1_all), run_time=0.5)

        # ========== PATH 2: NON-NORMAL POPULATION ==========
        path2_label = Text(
            "Path 2: Population is NOT Normal",
            font_size=30, color=PINK_3B1B, weight=BOLD,
        )
        path2_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(path2_label))
        self.wait(0.3)

        # --- Generate right-skewed population ---
        pop_size = 50000
        raw = np.random.exponential(scale=3.0, size=pop_size) + 2.0
        raw = np.clip(raw, 0.5, 25)
        pop_mean = np.mean(raw)
        pop_sd = np.std(raw)

        # Build mini skewed population histogram
        bins_pop = np.arange(0, 22, 1.5)
        counts_pop, _ = np.histogram(raw, bins=bins_pop)
        max_count_pop = counts_pop.max()

        pop_bars = VGroup()
        bar_w = 0.28
        max_h = 1.2

        for i, count in enumerate(counts_pop):
            height = (count / max_count_pop) * max_h
            bar = Rectangle(
                width=bar_w,
                height=max(height, 0.02),
                fill_color=PINK_3B1B,
                fill_opacity=0.6,
                stroke_color=WHITE,
                stroke_width=1,
            )
            x_pos = (i - len(counts_pop) / 2 + 0.5) * (bar_w + 0.02)
            bar.move_to(RIGHT * x_pos + UP * (height / 2))
            pop_bars.add(bar)

        pop_skew_label = Text("Skewed Population", font_size=20, color=PINK_3B1B)
        pop_bars.next_to(path2_label, DOWN, buff=0.25)
        pop_skew_label.next_to(pop_bars, DOWN, buff=0.1)

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in pop_bars],
                lag_ratio=0.03,
            ),
            run_time=0.8,
        )
        self.play(Write(pop_skew_label), run_time=0.3)
        self.wait(0.3)

        # Shrink population to top-left corner
        pop_group = VGroup(path2_label, pop_bars, pop_skew_label)
        self.play(
            pop_group.animate.scale(0.4).to_corner(UL, buff=0.3).shift(DOWN * 0.5),
            run_time=0.6,
        )

        # --- Show three sample sizes: n=5, n=15, n=30 ---
        sample_sizes = [5, 15, 30]
        n_simulations = 3000
        colors = [PINK_3B1B, TEAL_3B1B, GREEN_3B1B]
        labels_text = ["n = 5", "n = 15", "n = 30"]

        # Pre-compute all sampling distributions
        all_means = {}
        for n in sample_sizes:
            means = []
            for _ in range(n_simulations):
                sample = np.random.choice(raw, size=n, replace=True)
                means.append(np.mean(sample))
            all_means[n] = np.array(means)

        xbar_min = 1.0
        xbar_max = 14.0

        y_positions = [1.5, -0.7, -2.9]

        shape_descriptions = [
            "Still skewed",
            "Less skewed",
            "Approximately Normal!",
        ]

        all_row_mobjects = []

        for idx, n in enumerate(sample_sizes):
            ax = Axes(
                x_range=[xbar_min, xbar_max, 1],
                y_range=[0, 1, 0.2],
                x_length=8,
                y_length=1.5,
                axis_config={
                    "include_tip": False,
                    "include_numbers": False,
                    "stroke_width": 1.5,
                },
            )
            ax.shift(RIGHT * 0.8 + UP * y_positions[idx])

            # X-axis labels
            x_labels = VGroup()
            for val in range(2, 14, 2):
                lab = Text(str(val), font_size=14)
                lab.next_to(ax.c2p(val, 0), DOWN, buff=0.08)
                x_labels.add(lab)

            # Histogram
            bin_width = 0.5
            bins = np.arange(xbar_min, xbar_max + bin_width, bin_width)
            counts, _ = np.histogram(all_means[n], bins=bins)
            max_count = counts.max() if counts.max() > 0 else 1

            bars = VGroup()
            for i, count in enumerate(counts):
                h_norm = count / max_count
                left_edge = xbar_min + i * bin_width
                center_x = left_edge + bin_width / 2
                bar = Rectangle(
                    width=ax.x_length * bin_width / (xbar_max - xbar_min) * 0.9,
                    height=max(h_norm * (ax.y_length * 0.9), 0.01),
                    fill_color=colors[idx],
                    fill_opacity=0.65,
                    stroke_color=WHITE,
                    stroke_width=0.5,
                )
                bar.move_to(ax.c2p(center_x, h_norm / 2))
                bars.add(bar)

            # Label
            n_label = Text(
                labels_text[idx], font_size=24, color=colors[idx], weight=BOLD,
            )
            n_label.next_to(ax, LEFT, buff=0.3)

            # Shape description
            shape_color = GREEN_3B1B if idx == 2 else colors[idx]
            shape_label = Text(
                shape_descriptions[idx],
                font_size=18,
                color=shape_color,
            )
            shape_label.next_to(ax, RIGHT, buff=0.3)

            # Mean line
            mean_line = DashedLine(
                ax.c2p(pop_mean, 0),
                ax.c2p(pop_mean, 1),
                color=YELLOW_3B1B,
                stroke_width=2,
            )

            row_mobjects = VGroup(ax, x_labels, bars, n_label, shape_label, mean_line)
            all_row_mobjects.append(row_mobjects)

            # Animate this row
            self.play(Create(ax), FadeIn(x_labels), run_time=0.4)
            self.play(Write(n_label), run_time=0.3)
            self.play(
                LaggedStart(
                    *[FadeIn(bar, shift=UP * 0.1) for bar in bars],
                    lag_ratio=0.01,
                ),
                run_time=0.8,
            )
            self.play(
                Create(mean_line),
                Write(shape_label),
                run_time=0.5,
            )
            self.wait(0.4)

        # Highlight n=30 row
        highlight_box = SurroundingRectangle(
            all_row_mobjects[2], color=GREEN_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Create(highlight_box), run_time=0.5)

        clt_note = Text(
            "CLT: If n >= 30, x-bar is approximately Normal",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        clt_note.to_edge(DOWN, buff=0.2)
        self.play(Write(clt_note))
        self.wait(0.8)

        # ========== CLEAR PATH 2 ==========
        self.play(
            *[FadeOut(mob) for mob in self.mobjects],
            run_time=0.6,
        )

        # ========== SUMMARY BOX ==========
        summary_title = Text(
            "Summary: Two Rules for x-bar Normality",
            font_size=34, weight=BOLD,
        )
        summary_title.to_edge(UP, buff=0.4)
        self.play(Write(summary_title))
        self.wait(0.3)

        # Left side: Normal population
        left_header = Text(
            "Population Normal", font_size=26, color=BLUE_3B1B, weight=BOLD,
        )
        left_content = VGroup(
            Text("Any n works", font_size=24, color=GREEN_3B1B),
            Text("(even n = 1, 2, 3...)", font_size=20, color=GRAY),
        ).arrange(DOWN, buff=0.1)

        left_box_content = VGroup(left_header, left_content).arrange(DOWN, buff=0.25)
        left_box_content.move_to(LEFT * 3 + DOWN * 0.2)
        left_box = SurroundingRectangle(
            left_box_content, color=BLUE_3B1B, buff=0.25, corner_radius=0.1,
        )

        # Right side: Non-normal population
        right_header = Text(
            "Population NOT Normal", font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        right_content = VGroup(
            Text("Need n >= 30", font_size=24, color=GREEN_3B1B),
            Text("(CLT kicks in)", font_size=20, color=GRAY),
        ).arrange(DOWN, buff=0.1)

        right_box_content = VGroup(right_header, right_content).arrange(DOWN, buff=0.25)
        right_box_content.move_to(RIGHT * 3 + DOWN * 0.2)
        right_box = SurroundingRectangle(
            right_box_content, color=PINK_3B1B, buff=0.25, corner_radius=0.1,
        )

        # "vs" between them
        vs_text = Text("vs", font_size=28, color=YELLOW_3B1B, weight=BOLD)
        vs_text.move_to(DOWN * 0.2)

        self.play(
            Write(left_header), Create(left_box), run_time=0.6,
        )
        self.play(Write(left_content), run_time=0.5)
        self.play(Write(vs_text), run_time=0.3)
        self.play(
            Write(right_header), Create(right_box), run_time=0.6,
        )
        self.play(Write(right_content), run_time=0.5)
        self.wait(0.8)

        # ========== KEY INSIGHT ==========
        insight_text = Text(
            "This is the SAME rule as for proportions (Topic 5.3)!",
            font_size=24, color=YELLOW_3B1B, weight=BOLD,
        )
        insight_text.move_to(DOWN * 2.0)
        insight_box = SurroundingRectangle(
            insight_text, color=YELLOW_3B1B, buff=0.2, corner_radius=0.1,
        )

        self.play(Write(insight_text), Create(insight_box), run_time=0.8)
        self.wait(0.3)

        detail = Text(
            "Normal pop = any n  |  Non-normal pop = CLT needs large n",
            font_size=20, color=TEAL_3B1B,
        )
        detail.next_to(insight_box, DOWN, buff=0.2)
        self.play(Write(detail))
        self.wait(2)
