"""
State the Conclusion (AP Stats Unit 7, Topic 7.5)

Shows how to compare the p-value to the significance level (alpha)
and state a proper conclusion. Covers reject and fail-to-reject cases,
and demonstrates the four-part conclusion template.

Run with: manim -qm --format=mp4 apstat_75_state_conclusion.py MeanTestConclusion
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


class MeanTestConclusion(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Stating the Conclusion", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Compare p-value to \u03b1, then conclude in context",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== DECISION RULE ==========
        rule_label = Text("Decision Rule:", font_size=24, color=GREY_B, weight=BOLD)
        rule_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 5.5, LEFT)
        self.play(Write(rule_label), run_time=0.3)

        reject_text = Text(
            "If p-value \u2264 \u03b1  \u2192  Reject H\u2080",
            font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        reject_text.next_to(rule_label, DOWN, buff=0.2)

        fail_text = Text(
            "If p-value > \u03b1  \u2192  Fail to reject H\u2080",
            font_size=24, color=ORANGE_3B1B, weight=BOLD,
        )
        fail_text.next_to(reject_text, DOWN, buff=0.15)

        self.play(Write(reject_text), run_time=0.5)
        self.play(Write(fail_text), run_time=0.5)
        self.wait(0.5)

        # Warning
        warn = Text(
            "Never say \"accept H\u2080\" \u2014 we only fail to reject it",
            font_size=18, color=RED_3B1B,
        )
        warn.next_to(fail_text, DOWN, buff=0.2)
        warn_box = SurroundingRectangle(warn, color=RED_3B1B, buff=0.1, corner_radius=0.1)
        self.play(Write(warn), Create(warn_box), run_time=0.5)
        self.wait(0.5)

        self.play(
            FadeOut(VGroup(rule_label, reject_text, fail_text, warn, warn_box)),
            run_time=0.4,
        )

        # ========== EXAMPLE 1: GOT HOPS (fail to reject) ==========
        ex1_label = Text(
            "Got Hops:  p-value = 0.1412,  \u03b1 = 0.05",
            font_size=22, color=ORANGE_3B1B, weight=BOLD,
        )
        ex1_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex1_label), run_time=0.4)

        compare1 = Text(
            "0.1412 > 0.05  \u2192  Fail to reject H\u2080",
            font_size=24, color=ORANGE_3B1B, weight=BOLD,
        )
        compare1.next_to(ex1_label, DOWN, buff=0.2)
        self.play(Write(compare1), run_time=0.5)

        concl1_line1 = Text(
            "Because the p-value of 0.1412 > \u03b1 = 0.05,",
            font_size=20, color=WHITE,
        )
        concl1_line2 = Text(
            "we fail to reject H\u2080. We do not have convincing",
            font_size=20, color=WHITE,
        )
        concl1_line3 = Text(
            "evidence that the true mean vertical jump for",
            font_size=20, color=WHITE,
        )
        concl1_line4 = Text(
            "all students at this school differs from 15 inches.",
            font_size=20, color=WHITE,
        )
        concl1 = VGroup(concl1_line1, concl1_line2, concl1_line3, concl1_line4)
        concl1.arrange(DOWN, buff=0.08, aligned_edge=LEFT)
        concl1.next_to(compare1, DOWN, buff=0.2).align_to(LEFT * 5, LEFT)

        for line in concl1:
            self.play(Write(line), run_time=0.35)

        concl1_box = SurroundingRectangle(
            concl1, color=ORANGE_3B1B, buff=0.12, corner_radius=0.1,
        )
        self.play(Create(concl1_box), run_time=0.3)
        self.wait(1.0)

        self.play(FadeOut(VGroup(ex1_label, compare1, concl1, concl1_box)), run_time=0.4)

        # ========== EXAMPLE 2: TREAD40 (reject) ==========
        ex2_label = Text(
            "Tread40:  p-value \u2248 0.0000001,  \u03b1 = 0.05",
            font_size=22, color=GREEN_3B1B, weight=BOLD,
        )
        ex2_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex2_label), run_time=0.4)

        compare2 = Text(
            "0.0000001 < 0.05  \u2192  Reject H\u2080",
            font_size=24, color=GREEN_3B1B, weight=BOLD,
        )
        compare2.next_to(ex2_label, DOWN, buff=0.2)
        self.play(Write(compare2), run_time=0.5)

        concl2_line1 = Text(
            "Because the p-value \u2248 0.0000001 < \u03b1 = 0.05,",
            font_size=20, color=WHITE,
        )
        concl2_line2 = Text(
            "we reject H\u2080. We have convincing evidence",
            font_size=20, color=WHITE,
        )
        concl2_line3 = Text(
            "that the true mean mileage for all Tread40",
            font_size=20, color=WHITE,
        )
        concl2_line4 = Text(
            "tires is greater than 40,000 miles.",
            font_size=20, color=WHITE,
        )
        concl2 = VGroup(concl2_line1, concl2_line2, concl2_line3, concl2_line4)
        concl2.arrange(DOWN, buff=0.08, aligned_edge=LEFT)
        concl2.next_to(compare2, DOWN, buff=0.2).align_to(LEFT * 5, LEFT)

        for line in concl2:
            self.play(Write(line), run_time=0.35)

        concl2_box = SurroundingRectangle(
            concl2, color=GREEN_3B1B, buff=0.12, corner_radius=0.1,
        )
        self.play(Create(concl2_box), run_time=0.3)
        self.wait(0.5)

        # ========== CONCLUSION CHECKLIST ==========
        self.play(FadeOut(VGroup(ex2_label, compare2, concl2, concl2_box)), run_time=0.4)

        checklist_label = Text("Conclusion Checklist", font_size=26, color=BLUE_3B1B, weight=BOLD)
        checklist_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(checklist_label), run_time=0.3)

        items = [
            "\u2713  Compare p-value to \u03b1",
            "\u2713  State reject or fail to reject H\u2080",
            "\u2713  Link to Ha in context",
            "\u2713  Use \"convincing evidence\" language",
        ]

        item_texts = []
        prev = checklist_label
        for item in items:
            t = Text(item, font_size=22, color=GREEN_3B1B)
            t.next_to(prev, DOWN, buff=0.15, aligned_edge=LEFT)
            if prev == checklist_label:
                t.align_to(LEFT * 4, LEFT)
            item_texts.append(t)
            prev = t
            self.play(Write(t), run_time=0.35)

        self.wait(1.5)
