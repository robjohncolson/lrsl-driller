"""
Biased vs Unbiased Comparison (AP Stats Unit 5, Topic 5.4c)

Uses the classic Weimaraner dog example (5 dogs, ages {0, 2, 5, 8, 10}) to
demonstrate the difference between biased and unbiased estimators. Shows all
C(5,3) = 10 samples of size 3, computes sample means (unbiased for mu) and
sample ranges (biased for population range), and builds dot plots for each
sampling distribution. The mean of sample means equals mu (unbiased), while
the mean of sample ranges underestimates the population range (biased).

Run with: manim -qm --format=mp4 apstat_54_biased_unbiased_comparison.py BiasedUnbiasedComparison
"""
from manim import *
import numpy as np
from itertools import combinations

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class BiasedUnbiasedComparison(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== POPULATION DATA ==========
        ages = [0, 2, 5, 8, 10]
        pop_mean = np.mean(ages)        # 5.0
        pop_range = max(ages) - min(ages)  # 10

        # All C(5,3) = 10 samples of size 3
        all_samples = list(combinations(ages, 3))
        sample_means = [round(np.mean(s), 2) for s in all_samples]
        sample_ranges = [max(s) - min(s) for s in all_samples]
        mean_of_means = np.mean(sample_means)   # 5.0
        mean_of_ranges = np.mean(sample_ranges)  # 7.8

        # ========== TITLE ==========
        title = Text(
            "Identifying Biased & Unbiased Estimators",
            font_size=44, weight=BOLD,
        )
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "The Weimaraner Dog Example",
            font_size=28, color=YELLOW_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # ========== POPULATION: 5 DOGS ==========
        pop_label = Text("Population: 5 Weimaraners", font_size=28, color=BLUE_3B1B)
        pop_label.next_to(subtitle, DOWN, buff=0.4)
        self.play(Write(pop_label))

        # Show dogs as labeled circles
        dog_group = VGroup()
        dog_names = ["Pup A", "Pup B", "Pup C", "Pup D", "Pup E"]
        for i, age in enumerate(ages):
            circle = Circle(radius=0.4, color=BLUE_3B1B, fill_opacity=0.3)
            age_text = Text(str(age), font_size=28, color=WHITE, weight=BOLD)
            age_text.move_to(circle.get_center())
            label = Text(dog_names[i], font_size=14, color=GRAY)
            label.next_to(circle, DOWN, buff=0.08)
            dog = VGroup(circle, age_text, label)
            dog_group.add(dog)

        dog_group.arrange(RIGHT, buff=0.5)
        dog_group.next_to(pop_label, DOWN, buff=0.3)

        self.play(
            LaggedStart(
                *[FadeIn(d, shift=UP * 0.3) for d in dog_group],
                lag_ratio=0.1,
            ),
            run_time=0.8,
        )
        self.wait(0.3)

        # Population parameters
        ages_text = Text(
            "Ages: {0, 2, 5, 8, 10}", font_size=24, color=WHITE,
        )
        ages_text.next_to(dog_group, DOWN, buff=0.25)

        params = VGroup(
            Text("mu = 5", font_size=24, color=YELLOW_3B1B, weight=BOLD),
            Text("Population Range = 10", font_size=24, color=YELLOW_3B1B, weight=BOLD),
        ).arrange(RIGHT, buff=1.0)
        params.next_to(ages_text, DOWN, buff=0.15)

        self.play(Write(ages_text), run_time=0.4)
        self.play(Write(params), run_time=0.5)
        self.wait(0.8)

        # ========== TRANSITION: Shrink population to corner ==========
        pop_everything = VGroup(pop_label, dog_group, ages_text, params)
        self.play(
            FadeOut(subtitle),
            pop_everything.animate.scale(0.42).to_corner(UL, buff=0.3).shift(DOWN * 0.5),
            run_time=0.7,
        )

        # ========== PART A: SAMPLE MEAN (UNBIASED) ==========
        part_a_title = Text(
            "Part A: Is the Sample Mean Unbiased for mu?",
            font_size=28, color=TEAL_3B1B, weight=BOLD,
        )
        part_a_title.next_to(title, DOWN, buff=0.2)
        self.play(Write(part_a_title))
        self.wait(0.3)

        # Show a few example samples with their means
        example_samples_mean = [
            (0, "{0, 2, 5}", "2.33"),
            (6, "{2, 5, 8}", "5.00"),
            (9, "{5, 8, 10}", "7.67"),
        ]

        sample_display = VGroup()
        for idx, (_, sample_str, mean_str) in enumerate(example_samples_mean):
            row = Text(
                f"Sample: {sample_str}  ->  x-bar = {mean_str}",
                font_size=22, color=WHITE,
            )
            sample_display.add(row)

        sample_display.arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        sample_display.move_to(RIGHT * 1.5 + UP * 0.8)

        for row in sample_display:
            self.play(Write(row), run_time=0.35)
            self.wait(0.1)

        self.wait(0.3)

        # Note about all 10 samples
        all_note = Text(
            "All C(5,3) = 10 possible samples of size 3...",
            font_size=20, color=GRAY,
        )
        all_note.next_to(sample_display, DOWN, buff=0.2)
        self.play(Write(all_note), run_time=0.4)
        self.wait(0.3)

        # Build dot plot for sample means
        # Number line from 2 to 8
        self.play(FadeOut(sample_display), FadeOut(all_note), run_time=0.3)

        mean_axis = NumberLine(
            x_range=[1.5, 8.5, 0.5],
            length=9,
            include_numbers=True,
            numbers_to_include=np.arange(2, 9, 1),
            font_size=16,
            include_tip=False,
        )
        mean_axis.shift(DOWN * 0.5)

        mean_axis_label = Text("Sample Mean (x-bar)", font_size=20)
        mean_axis_label.next_to(mean_axis, DOWN, buff=0.25)

        self.play(Create(mean_axis), Write(mean_axis_label), run_time=0.5)

        # Place dots on the number line (stacking for repeated values)
        # Unique sorted means with counts
        rounded_means = [round(m, 2) for m in sample_means]
        dot_positions = {}  # value -> count (for stacking)
        dots_group = VGroup()

        for m in sorted(rounded_means):
            if m not in dot_positions:
                dot_positions[m] = 0
            stack = dot_positions[m]
            dot = Dot(
                mean_axis.n2p(m) + UP * (0.2 + stack * 0.25),
                color=GREEN_3B1B, radius=0.1,
            )
            dots_group.add(dot)
            dot_positions[m] += 1

        self.play(
            LaggedStart(
                *[FadeIn(d, shift=DOWN * 0.2) for d in dots_group],
                lag_ratio=0.06,
            ),
            run_time=1.0,
        )
        self.wait(0.3)

        # Mark the mean of the sampling distribution
        mean_line = DashedLine(
            mean_axis.n2p(5.0) + DOWN * 0.15,
            mean_axis.n2p(5.0) + UP * 1.4,
            color=YELLOW_3B1B, stroke_width=3,
        )
        mean_marker = Text(
            "Mean of all x-bars = 5.0 = mu",
            font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        mean_marker.next_to(mean_line, UP, buff=0.08)

        self.play(Create(mean_line), Write(mean_marker), run_time=0.6)
        self.wait(0.3)

        # UNBIASED verdict
        verdict_a = Text("UNBIASED!", font_size=30, color=GREEN_3B1B, weight=BOLD)
        check = Text("  [checkmark]", font_size=26, color=GREEN_3B1B)
        verdict_row = VGroup(verdict_a, check).arrange(RIGHT, buff=0.1)
        verdict_row.next_to(mean_marker, RIGHT, buff=0.4)

        # Use a simple green circle-check instead
        check_circle = Circle(radius=0.2, color=GREEN_3B1B, fill_opacity=0.3)
        check_mark = Text("ok", font_size=16, color=GREEN_3B1B, weight=BOLD)
        check_mark.move_to(check_circle.get_center())
        check_icon = VGroup(check_circle, check_mark)
        check_icon.next_to(verdict_a, RIGHT, buff=0.15)

        self.play(Write(verdict_a), FadeIn(check_icon), run_time=0.5)
        self.wait(0.8)

        # ========== CLEAR PART A, TRANSITION TO PART B ==========
        part_a_all = VGroup(
            part_a_title, mean_axis, mean_axis_label,
            dots_group, mean_line, mean_marker, verdict_a, check_icon,
        )
        self.play(FadeOut(part_a_all), run_time=0.5)

        # ========== PART B: SAMPLE RANGE (BIASED) ==========
        part_b_title = Text(
            "Part B: Is the Sample Range Unbiased for the Population Range?",
            font_size=26, color=PINK_3B1B, weight=BOLD,
        )
        part_b_title.next_to(title, DOWN, buff=0.2)
        self.play(Write(part_b_title))
        self.wait(0.3)

        # Show a few example samples with their ranges
        example_samples_range = [
            ("{0, 2, 5}", "5 - 0 = 5"),
            ("{2, 5, 8}", "8 - 2 = 6"),
            ("{0, 8, 10}", "10 - 0 = 10"),
        ]

        range_display = VGroup()
        for sample_str, range_str in example_samples_range:
            row = Text(
                f"Sample: {sample_str}  ->  range = {range_str}",
                font_size=22, color=WHITE,
            )
            range_display.add(row)

        range_display.arrange(DOWN, aligned_edge=LEFT, buff=0.12)
        range_display.move_to(RIGHT * 1.5 + UP * 0.8)

        for row in range_display:
            self.play(Write(row), run_time=0.35)
            self.wait(0.1)

        self.wait(0.3)

        all_note2 = Text(
            "All C(5,3) = 10 possible samples of size 3...",
            font_size=20, color=GRAY,
        )
        all_note2.next_to(range_display, DOWN, buff=0.2)
        self.play(Write(all_note2), run_time=0.4)
        self.wait(0.3)

        # Build dot plot for sample ranges
        self.play(FadeOut(range_display), FadeOut(all_note2), run_time=0.3)

        range_axis = NumberLine(
            x_range=[3, 12, 1],
            length=9,
            include_numbers=True,
            numbers_to_include=np.arange(4, 12, 1),
            font_size=16,
            include_tip=False,
        )
        range_axis.shift(DOWN * 0.5)

        range_axis_label = Text("Sample Range", font_size=20)
        range_axis_label.next_to(range_axis, DOWN, buff=0.25)

        self.play(Create(range_axis), Write(range_axis_label), run_time=0.5)

        # Place dots for sample ranges (stacking)
        range_dot_positions = {}
        range_dots_group = VGroup()

        for r in sorted(sample_ranges):
            if r not in range_dot_positions:
                range_dot_positions[r] = 0
            stack = range_dot_positions[r]
            dot = Dot(
                range_axis.n2p(r) + UP * (0.2 + stack * 0.25),
                color=PINK_3B1B, radius=0.1,
            )
            range_dots_group.add(dot)
            range_dot_positions[r] += 1

        self.play(
            LaggedStart(
                *[FadeIn(d, shift=DOWN * 0.2) for d in range_dots_group],
                lag_ratio=0.06,
            ),
            run_time=1.0,
        )
        self.wait(0.3)

        # Mark population range at 10
        pop_range_line = DashedLine(
            range_axis.n2p(10.0) + DOWN * 0.15,
            range_axis.n2p(10.0) + UP * 1.6,
            color=YELLOW_3B1B, stroke_width=3,
        )
        pop_range_label = Text(
            "Pop Range = 10",
            font_size=20, color=YELLOW_3B1B, weight=BOLD,
        )
        pop_range_label.next_to(pop_range_line, UP, buff=0.08)
        self.play(Create(pop_range_line), Write(pop_range_label), run_time=0.5)
        self.wait(0.3)

        # Mark mean of sample ranges at 7.8
        mean_range_line = DashedLine(
            range_axis.n2p(7.8) + DOWN * 0.15,
            range_axis.n2p(7.8) + UP * 1.2,
            color=TEAL_3B1B, stroke_width=3,
        )
        mean_range_label = Text(
            "Mean of ranges = 7.8",
            font_size=20, color=TEAL_3B1B, weight=BOLD,
        )
        mean_range_label.next_to(mean_range_line, UP, buff=0.08)
        self.play(Create(mean_range_line), Write(mean_range_label), run_time=0.5)
        self.wait(0.3)

        # Show the comparison: 7.8 != 10
        neq_text = Text(
            "7.8 != 10  (shifted LEFT of population range)",
            font_size=22, color=RED, weight=BOLD,
        )
        neq_text.next_to(range_axis_label, DOWN, buff=0.3)
        self.play(Write(neq_text), run_time=0.5)
        self.wait(0.3)

        # Draw arrow showing the gap
        gap_arrow = DoubleArrow(
            range_axis.n2p(7.8) + DOWN * 0.3,
            range_axis.n2p(10.0) + DOWN * 0.3,
            color=RED, stroke_width=3, buff=0.05,
        )
        gap_label = Text("Gap!", font_size=18, color=RED)
        gap_label.next_to(gap_arrow, DOWN, buff=0.05)
        self.play(Create(gap_arrow), Write(gap_label), run_time=0.4)
        self.wait(0.3)

        # BIASED verdict
        verdict_b = Text("BIASED!", font_size=30, color=RED, weight=BOLD)
        x_circle = Circle(radius=0.2, color=RED, fill_opacity=0.3)
        x_mark = Text("X", font_size=20, color=RED, weight=BOLD)
        x_mark.move_to(x_circle.get_center())
        x_icon = VGroup(x_circle, x_mark)

        verdict_b_row = VGroup(verdict_b, x_icon).arrange(RIGHT, buff=0.15)
        verdict_b_row.to_corner(UR, buff=0.5).shift(DOWN * 0.3)

        self.play(Write(verdict_b), FadeIn(x_icon), run_time=0.5)

        bias_note = Text(
            "Sample range tends to UNDERESTIMATE\nthe population range",
            font_size=20, color=PINK_3B1B,
        )
        bias_note.next_to(verdict_b_row, DOWN, buff=0.2)
        self.play(Write(bias_note), run_time=0.6)
        self.wait(1.0)

        # ========== CLEAR AND SHOW KEY INSIGHT ==========
        self.play(
            FadeOut(part_b_title), FadeOut(range_axis), FadeOut(range_axis_label),
            FadeOut(range_dots_group), FadeOut(pop_range_line), FadeOut(pop_range_label),
            FadeOut(mean_range_line), FadeOut(mean_range_label), FadeOut(neq_text),
            FadeOut(gap_arrow), FadeOut(gap_label),
            FadeOut(verdict_b), FadeOut(x_icon), FadeOut(bias_note),
            FadeOut(pop_everything), FadeOut(title),
            run_time=0.5,
        )

        # ========== KEY INSIGHT BOX ==========
        insight_content = VGroup(
            Text(
                "How to Check for Bias",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=8),  # spacer
            Text(
                "Compare the mean of the sampling distribution",
                font_size=26,
            ),
            Text(
                "to the population parameter",
                font_size=26,
            ),
            Text("", font_size=8),  # spacer
            Text(
                "If they are EQUAL --> Unbiased",
                font_size=24, color=GREEN_3B1B,
            ),
            Text(
                "If they are NOT equal --> Biased",
                font_size=24, color=RED,
            ),
            Text("", font_size=8),  # spacer
            Text(
                "x-bar is unbiased for mu  (mean of x-bars = mu)",
                font_size=22, color=TEAL_3B1B,
            ),
            Text(
                "Sample range is biased for population range",
                font_size=22, color=PINK_3B1B,
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
