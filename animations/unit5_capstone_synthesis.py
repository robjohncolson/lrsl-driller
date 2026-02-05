"""
Unit 5 Capstone Synthesis Animation (Topics 5.1-5.2)

Visual concept-map review connecting ALL major ideas from Unit 5:
Sampling Variability -> Sampling Distribution -> Normal Distribution ->
Finding Probabilities / Finding Values / Combining Distributions.
Each node flashes its key visual. Ends with a summary banner.

To render:
    manim -qm --format=mp4 unit5_capstone_synthesis.py Unit5CapstoneSynthesis
"""

from manim import *
import numpy as np
from scipy.stats import norm

# 3Blue1Brown-style colors
BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class Unit5CapstoneSynthesis(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ── Title ──
        title = Text("Unit 5.1-5.2 Capstone Synthesis",
                      font_size=44, color=WHITE, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ──────────────────────────────────────────────
        # NODE DEFINITIONS (concept map)
        # ──────────────────────────────────────────────

        # Helper: rounded rectangle node
        def make_node(text, color, pos, width=3.2, height=0.7, font_size=22):
            box = RoundedRectangle(
                corner_radius=0.15,
                width=width,
                height=height,
                stroke_color=color,
                stroke_width=2.5,
                fill_color=color,
                fill_opacity=0.12,
            )
            box.move_to(pos)
            label = Text(text, font_size=font_size, color=color, weight=BOLD)
            label.move_to(box.get_center())
            return VGroup(box, label)

        # Row 1 - origin
        node_var = make_node("Sampling Variability", BLUE_3B1B,
                             UP * 1.8, width=3.6)

        # Row 2
        node_dist = make_node("Sampling Distribution", TEAL_3B1B,
                              UP * 0.5, width=3.8)

        # Row 3
        node_normal = make_node("Normal Distribution", YELLOW_3B1B,
                                DOWN * 0.8, width=3.6)

        # Row 4 - three leaves
        node_prob = make_node("Finding\nProbabilities", GREEN_3B1B,
                              DOWN * 2.3 + LEFT * 4, width=2.8, height=0.8,
                              font_size=20)
        node_vals = make_node("Finding\nValues", PINK_3B1B,
                              DOWN * 2.3, width=2.8, height=0.8,
                              font_size=20)
        node_combo = make_node("Combining\nDistributions", RED,
                               DOWN * 2.3 + RIGHT * 4, width=2.8, height=0.8,
                               font_size=20)

        all_nodes = [node_var, node_dist, node_normal,
                     node_prob, node_vals, node_combo]

        # ──────────────────────────────────────────────
        # ARROWS
        # ──────────────────────────────────────────────
        arrow_1 = Arrow(
            node_var[0].get_bottom(), node_dist[0].get_top(),
            color=WHITE, buff=0.1, stroke_width=2.5,
        )
        arrow_2 = Arrow(
            node_dist[0].get_bottom(), node_normal[0].get_top(),
            color=WHITE, buff=0.1, stroke_width=2.5,
        )
        arrow_3a = Arrow(
            node_normal[0].get_bottom() + LEFT * 0.8,
            node_prob[0].get_top(),
            color=GREEN_3B1B, buff=0.1, stroke_width=2,
        )
        arrow_3b = Arrow(
            node_normal[0].get_bottom(),
            node_vals[0].get_top(),
            color=PINK_3B1B, buff=0.1, stroke_width=2,
        )
        arrow_3c = Arrow(
            node_normal[0].get_bottom() + RIGHT * 0.8,
            node_combo[0].get_top(),
            color=RED, buff=0.1, stroke_width=2,
        )

        all_arrows = [arrow_1, arrow_2, arrow_3a, arrow_3b, arrow_3c]

        # ──────────────────────────────────────────────
        # MINI VISUALS (flash next to each node)
        # ──────────────────────────────────────────────

        # Mini-visual 1: scattered dots (sampling variability)
        np.random.seed(7)
        dots_group = VGroup()
        for _ in range(15):
            d = Dot(
                point=node_var[0].get_center() + np.array([
                    np.random.uniform(-1.4, 1.4),
                    np.random.uniform(-0.2, 0.2),
                    0,
                ]),
                radius=0.04,
                color=BLUE_3B1B,
            )
            dots_group.add(d)

        # Mini-visual 2: mini histogram (sampling distribution)
        mini_hist = VGroup()
        hist_heights = [0.15, 0.35, 0.55, 0.75, 0.95, 0.75, 0.55, 0.35, 0.15]
        for i, h in enumerate(hist_heights):
            bar = Rectangle(
                width=0.12, height=h * 0.4,
                fill_color=TEAL_3B1B, fill_opacity=0.6,
                stroke_color=TEAL_3B1B, stroke_width=1,
            )
            bar.move_to(
                node_dist[0].get_right() + RIGHT * 0.6 + RIGHT * i * 0.14
                + UP * (h * 0.2 - 0.15)
            )
            mini_hist.add(bar)

        # Mini-visual 3: bell curve (normal distribution)
        xs_mini = np.linspace(-2.5, 2.5, 80)
        ys_mini = norm.pdf(xs_mini, 0, 1)
        bell_pts = []
        center_bell = node_normal[0].get_right() + RIGHT * 1.2
        for x, y in zip(xs_mini, ys_mini):
            bell_pts.append(center_bell + np.array([x * 0.3, y * 0.8 - 0.15, 0]))
        mini_bell = VMobject(stroke_color=YELLOW_3B1B, stroke_width=2)
        mini_bell.set_points_smoothly(bell_pts)

        # Mini-visual 4: shaded area (probabilities)
        shade_pts_mini = []
        xs_sh = np.linspace(-2.5, -0.5, 40)
        center_shade = node_prob[0].get_right() + RIGHT * 0.8
        for x in xs_sh:
            y = norm.pdf(x, 0, 1)
            shade_pts_mini.append(center_shade + np.array([x * 0.25, y * 0.6, 0]))
        shade_pts_mini.append(center_shade + np.array([-0.5 * 0.25, 0, 0]))
        shade_pts_mini.append(center_shade + np.array([-2.5 * 0.25, 0, 0]))
        mini_shade = Polygon(
            *shade_pts_mini,
            fill_color=GREEN_3B1B, fill_opacity=0.5,
            stroke_color=GREEN_3B1B, stroke_width=1,
        )

        # Mini-visual 5: inverse arrow (finding values)
        inv_arrow = Arrow(
            node_vals[0].get_right() + RIGHT * 0.3,
            node_vals[0].get_right() + RIGHT * 1.2,
            color=PINK_3B1B, buff=0, stroke_width=3,
        )
        inv_label = Text("z*", font_size=22, color=PINK_3B1B)
        inv_label.next_to(inv_arrow, UP, buff=0.05)

        # Mini-visual 6: two curves merging (combining)
        merge_center = node_combo[0].get_right() + RIGHT * 1
        xs_m1 = np.linspace(-2, 2, 40)
        merge_pts1 = [
            merge_center + np.array([x * 0.2 - 0.3, norm.pdf(x, 0, 1) * 0.5, 0])
            for x in xs_m1
        ]
        merge_curve1 = VMobject(stroke_color=BLUE_3B1B, stroke_width=1.5)
        merge_curve1.set_points_smoothly(merge_pts1)
        merge_pts2 = [
            merge_center + np.array([x * 0.2 + 0.3, norm.pdf(x, 0, 1) * 0.5, 0])
            for x in xs_m1
        ]
        merge_curve2 = VMobject(stroke_color=YELLOW_3B1B, stroke_width=1.5)
        merge_curve2.set_points_smoothly(merge_pts2)

        mini_visuals = [
            dots_group, mini_hist, mini_bell,
            mini_shade, VGroup(inv_arrow, inv_label),
            VGroup(merge_curve1, merge_curve2),
        ]

        # ──────────────────────────────────────────────
        # ANIMATE: Build concept map node by node
        # ──────────────────────────────────────────────

        # Node 1: Sampling Variability
        self.play(FadeIn(node_var), run_time=0.5)
        self.play(FadeIn(dots_group), run_time=0.3)
        desc1 = Text("Samples vary from population", font_size=18, color=GRAY)
        desc1.next_to(node_var, RIGHT, buff=0.2)
        self.play(Write(desc1), run_time=0.3)
        self.wait(0.3)
        self.play(FadeOut(dots_group), FadeOut(desc1), run_time=0.3)

        # Arrow 1
        self.play(Create(arrow_1), run_time=0.3)

        # Node 2: Sampling Distribution
        self.play(FadeIn(node_dist), run_time=0.5)
        self.play(FadeIn(mini_hist), run_time=0.3)
        desc2 = Text("Pattern of all possible samples", font_size=18, color=GRAY)
        desc2.next_to(node_dist, RIGHT, buff=1.8)
        self.play(Write(desc2), run_time=0.3)
        self.wait(0.3)
        self.play(FadeOut(mini_hist), FadeOut(desc2), run_time=0.3)

        # Arrow 2
        self.play(Create(arrow_2), run_time=0.3)

        # Node 3: Normal Distribution
        self.play(FadeIn(node_normal), run_time=0.5)
        self.play(Create(mini_bell), run_time=0.3)
        desc3 = Text("Bell curve, z-scores", font_size=18, color=GRAY)
        desc3.next_to(mini_bell, RIGHT, buff=0.15)
        self.play(Write(desc3), run_time=0.3)
        self.wait(0.3)
        self.play(FadeOut(mini_bell), FadeOut(desc3), run_time=0.3)

        # Arrows to three leaves
        self.play(
            Create(arrow_3a), Create(arrow_3b), Create(arrow_3c),
            run_time=0.5,
        )

        # Node 4: Finding Probabilities
        self.play(FadeIn(node_prob), run_time=0.4)
        self.play(FadeIn(mini_shade), run_time=0.3)
        desc4 = Text("Area under curve", font_size=16, color=GRAY)
        desc4.next_to(node_prob, DOWN, buff=0.1)
        self.play(Write(desc4), run_time=0.3)
        self.wait(0.2)
        self.play(FadeOut(mini_shade), FadeOut(desc4), run_time=0.3)

        # Node 5: Finding Values
        self.play(FadeIn(node_vals), run_time=0.4)
        self.play(FadeIn(inv_arrow), Write(inv_label), run_time=0.3)
        desc5 = Text("Inverse normal", font_size=16, color=GRAY)
        desc5.next_to(node_vals, DOWN, buff=0.1)
        self.play(Write(desc5), run_time=0.3)
        self.wait(0.2)
        self.play(FadeOut(inv_arrow), FadeOut(inv_label), FadeOut(desc5),
                  run_time=0.3)

        # Node 6: Combining Distributions
        self.play(FadeIn(node_combo), run_time=0.4)
        self.play(Create(merge_curve1), Create(merge_curve2), run_time=0.3)
        desc6 = Text("Linear combos", font_size=16, color=GRAY)
        desc6.next_to(node_combo, DOWN, buff=0.1)
        self.play(Write(desc6), run_time=0.3)
        self.wait(0.2)
        self.play(FadeOut(merge_curve1), FadeOut(merge_curve2), FadeOut(desc6),
                  run_time=0.3)

        self.wait(0.5)

        # ──────────────────────────────────────────────
        # PULSE each node in sequence (quick review)
        # ──────────────────────────────────────────────
        node_colors = [BLUE_3B1B, TEAL_3B1B, YELLOW_3B1B,
                       GREEN_3B1B, PINK_3B1B, RED]
        for node, color in zip(all_nodes, node_colors):
            self.play(
                node[0].animate.set_fill(opacity=0.4),
                run_time=0.2,
            )
            self.play(
                node[0].animate.set_fill(opacity=0.12),
                run_time=0.2,
            )

        self.wait(0.3)

        # ──────────────────────────────────────────────
        # FINAL BANNER
        # ──────────────────────────────────────────────
        # Fade the concept map slightly
        map_group = VGroup(*all_nodes, *all_arrows)
        self.play(map_group.animate.set_opacity(0.25), run_time=0.5)

        banner = VGroup(
            Text("Unit 5.1-5.2 Complete", font_size=38,
                 color=WHITE, weight=BOLD),
            Text("From Sample Variability to Normal Calculations",
                 font_size=26, color=YELLOW_3B1B),
        ).arrange(DOWN, buff=0.15)
        banner.move_to(ORIGIN)

        banner_box = SurroundingRectangle(
            banner, color=YELLOW_3B1B, buff=0.3, corner_radius=0.15,
            fill_color="#1C1C1C", fill_opacity=0.85,
        )

        self.play(FadeIn(banner_box), Write(banner), run_time=1)

        # Key formulas quick flash
        formulas = VGroup(
            Text("z = (x - μ) / σ", font_size=28, color=TEAL_3B1B),
            Text("P(a < Z < b)", font_size=28, color=GREEN_3B1B),
            Text("σ(X±Y) = √(σX² + σY²)", font_size=28, color=PINK_3B1B),
        ).arrange(RIGHT, buff=1)
        formulas.next_to(banner_box, DOWN, buff=0.4)

        self.play(Write(formulas), run_time=0.8)

        self.wait(2.5)
