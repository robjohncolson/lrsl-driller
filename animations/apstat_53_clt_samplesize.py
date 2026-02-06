"""
CLT Sample Size Effect (AP Stats Unit 5, Topic 5.3b)

Shows how sample size affects the sampling distribution shape and spread.
Displays three sampling distributions sequentially from the same skewed
population: n=2 (still skewed), n=10 (somewhat normal), n=30 (clearly
normal and narrower). Highlights that larger n produces more normal shape
AND less spread (sigma/sqrt(n) shrinks).

Run with: manim -qm --format=mp4 apstat_53_clt_samplesize.py CLTSampleSize
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class CLTSampleSize(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== Generate Skewed Population ==========
        pop_size = 50000
        raw = np.random.exponential(scale=3.0, size=pop_size) + 2.0
        raw = np.clip(raw, 0.5, 25)
        pop_mean = np.mean(raw)
        pop_sd = np.std(raw)

        # ========== TITLE ==========
        title = Text("How Sample Size Affects the CLT", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== Show Population (briefly) ==========
        pop_label = Text("Population: Right-Skewed", font_size=26, color=BLUE_3B1B)
        pop_label.next_to(title, DOWN, buff=0.25)

        # Mini population histogram
        bins_pop = np.arange(0, 22, 1.5)
        counts_pop, _ = np.histogram(raw, bins=bins_pop)
        max_count_pop = counts_pop.max()

        pop_bars = VGroup()
        bar_w = 0.35
        max_h = 1.4

        for i, count in enumerate(counts_pop):
            height = (count / max_count_pop) * max_h
            bar = Rectangle(
                width=bar_w,
                height=max(height, 0.02),
                fill_color=BLUE_3B1B,
                fill_opacity=0.6,
                stroke_color=WHITE,
                stroke_width=1,
            )
            x_pos = (i - len(counts_pop) / 2 + 0.5) * (bar_w + 0.03)
            bar.move_to(RIGHT * x_pos + UP * (height / 2))
            pop_bars.add(bar)

        pop_group = VGroup(pop_label, pop_bars)
        pop_bars.next_to(pop_label, DOWN, buff=0.2)
        pop_group.next_to(title, DOWN, buff=0.25)

        pop_params = Text(
            f"mu = {pop_mean:.1f},  sigma = {pop_sd:.1f}",
            font_size=22, color=YELLOW_3B1B,
        )
        pop_params.next_to(pop_bars, DOWN, buff=0.15)

        self.play(
            Write(pop_label),
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in pop_bars],
                lag_ratio=0.03,
            ),
            run_time=1,
        )
        self.play(Write(pop_params))
        self.wait(0.5)

        # Shrink population to top-left
        pop_full = VGroup(pop_group, pop_params)
        self.play(
            pop_full.animate.scale(0.35).to_corner(UL, buff=0.3).shift(DOWN * 0.5),
            run_time=0.6,
        )

        # ========== Three Sample Sizes ==========
        sample_sizes = [2, 10, 30]
        n_simulations = 2000
        colors = [PINK_3B1B, TEAL_3B1B, GREEN_3B1B]
        labels_text = ["n = 2", "n = 10", "n = 30"]

        # Pre-compute all sampling distributions
        all_means = {}
        for n in sample_sizes:
            means = []
            for _ in range(n_simulations):
                sample = np.random.choice(raw, size=n, replace=True)
                means.append(np.mean(sample))
            all_means[n] = np.array(means)

        # Common x-range for all three
        xbar_min = 1.0
        xbar_max = 14.0

        # Create 3 sets of axes stacked vertically
        axes_list = []
        hist_bar_groups = []
        y_positions = [1.5, -0.7, -2.9]

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
            axes_list.append(ax)

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
                h_norm = count / max_count  # normalize to [0, 1]
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

            hist_bar_groups.append(bars)

            # Label
            n_label = Text(labels_text[idx], font_size=24, color=colors[idx], weight=BOLD)
            n_label.next_to(ax, LEFT, buff=0.3)

            # Shape description
            shape_descriptions = [
                "Still skewed",
                "Getting more normal",
                "Clearly Normal!",
            ]
            shape_label = Text(
                shape_descriptions[idx],
                font_size=18,
                color=colors[idx],
            )
            shape_label.next_to(ax, RIGHT, buff=0.3)

            # SD annotation
            se = pop_sd / np.sqrt(n)
            se_label = Text(
                f"SE = {se:.2f}",
                font_size=16,
                color=YELLOW_3B1B,
            )
            se_label.next_to(shape_label, DOWN, buff=0.08)

            # Mean line
            mean_line = DashedLine(
                ax.c2p(pop_mean, 0),
                ax.c2p(pop_mean, 1),
                color=YELLOW_3B1B,
                stroke_width=2,
            )

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
                Write(se_label),
                run_time=0.5,
            )
            self.wait(0.4)

        self.wait(0.5)

        # ========== Highlight the Trend ==========
        trend_arrow = Arrow(
            LEFT * 5.5 + UP * 1.5,
            LEFT * 5.5 + DOWN * 2.9,
            color=YELLOW_3B1B,
            stroke_width=3,
            buff=0,
        )
        trend_label = Text(
            "Larger n",
            font_size=20,
            color=YELLOW_3B1B,
        )
        trend_label.next_to(trend_arrow, LEFT, buff=0.1)

        self.play(GrowArrow(trend_arrow), Write(trend_label), run_time=0.6)
        self.wait(0.5)

        # ========== Clear and Show Key Insight ==========
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=0.6)

        # Rebuild title
        title2 = Text("How Sample Size Affects the CLT", font_size=40, weight=BOLD)
        title2.to_edge(UP, buff=0.3)
        self.play(Write(title2), run_time=0.5)

        insight_content = VGroup(
            Text("Larger n produces:", font_size=30, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=8),
            Text(
                "1. More Normal shape",
                font_size=28, color=GREEN_3B1B,
            ),
            Text(
                "   (even from a skewed population!)",
                font_size=22, color=GRAY,
            ),
            Text("", font_size=8),
            Text(
                "2. Less spread  (sigma / sqrt(n) shrinks)",
                font_size=28, color=TEAL_3B1B,
            ),
            Text(
                "   (larger samples are more precise)",
                font_size=22, color=GRAY,
            ),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        insight_content.move_to(ORIGIN + UP * 0.3)

        box = SurroundingRectangle(
            insight_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_content],
                lag_ratio=0.25,
            ),
            run_time=2,
        )
        self.play(Create(box))
        self.wait(0.5)

        # Rule of thumb
        rule = Text(
            "Rule of Thumb: n >= 30 is usually sufficient for CLT",
            font_size=24, color=RED,
        )
        rule.next_to(box, DOWN, buff=0.4)
        self.play(Write(rule))
        self.wait(2)
