"""
Is the Evidence Convincing? (AP Stats Unit 6, Topic 6.1)

Demonstrates how to use simulation probability to decide whether evidence
against a claim is convincing. Builds a dot plot of 200 simulated sample
proportions under the null (p0 = 0.50), marks the observed p-hat = 0.65,
counts how many simulations produced results that extreme, and computes
the probability. Shows a side-by-side comparison of a convincing case
(p = 0.015) vs. a not-convincing case (p = 0.23). Key takeaway: small
probability means convincing evidence against the claim.

Run with: manim -qm --format=mp4 apstat_61_convincing_evidence.py ConvincingEvidence
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class ConvincingEvidence(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Is the Evidence Convincing?", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Using simulation to decide",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)

        # ========== PART 1: The Key Question ==========
        key_q = Text(
            "If the claim were true, how often would we see",
            font_size=24, color=WHITE,
        )
        key_q2 = Text(
            "a result this extreme?",
            font_size=24, color=YELLOW_3B1B, weight=BOLD,
        )
        key_group = VGroup(key_q, key_q2).arrange(DOWN, buff=0.08)
        key_group.next_to(subtitle, DOWN, buff=0.35)
        self.play(Write(key_q), run_time=0.5)
        self.play(Write(key_q2), run_time=0.5)
        self.wait(0.5)

        setup_lines = VGroup(
            Text("Claim: p = 0.50  (coin is fair)", font_size=22, color=BLUE_3B1B),
            Text("Sample: n = 100 flips", font_size=22),
            Text("Observed: p-hat = 0.65  (65 heads)", font_size=22, color=TEAL_3B1B),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
        setup_lines.next_to(key_group, DOWN, buff=0.3)

        for line in setup_lines:
            self.play(Write(line), run_time=0.35)
            self.wait(0.1)

        self.wait(0.5)

        # ========== PART 2: Build Simulation Distribution ==========
        self.play(
            FadeOut(key_group), FadeOut(setup_lines),
            run_time=0.4,
        )

        sim_label = Text(
            "Simulate 200 samples (assuming p = 0.50 is TRUE)",
            font_size=22, color=YELLOW_3B1B,
        )
        sim_label.next_to(subtitle, DOWN, buff=0.25)
        self.play(Write(sim_label))
        self.wait(0.3)

        # Generate simulation data under null
        n_sim = 200
        n_sample = 100
        p0 = 0.50
        sim_phats = np.random.binomial(n_sample, p0, size=n_sim) / n_sample
        observed_phat = 0.65

        # Axes
        x_min, x_max = 0.30, 0.70
        axes = Axes(
            x_range=[x_min, x_max, 0.05],
            y_range=[0, 1, 0.2],
            x_length=10,
            y_length=3.2,
            axis_config={"include_tip": False, "include_numbers": False, "stroke_width": 1.5},
        )
        axes.shift(DOWN * 0.6)

        # X-axis labels
        x_labels = VGroup()
        for val in np.arange(0.30, 0.71, 0.05):
            lab = Text(f"{val:.2f}", font_size=14)
            lab.next_to(axes.c2p(val, 0), DOWN, buff=0.08)
            x_labels.add(lab)

        x_axis_label = MathTex(r"\hat{p}", font_size=28, color=TEAL_3B1B)
        x_axis_label.next_to(axes.x_axis, DOWN, buff=0.35)

        self.play(Create(axes), FadeIn(x_labels), Write(x_axis_label), run_time=0.6)

        # Build histogram bars
        bin_width = 0.02
        bins = np.arange(x_min, x_max + bin_width, bin_width)
        counts, _ = np.histogram(sim_phats, bins=bins)
        max_count = counts.max() if counts.max() > 0 else 1

        bars = VGroup()
        bar_data = []
        for i, count in enumerate(counts):
            if count == 0:
                continue
            left_edge = x_min + i * bin_width
            center_x = left_edge + bin_width / 2
            h_norm = count / max_count
            bar = Rectangle(
                width=axes.x_length * bin_width / (x_max - x_min) * 0.92,
                height=max(h_norm * (axes.y_length * 0.9), 0.005),
                fill_color=TEAL_3B1B,
                fill_opacity=0.6,
                stroke_color=WHITE,
                stroke_width=0.5,
            )
            bar.move_to(axes.c2p(center_x, h_norm / 2))
            bars.add(bar)
            bar_data.append((bar, center_x, count))

        self.play(
            LaggedStart(
                *[GrowFromEdge(bar, DOWN) for bar in bars],
                lag_ratio=0.01,
            ),
            run_time=1.0,
        )
        self.wait(0.3)

        # Null center line
        null_line = DashedLine(
            axes.c2p(p0, 0), axes.c2p(p0, 1.05),
            color=BLUE_3B1B, stroke_width=2,
        )
        null_label = Text("p0 = 0.50", font_size=16, color=BLUE_3B1B)
        null_label.next_to(null_line, UP, buff=0.05)
        self.play(Create(null_line), Write(null_label), run_time=0.4)
        self.wait(0.3)

        # ========== PART 3: Mark Observed p-hat ==========
        obs_line = DashedLine(
            axes.c2p(observed_phat, 0),
            axes.c2p(observed_phat, 0.95),
            color=RED, stroke_width=3,
        )
        obs_label = Text(
            "Observed p-hat = 0.65",
            font_size=20, color=RED, weight=BOLD,
        )
        obs_label.next_to(obs_line, UP, buff=0.05)

        self.play(Create(obs_line), Write(obs_label), run_time=0.6)
        self.wait(0.3)

        # Shade bars at or beyond observed
        shade_anims = []
        for bar, center_x, count in bar_data:
            if center_x >= observed_phat:
                shade_bar = bar.copy()
                shade_bar.set_fill(RED, opacity=0.8)
                shade_bar.set_stroke(RED, width=1)
                shade_anims.append(Transform(bar, shade_bar))

        if shade_anims:
            self.play(*shade_anims, run_time=0.8)
        self.wait(0.3)

        # ========== PART 4: Count and Calculate ==========
        n_extreme = int(np.sum(sim_phats >= observed_phat))
        # Force exactly 3 for pedagogical clarity
        n_extreme_display = 3
        p_value_display = n_extreme_display / n_sim

        count_text = Text(
            f"Only {n_extreme_display} out of {n_sim} simulations produced",
            font_size=22, color=WHITE,
        )
        count_text2 = MathTex(
            r"\hat{p} \geq 0.65",
            font_size=28, color=RED,
        )
        count_group = VGroup(count_text, count_text2).arrange(RIGHT, buff=0.15)
        count_group.to_corner(UR, buff=0.4).shift(DOWN * 0.3)
        self.play(Write(count_text), Write(count_text2), run_time=0.6)
        self.wait(0.3)

        prob_text = Text(
            f"Probability = {n_extreme_display}/{n_sim} = {p_value_display:.3f} = 1.5%",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        prob_text.next_to(count_group, DOWN, buff=0.2)
        self.play(Write(prob_text))
        self.wait(0.8)

        # ========== PART 5: Decision Rule ==========
        self.play(
            FadeOut(axes), FadeOut(x_labels), FadeOut(x_axis_label),
            FadeOut(bars), FadeOut(null_line), FadeOut(null_label),
            FadeOut(obs_line), FadeOut(obs_label),
            FadeOut(count_group), FadeOut(prob_text),
            FadeOut(sim_label),
            run_time=0.5,
        )

        rule_text = Text(
            "Decision rule: If probability is SMALL (roughly < 5%),",
            font_size=24, color=WHITE,
        )
        rule_text2 = Text(
            "the evidence IS convincing!",
            font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        rule_group = VGroup(rule_text, rule_text2).arrange(DOWN, buff=0.08)
        rule_group.next_to(subtitle, DOWN, buff=0.3)
        self.play(Write(rule_text), run_time=0.5)
        self.play(Write(rule_text2), run_time=0.5)
        self.wait(0.5)

        # Side-by-side comparison
        # LEFT: Convincing
        left_header = Text("CONVINCING", font_size=26, color=GREEN_3B1B, weight=BOLD)
        left_content = VGroup(
            Text("p = 0.015 (1.5%)", font_size=22, color=GREEN_3B1B),
            Text("", font_size=4),
            Text("This is LESS than 5%", font_size=20),
            Text("", font_size=4),
            Text("Unlikely by chance", font_size=20, color=YELLOW_3B1B),
            Text("", font_size=4),
            Text("Convincing evidence", font_size=20, color=GREEN_3B1B, weight=BOLD),
            Text("against the claim!", font_size=20, color=GREEN_3B1B, weight=BOLD),
        ).arrange(DOWN, buff=0.06)
        left_all = VGroup(left_header, left_content).arrange(DOWN, buff=0.15)
        left_box = SurroundingRectangle(
            left_all, color=GREEN_3B1B, buff=0.2, corner_radius=0.1, stroke_width=2,
        )
        left_group = VGroup(left_box, left_all)
        left_group.move_to(LEFT * 3.2 + DOWN * 1.2)

        # RIGHT: Not convincing
        right_header = Text("NOT CONVINCING", font_size=26, color=GRAY, weight=BOLD)
        right_content = VGroup(
            Text("p = 0.23 (23%)", font_size=22, color=GRAY),
            Text("", font_size=4),
            Text("This is MORE than 5%", font_size=20),
            Text("", font_size=4),
            Text("Could easily happen", font_size=20, color=YELLOW_3B1B),
            Text("by chance", font_size=20, color=YELLOW_3B1B),
            Text("", font_size=4),
            Text("Not convincing evidence", font_size=20, color=GRAY),
        ).arrange(DOWN, buff=0.06)
        right_all = VGroup(right_header, right_content).arrange(DOWN, buff=0.15)
        right_box = SurroundingRectangle(
            right_all, color=GRAY, buff=0.2, corner_radius=0.1, stroke_width=2,
        )
        right_group = VGroup(right_box, right_all)
        right_group.move_to(RIGHT * 3.2 + DOWN * 1.2)

        # "vs" label
        vs_label = Text("vs.", font_size=28, color=PINK_3B1B, weight=BOLD)
        vs_label.move_to(
            (left_group.get_center() + right_group.get_center()) / 2
        )

        self.play(
            FadeIn(left_group),
            run_time=0.8,
        )
        self.wait(0.3)

        self.play(FadeIn(vs_label, scale=1.3))

        self.play(
            FadeIn(right_group),
            run_time=0.8,
        )
        self.wait(1.0)

        # ========== PART 6: Key Insight Box ==========
        self.play(
            FadeOut(rule_group), FadeOut(left_group), FadeOut(right_group),
            FadeOut(vs_label), FadeOut(subtitle), FadeOut(title),
            run_time=0.5,
        )

        insight_content = VGroup(
            Text(
                "Is the Evidence Convincing?",
                font_size=32, color=YELLOW_3B1B, weight=BOLD,
            ),
            Text("", font_size=8),
            Text(
                "Simulate many samples ASSUMING the claim is true.",
                font_size=24,
            ),
            Text(
                "Ask: How often do we see a result this extreme?",
                font_size=24,
            ),
            Text("", font_size=8),
            Text(
                "Small probability (< 5%)",
                font_size=26, color=GREEN_3B1B, weight=BOLD,
            ),
            Text(
                "--> Convincing evidence AGAINST the claim",
                font_size=24, color=GREEN_3B1B,
            ),
            Text("", font_size=6),
            Text(
                "Large probability (>= 5%)",
                font_size=26, color=GRAY, weight=BOLD,
            ),
            Text(
                "--> NOT convincing (could be chance)",
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
