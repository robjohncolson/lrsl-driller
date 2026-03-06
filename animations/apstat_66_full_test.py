"""
Full Significance Test (AP Stats Unit 6, Topic 6.6)

Walks through all six steps of a complete one-sample z-test for a
population proportion: hypotheses, significance level, procedure,
conditions, calculations, and conclusion.

Run with: manim -qm --format=mp4 apstat_66_full_test.py FullSignificanceTest
"""
from manim import *
import numpy as np

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
PINK_3B1B = "#EC4899"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class FullSignificanceTest(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Complete Significance Test", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "All six steps in one place",
            font_size=24, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== STEP LIST ==========
        steps = [
            ("1", "State H\u2080 and H\u2090, define parameter", GREEN_3B1B),
            ("2", "Identify significance level (\u03b1)", YELLOW_3B1B),
            ("3", "Name the procedure", TEAL_3B1B),
            ("4", "Check conditions (Random, 10%, Large Counts)", BLUE_3B1B),
            ("5", "Calculate z and p-value", ORANGE_3B1B),
            ("6", "Conclusion: compare p-value to \u03b1", PINK_3B1B),
        ]

        step_group = VGroup()
        prev = title
        for num, desc, color in steps:
            # Number circle
            circle = Circle(radius=0.22, color=color, fill_opacity=0.3)
            num_text = Text(num, font_size=20, color=color, weight=BOLD)
            num_text.move_to(circle)
            badge = VGroup(circle, num_text)

            # Description
            desc_text = Text(desc, font_size=20, color=WHITE)
            row = VGroup(badge, desc_text).arrange(RIGHT, buff=0.2)

            if step_group:
                row.next_to(step_group[-1], DOWN, buff=0.18, aligned_edge=LEFT)
            else:
                row.next_to(title, DOWN, buff=0.4).align_to(LEFT * 4.5, LEFT)

            step_group.add(row)

        for row in step_group:
            self.play(FadeIn(row), run_time=0.4)
            self.wait(0.2)

        self.wait(0.5)

        # ========== HIGHLIGHT STEP 6 ==========
        highlight = SurroundingRectangle(
            step_group[-1], color=PINK_3B1B, buff=0.12, corner_radius=0.1,
        )
        new_label = Text(
            "Today's focus: the conclusion!",
            font_size=22, color=PINK_3B1B, weight=BOLD,
        )
        new_label.next_to(highlight, DOWN, buff=0.2)

        self.play(Create(highlight), Write(new_label), run_time=0.5)
        self.wait(0.5)

        # ========== CONCLUSION TEMPLATE ==========
        self.play(*[FadeOut(mob) for mob in self.mobjects if mob != title])

        template_label = Text(
            "Conclusion template:", font_size=24, color=ORANGE_3B1B, weight=BOLD,
        )
        template_label.next_to(title, DOWN, buff=0.4).align_to(LEFT * 5.5, LEFT)
        self.play(Write(template_label), run_time=0.3)

        t1 = Text(
            "\"Because the p-value of ___",
            font_size=22, color=GREEN_3B1B,
        )
        t1.next_to(template_label, DOWN, buff=0.2, aligned_edge=LEFT)

        t2 = Text(
            "is [less than / greater than] \u03b1 = ___,",
            font_size=22, color=GREEN_3B1B,
        )
        t2.next_to(t1, DOWN, buff=0.08, aligned_edge=LEFT)

        t3 = Text(
            "we [reject / fail to reject] H\u2080.",
            font_size=22, color=YELLOW_3B1B,
        )
        t3.next_to(t2, DOWN, buff=0.08, aligned_edge=LEFT)

        t4 = Text(
            "There [is / is not] convincing statistical",
            font_size=22, color=BLUE_3B1B,
        )
        t4.next_to(t3, DOWN, buff=0.08, aligned_edge=LEFT)

        t5 = Text(
            "evidence that [Ha in context].\"",
            font_size=22, color=BLUE_3B1B,
        )
        t5.next_to(t4, DOWN, buff=0.08, aligned_edge=LEFT)

        for t in [t1, t2, t3, t4, t5]:
            self.play(Write(t), run_time=0.4)

        template_box = SurroundingRectangle(
            VGroup(t1, t2, t3, t4, t5),
            color=TEAL_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Create(template_box), run_time=0.4)
        self.wait(2.0)
