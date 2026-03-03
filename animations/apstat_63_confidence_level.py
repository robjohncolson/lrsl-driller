"""
Interpreting the Confidence Level (AP Stats Unit 6, Topic 6.3)

Illustrates what "95% confidence" actually means through repeated sampling.
Animates multiple confidence intervals from different samples on the same
number line. Green intervals capture the true p, red intervals miss it.
Shows the correct interpretation (repeated sampling) vs. the common
misconception (probability that THIS interval captures p).

Run with: manim -qm --format=mp4 apstat_63_confidence_level.py ConfidenceLevel
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ConfidenceLevel(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(2026)

        # ================================================================
        # TITLE
        # ================================================================
        title = Text("What Does 95% Confidence Mean?", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "It describes repeated sampling, NOT a single interval",
            font_size=22, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ================================================================
        # SIMULATION: Many CIs from repeated samples
        # ================================================================
        sim_label = Text(
            "Imagine taking many samples of size n = 50 (true p = 0.30)",
            font_size=22, color=YELLOW_3B1B,
        )
        sim_label.next_to(subtitle, DOWN, buff=0.25)
        self.play(Write(sim_label), run_time=0.5)

        # True proportion line
        true_p = 0.30
        n = 50

        # Generate 20 sample proportions
        n_intervals = 20
        phats = np.random.binomial(n, true_p, size=n_intervals) / n

        # Calculate 95% CIs
        z_star = 1.96
        intervals = []
        for phat in phats:
            se = np.sqrt(phat * (1 - phat) / n) if phat > 0 and phat < 1 else 0.05
            me = z_star * se
            lower = phat - me
            upper = phat + me
            captures = lower <= true_p <= upper
            intervals.append((phat, lower, upper, captures))

        # Number line
        nl = NumberLine(
            x_range=[0.0, 0.60, 0.05],
            length=11,
            include_numbers=True,
            numbers_to_include=[0.0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60],
            font_size=13,
            decimal_number_config={"num_decimal_places": 2},
            include_tip=False,
        )
        nl.move_to(DOWN * 0.1)
        self.play(Create(nl), run_time=0.6)

        # True p vertical line
        true_p_pos = nl.n2p(true_p)
        true_line = DashedLine(
            true_p_pos + DOWN * 3.0, true_p_pos + UP * 0.4,
            color=BLUE_3B1B, stroke_width=2, dash_length=0.08,
        )
        true_label = Text("p = 0.30", font_size=16, color=BLUE_3B1B, weight=BOLD)
        true_label.next_to(true_line, UP, buff=0.05)
        self.play(Create(true_line), Write(true_label), run_time=0.5)
        self.wait(0.3)

        # Draw intervals one by one (stacked below number line)
        ci_lines = VGroup()
        n_captures = 0
        spacing = 0.22

        # First 8 animate one by one, rest in batch
        for i, (phat, lower, upper, captures) in enumerate(intervals):
            color = GREEN_3B1B if captures else RED
            y_offset = DOWN * (0.5 + i * spacing)

            left_pt = nl.n2p(max(lower, 0.0)) + y_offset
            right_pt = nl.n2p(min(upper, 0.60)) + y_offset
            center_pt = nl.n2p(phat) + y_offset

            ci_bar = Line(left_pt, right_pt, color=color, stroke_width=3)
            ci_dot = Dot(center_pt, radius=0.04, color=color)
            ci_group = VGroup(ci_bar, ci_dot)
            ci_lines.add(ci_group)

            if captures:
                n_captures += 1

            if i < 8:
                self.play(Create(ci_bar), FadeIn(ci_dot), run_time=0.25)
            elif i == 8:
                # Batch the rest
                remaining = VGroup()
                remaining.add(ci_group)
                for j in range(i + 1, n_intervals):
                    phat_j, lower_j, upper_j, captures_j = intervals[j]
                    c = GREEN_3B1B if captures_j else RED
                    y_off = DOWN * (0.5 + j * spacing)
                    lp = nl.n2p(max(lower_j, 0.0)) + y_off
                    rp = nl.n2p(min(upper_j, 0.60)) + y_off
                    cp = nl.n2p(phat_j) + y_off
                    bar = Line(lp, rp, color=c, stroke_width=3)
                    dot = Dot(cp, radius=0.04, color=c)
                    grp = VGroup(bar, dot)
                    ci_lines.add(grp)
                    remaining.add(grp)
                    if captures_j:
                        n_captures += 1
                self.play(
                    LaggedStart(
                        *[FadeIn(g) for g in remaining],
                        lag_ratio=0.05,
                    ),
                    run_time=1.0,
                )
                break

        self.wait(0.5)

        # Count
        pct = int(round(n_captures / n_intervals * 100))
        count_text = Text(
            f"{n_captures} of {n_intervals} intervals ({pct}%) capture p = 0.30",
            font_size=22, color=YELLOW_3B1B, weight=BOLD,
        )
        count_text.to_edge(DOWN, buff=0.2)
        self.play(Write(count_text), run_time=0.6)
        self.wait(0.8)

        # ================================================================
        # TRANSITION: Clear simulation, show interpretation
        # ================================================================
        self.play(
            FadeOut(sim_label), FadeOut(nl), FadeOut(true_line), FadeOut(true_label),
            FadeOut(ci_lines), FadeOut(count_text),
            run_time=0.5,
        )

        # ================================================================
        # CORRECT INTERPRETATION
        # ================================================================
        correct_header = Text(
            "Correct Interpretation", font_size=28, color=GREEN_3B1B, weight=BOLD,
        )
        correct_header.next_to(subtitle, DOWN, buff=0.3)
        self.play(Write(correct_header), run_time=0.4)

        correct_text = VGroup(
            Text("\"In repeated random sampling with the same", font_size=22),
            Text("sample size, approximately 95% of", font_size=22),
            Text("95% confidence intervals will capture", font_size=22),
            Text("the population proportion.\"", font_size=22),
        ).arrange(DOWN, buff=0.06)
        correct_text.next_to(correct_header, DOWN, buff=0.2)

        correct_box = SurroundingRectangle(
            correct_text, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
        )

        self.play(Write(correct_text), run_time=1.5)
        self.play(Create(correct_box), run_time=0.4)
        self.wait(0.8)

        # ================================================================
        # COMMON MISCONCEPTION
        # ================================================================
        wrong_header = VGroup(
            Text("X", font_size=26, color=RED, weight=BOLD),
            Text("  Common Misconception", font_size=26, color=RED, weight=BOLD),
        ).arrange(RIGHT, buff=0.08)
        wrong_header.next_to(correct_box, DOWN, buff=0.35)
        self.play(Write(wrong_header), run_time=0.4)

        wrong_text = Text(
            "\"There is a 95% probability that THIS interval contains p.\"",
            font_size=22, color=RED,
        )
        wrong_text.next_to(wrong_header, DOWN, buff=0.15)
        self.play(Write(wrong_text), run_time=0.6)

        fix_text = VGroup(
            Text("Once calculated, an interval either captures p", font_size=20, color=GREY_B),
            Text("(probability = 1) or does not (probability = 0).", font_size=20, color=GREY_B),
        ).arrange(DOWN, buff=0.04)
        fix_text.next_to(wrong_text, DOWN, buff=0.12)
        self.play(Write(fix_text), run_time=0.7)
        self.wait(0.8)

        # ================================================================
        # FINAL KEY INSIGHT BOX
        # ================================================================
        self.play(
            FadeOut(subtitle), FadeOut(title),
            FadeOut(correct_header), FadeOut(correct_text), FadeOut(correct_box),
            FadeOut(wrong_header), FadeOut(wrong_text), FadeOut(fix_text),
            run_time=0.5,
        )

        final_content = VGroup(
            Text("Confidence Level", font_size=34, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=8),
            Text("Describes repeated sampling behavior:", font_size=24),
            Text("~C% of C% CIs will capture the true parameter", font_size=24, color=GREEN_3B1B),
            Text("", font_size=6),
            Text("Does NOT describe a single interval:", font_size=24, color=RED),
            Text("A specific CI has probability 1 or 0 of capturing p", font_size=22, color=RED),
            Text("", font_size=6),
            Text("Confidence describes the METHOD, not the result", font_size=22, color=TEAL_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.1)
        final_content.move_to(ORIGIN)

        final_box = SurroundingRectangle(
            final_content, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in final_content],
                lag_ratio=0.15,
            ),
            run_time=2.5,
        )
        self.play(Create(final_box), run_time=0.5)
        self.wait(2.5)
