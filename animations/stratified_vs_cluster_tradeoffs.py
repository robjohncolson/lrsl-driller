"""
Stratified vs Cluster Tradeoffs (AP Stats Unit 3, Topic 3.3d)

Focuses on WHEN to use each and the tradeoffs involved.

Run with: manim -qm --format=mp4 stratified_vs_cluster_tradeoffs.py StratifiedVsClusterTradeoffs
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class StratifiedVsClusterTradeoffs(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Stratified vs Cluster: Tradeoffs", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== STRATIFIED ==========
        strat_title = Text("Stratified", font_size=24, color=ManimColor(BLUE_3B1B), weight=BOLD)
        strat_title.next_to(title, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        strat_items = VGroup(
            Text("SOME from EVERY group", font_size=17, color=ManimColor(GREEN_3B1B)),
            Text("Guarantees all subgroups are represented", font_size=17, color=GREY_B),
            Text("Need a list of members in each stratum", font_size=17, color=GREY_B),
            Text("More precise estimates", font_size=17, color=ManimColor(GREEN_3B1B)),
        ).arrange(DOWN, buff=0.06, aligned_edge=LEFT).next_to(strat_title, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(strat_title), run_time=0.3)
        for item in strat_items:
            self.play(Write(item), run_time=0.25)
        self.wait(0.3)

        # ========== CLUSTER ==========
        clust_title = Text("Cluster", font_size=24, color=ManimColor(ORANGE_3B1B), weight=BOLD)
        clust_title.next_to(strat_items, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        clust_items = VGroup(
            Text("ALL from SOME groups", font_size=17, color=ManimColor(GREEN_3B1B)),
            Text("Cheaper when clusters are geographically spread", font_size=17, color=GREY_B),
            Text("Only need a list of clusters, not individuals", font_size=17, color=GREY_B),
            Text("More variability between samples", font_size=17, color=ManimColor(RED_3B1B)),
        ).arrange(DOWN, buff=0.06, aligned_edge=LEFT).next_to(clust_title, DOWN, buff=0.1, aligned_edge=LEFT)

        self.play(Write(clust_title), run_time=0.3)
        for item in clust_items:
            self.play(Write(item), run_time=0.25)
        self.wait(0.5)

        # ========== DECISION RULE ==========
        rule = VGroup(
            Text("Use STRATIFIED when groups differ from each other", font_size=17, color=ManimColor(BLUE_3B1B)),
            Text("Use CLUSTER when groups are similar to each other", font_size=17, color=ManimColor(ORANGE_3B1B)),
        ).arrange(DOWN, buff=0.1)
        rule.next_to(clust_items, DOWN, buff=0.35)
        for line in rule:
            self.play(Write(line), run_time=0.3)
        self.wait(0.5)

        closing = Text(
            "Stratified = precision. Cluster = practicality.",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
