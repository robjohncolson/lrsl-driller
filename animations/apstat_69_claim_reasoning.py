"""
Visualize how interval values are checked against a claim.

Run with: manim -qm --format=mp4 animations/apstat_69_claim_reasoning.py TwoPropClaimReasoning
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"


class TwoPropClaimReasoning(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Justify the Claim", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.35)

        claim_box = RoundedRectangle(
            corner_radius=0.2,
            width=9.2,
            height=1.4,
            stroke_color=YELLOW_3B1B,
            stroke_width=4,
        )
        claim_box.set_fill(YELLOW_3B1B, opacity=0.1)
        claim_box.shift(UP * 1.55)
        claim_title = Text("Claim", font_size=24, color=YELLOW_3B1B, weight=BOLD)
        claim_title.next_to(claim_box.get_top(), DOWN, buff=0.22)
        claim_text = Text("p1 is lower than p2", font_size=30, color=WHITE, weight=BOLD).move_to(claim_box.get_center() + DOWN * 0.1)

        yes_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.8,
            height=3.0,
            stroke_color=GREEN_3B1B,
            stroke_width=4,
        )
        yes_box.set_fill(GREEN_3B1B, opacity=0.12)
        yes_box.shift(LEFT * 3.2 + DOWN * 1.15)
        yes_title = Text("Supports Claim", font_size=24, color=GREEN_3B1B, weight=BOLD)
        yes_title.next_to(yes_box.get_top(), DOWN, buff=0.22)
        yes_line_1 = Text("All interval values", font_size=24, color=WHITE).move_to(yes_box.get_center() + UP * 0.45)
        yes_line_2 = Text("are consistent", font_size=24, color=WHITE).move_to(yes_box.get_center() + UP * 0.05)
        yes_line_3 = Text("with the claim", font_size=24, color=WHITE).move_to(yes_box.get_center() + DOWN * 0.35)

        no_box = RoundedRectangle(
            corner_radius=0.2,
            width=4.8,
            height=3.0,
            stroke_color=PINK_3B1B,
            stroke_width=4,
        )
        no_box.set_fill(PINK_3B1B, opacity=0.12)
        no_box.shift(RIGHT * 3.2 + DOWN * 1.15)
        no_title = Text("Does Not Support", font_size=24, color=PINK_3B1B, weight=BOLD)
        no_title.next_to(no_box.get_top(), DOWN, buff=0.22)
        no_line_1 = Text("One or more values", font_size=24, color=WHITE).move_to(no_box.get_center() + UP * 0.45)
        no_line_2 = Text("are inconsistent", font_size=24, color=WHITE).move_to(no_box.get_center() + UP * 0.05)
        no_line_3 = Text("with the claim", font_size=24, color=WHITE).move_to(no_box.get_center() + DOWN * 0.35)

        arrows = VGroup(
            Arrow(claim_box.get_bottom() + LEFT * 1.8, yes_box.get_top(), buff=0.16, color=GREEN_3B1B),
            Arrow(claim_box.get_bottom() + RIGHT * 1.8, no_box.get_top(), buff=0.16, color=PINK_3B1B),
        )

        note = Text("Check whether every plausible value fits the claim.", font_size=24, color=TEAL_3B1B, weight=BOLD)
        note.to_edge(DOWN, buff=0.45)

        self.play(Write(title), run_time=0.8)
        self.play(Create(claim_box), Write(claim_title), Write(claim_text), run_time=1.0)
        self.play(Create(arrows[0]), Create(yes_box), Write(yes_title), run_time=0.8)
        self.play(Write(yes_line_1), Write(yes_line_2), Write(yes_line_3), run_time=0.8)
        self.play(Create(arrows[1]), Create(no_box), Write(no_title), run_time=0.8)
        self.play(Write(no_line_1), Write(no_line_2), Write(no_line_3), run_time=0.8)
        self.play(FadeIn(note, shift=UP * 0.1), run_time=0.6)
        self.wait(2.4)
