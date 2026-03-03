"""
Estimator Bias Concept (AP Stats Unit 5, Topic 5.4b)

Teaches the difference between biased and unbiased estimators using a
bullseye/target analogy. Shows that an unbiased estimator's samples scatter
around the true parameter (center of target), while a biased estimator's
samples systematically miss to one side. Highlights that x-bar is always
unbiased for mu, sample range is biased for population range, and clarifies
that bias refers to the systematic tendency across ALL samples, not any
single sample missing the target.

Run with: manim -qm --format=mp4 apstat_54_estimator_bias_concept.py EstimatorBiasConcept
"""
from manim import *
import numpy as np

# Consistent color scheme
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class EstimatorBiasConcept(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"
        np.random.seed(42)

        # ========== TITLE ==========
        title = Text("Biased vs Unbiased Estimators", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== DEFINITION ==========
        defn_line1 = Text(
            "An estimator is unbiased if, on average,",
            font_size=24,
        )
        defn_line2 = Text(
            "the value of the estimator equals the population parameter.",
            font_size=24, color=YELLOW_3B1B,
        )
        defn_group = VGroup(defn_line1, defn_line2).arrange(DOWN, buff=0.1)
        defn_group.next_to(title, DOWN, buff=0.4)

        self.play(Write(defn_line1), run_time=0.8)
        self.play(Write(defn_line2), run_time=0.8)
        self.wait(1.0)

        # Fade definition and shift title up
        self.play(FadeOut(defn_group), run_time=0.4)

        # ========== BULLSEYE TARGETS ==========
        # -- Helper to draw concentric target rings --
        def make_target(center, label_text, label_color=WHITE):
            rings = VGroup()
            radii = [1.2, 0.85, 0.5, 0.15]
            colors = ["#333333", "#444444", "#555555", YELLOW_3B1B]
            opacities = [0.4, 0.5, 0.6, 0.9]
            for r, c, o in zip(radii, colors, opacities):
                ring = Circle(
                    radius=r, color=c, fill_color=c,
                    fill_opacity=o, stroke_width=1.5, stroke_color=GREY,
                )
                ring.move_to(center)
                rings.add(ring)
            # Crosshair
            h_line = Line(
                center + LEFT * 1.3, center + RIGHT * 1.3,
                stroke_width=1, color=GREY,
            )
            v_line = Line(
                center + DOWN * 1.3, center + UP * 1.3,
                stroke_width=1, color=GREY,
            )
            label = Text(label_text, font_size=20, color=label_color)
            label.next_to(rings, DOWN, buff=0.25)
            return VGroup(rings, h_line, v_line), label

        # Positions for the two targets
        left_center = LEFT * 3.2 + DOWN * 0.3
        right_center = RIGHT * 3.2 + DOWN * 0.3

        target_left, label_left = make_target(
            left_center, "Unbiased: centered on target", TEAL_3B1B
        )
        target_right, label_right = make_target(
            right_center, "Biased: systematically off-center", PINK_3B1B
        )

        self.play(
            FadeIn(target_left), Write(label_left),
            FadeIn(target_right), Write(label_right),
            run_time=1.0,
        )
        self.wait(0.3)

        # -- Generate dots for UNBIASED estimator --
        # Dots scattered around the center; average = center
        num_dots = 18
        unbiased_offsets = np.random.normal(0, 0.4, size=(num_dots, 2))
        # Force the mean to be exactly center (unbias the sample visually)
        unbiased_offsets -= unbiased_offsets.mean(axis=0)

        unbiased_dots = VGroup()
        for ox, oy in unbiased_offsets:
            dot = Dot(
                point=left_center + RIGHT * ox + UP * oy,
                radius=0.06, color=TEAL_3B1B,
            )
            unbiased_dots.add(dot)

        # -- Generate dots for BIASED estimator --
        # Dots shifted systematically to the right and slightly down
        bias_shift = np.array([0.45, -0.15])
        biased_offsets = np.random.normal(0, 0.35, size=(num_dots, 2))
        biased_offsets -= biased_offsets.mean(axis=0)
        biased_offsets += bias_shift  # apply systematic bias

        biased_dots = VGroup()
        for ox, oy in biased_offsets:
            dot = Dot(
                point=right_center + RIGHT * ox + UP * oy,
                radius=0.06, color=PINK_3B1B,
            )
            biased_dots.add(dot)

        # Animate dots appearing
        self.play(
            LaggedStart(
                *[FadeIn(d, scale=0.5) for d in unbiased_dots],
                lag_ratio=0.04,
            ),
            LaggedStart(
                *[FadeIn(d, scale=0.5) for d in biased_dots],
                lag_ratio=0.04,
            ),
            run_time=1.5,
        )
        self.wait(0.5)

        # Show average marker for unbiased (right at center)
        avg_unbiased = Dot(left_center, radius=0.1, color=YELLOW_3B1B)
        avg_unbiased_label = Text("avg", font_size=16, color=YELLOW_3B1B)
        avg_unbiased_label.next_to(avg_unbiased, UR, buff=0.08)

        # Show average marker for biased (shifted)
        biased_avg_pos = right_center + RIGHT * bias_shift[0] + UP * bias_shift[1]
        avg_biased = Dot(biased_avg_pos, radius=0.1, color=YELLOW_3B1B)
        avg_biased_label = Text("avg", font_size=16, color=YELLOW_3B1B)
        avg_biased_label.next_to(avg_biased, UR, buff=0.08)

        self.play(
            FadeIn(avg_unbiased, scale=1.5), Write(avg_unbiased_label),
            FadeIn(avg_biased, scale=1.5), Write(avg_biased_label),
            run_time=0.6,
        )
        self.wait(0.8)

        # "avg = center" annotation for unbiased
        check_label = Text("avg = target!", font_size=18, color=GREEN_3B1B)
        check_label.next_to(label_left, DOWN, buff=0.15)
        self.play(Write(check_label), run_time=0.5)

        # "avg != center" annotation for biased
        x_label = Text("avg != target", font_size=18, color=PINK_3B1B)
        x_label.next_to(label_right, DOWN, buff=0.15)
        self.play(Write(x_label), run_time=0.5)
        self.wait(1.0)

        # ========== TRANSITION: Clear targets, show key facts ==========
        all_target_stuff = VGroup(
            target_left, label_left, unbiased_dots, avg_unbiased,
            avg_unbiased_label, check_label,
            target_right, label_right, biased_dots, avg_biased,
            avg_biased_label, x_label,
        )
        self.play(FadeOut(all_target_stuff), run_time=0.6)

        # ========== KEY FACT 1: x-bar unbiased ==========
        fact1 = VGroup(
            MathTex(r"\bar{x}", font_size=36, color=GREEN_3B1B),
            Text(" is ALWAYS unbiased for ", font_size=28),
            MathTex(r"\mu", font_size=36, color=GREEN_3B1B),
        ).arrange(RIGHT, buff=0.1)
        fact1.move_to(UP * 0.8)

        fact1_box = SurroundingRectangle(
            fact1, color=GREEN_3B1B, buff=0.2, corner_radius=0.1,
        )

        self.play(Write(fact1), run_time=0.8)
        self.play(Create(fact1_box), run_time=0.4)
        self.wait(0.6)

        # ========== KEY FACT 2: Sample range biased ==========
        fact2 = Text(
            "Sample range is BIASED for population range",
            font_size=28, color=PINK_3B1B,
        )
        fact2.move_to(DOWN * 0.5)

        fact2_box = SurroundingRectangle(
            fact2, color=PINK_3B1B, buff=0.2, corner_radius=0.1,
        )

        self.play(Write(fact2), run_time=0.8)
        self.play(Create(fact2_box), run_time=0.4)
        self.wait(0.8)

        # Explanation beneath
        explain = Text(
            "(Samples can never capture the full population spread)",
            font_size=20, color=GREY_B,
        )
        explain.next_to(fact2_box, DOWN, buff=0.2)
        self.play(FadeIn(explain), run_time=0.5)
        self.wait(0.8)

        # ========== TRANSITION: Clear facts, show insight ==========
        self.play(
            FadeOut(fact1), FadeOut(fact1_box),
            FadeOut(fact2), FadeOut(fact2_box),
            FadeOut(explain),
            run_time=0.5,
        )

        # ========== INSIGHT BOX ==========
        insight_lines = VGroup(
            Text("Key Distinction", font_size=32, color=YELLOW_3B1B, weight=BOLD),
            Text("", font_size=10),  # spacer
            Text(
                "Bias is NOT about one sample missing the target.",
                font_size=24,
            ),
            Text("", font_size=10),  # spacer
            Text(
                "Bias = systematic tendency across",
                font_size=26, color=TEAL_3B1B,
            ),
            Text(
                "ALL possible samples.",
                font_size=26, color=TEAL_3B1B, weight=BOLD,
            ),
        ).arrange(DOWN, buff=0.12)
        insight_lines.move_to(ORIGIN)

        insight_box = SurroundingRectangle(
            insight_lines, color=YELLOW_3B1B, buff=0.35, corner_radius=0.15,
        )

        self.play(
            LaggedStart(
                *[Write(line) for line in insight_lines],
                lag_ratio=0.25,
            ),
            run_time=2.5,
        )
        self.play(Create(insight_box), run_time=0.5)
        self.wait(2.5)
