"""
Why This Method? (AP Stats Unit 3, Topic 3.3g)

Explains the reasoning behind choosing a particular sampling method.

Run with: manim -qm --format=mp4 why_this_method.py WhyThisMethod
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class WhyThisMethod(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Why This Sampling Method?", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Match the method to the research goal and practical constraints.",
            font_size=19, color=ManimColor(TEAL_3B1B),
        )
        subtitle.next_to(title, DOWN, buff=0.25)
        self.play(Write(subtitle), run_time=0.4)

        # ========== SCENARIOS ==========
        scenarios = [
            ("Goal: Compare male vs female opinions",
             "Stratified by gender",
             "Guarantees both groups are represented equally",
             BLUE_3B1B),
            ("Goal: Survey residents across 50 neighborhoods",
             "Cluster sampling (pick 10 neighborhoods)",
             "Cheaper than traveling to all 50 areas",
             ORANGE_3B1B),
            ("Goal: Quick feedback from shoppers",
             "Convenience sample (people in store now)",
             "Fast but results may not generalize",
             RED_3B1B),
        ]

        prev = subtitle
        for goal, method, reason, color in scenarios:
            goal_t = Text(goal, font_size=18, color=GREY_B)
            goal_t.next_to(prev, DOWN, buff=0.35).align_to(LEFT * 5.5, LEFT)
            method_t = Text("\u2192 " + method, font_size=18, color=ManimColor(color), weight=BOLD)
            method_t.next_to(goal_t, DOWN, buff=0.06, aligned_edge=LEFT)
            reason_t = Text(reason, font_size=15, color=ManimColor(GREEN_3B1B))
            reason_t.next_to(method_t, DOWN, buff=0.04, aligned_edge=LEFT)
            self.play(Write(goal_t), run_time=0.3)
            self.play(Write(method_t), run_time=0.3)
            self.play(Write(reason_t), run_time=0.25)
            prev = reason_t

        self.wait(0.5)

        closing = Text(
            "Always justify: What does this method gain that SRS alone wouldn't?",
            font_size=18, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
