"""
Interpret the p-Value (AP Stats Unit 7, Topic 7.5)

Shows the template for interpreting a p-value in context.
Demonstrates correct and incorrect interpretations, and builds
the full interpretation sentence piece by piece.

Run with: manim -qm --format=mp4 apstat_75_interpret_pvalue.py MeanTestInterpretPValue
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


class MeanTestInterpretPValue(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Interpreting the p-Value", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "What does it actually mean?",
            font_size=26, color=TEAL_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(Write(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== TEMPLATE ==========
        template_label = Text("Template:", font_size=24, color=GREY_B, weight=BOLD)
        template_label.next_to(title, DOWN, buff=0.3).align_to(LEFT * 6, LEFT)
        self.play(Write(template_label), run_time=0.3)

        part1 = Text(
            "Assuming [H\u2080 in context],",
            font_size=22, color=YELLOW_3B1B,
        )
        part2 = Text(
            "there is a [p-value] probability of getting",
            font_size=22, color=WHITE,
        )
        part3 = Text(
            "a sample mean as [extreme/direction] as [observed],",
            font_size=22, color=WHITE,
        )
        part4 = Text(
            "or [more extreme], by chance alone.",
            font_size=22, color=WHITE,
        )

        template = VGroup(part1, part2, part3, part4).arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        template.next_to(template_label, DOWN, buff=0.2).align_to(LEFT * 5.5, LEFT)

        self.play(Write(part1), run_time=0.5)
        self.wait(0.3)
        self.play(Write(part2), run_time=0.5)
        self.play(Write(part3), run_time=0.5)
        self.play(Write(part4), run_time=0.5)
        self.wait(0.8)

        # ========== GOT HOPS EXAMPLE ==========
        self.play(FadeOut(VGroup(template_label, template)), run_time=0.4)

        ex_label = Text(
            "Got Hops: p-value = 0.1412",
            font_size=24, color=ORANGE_3B1B, weight=BOLD,
        )
        ex_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(ex_label), run_time=0.4)

        interp1 = Text(
            "Assuming the true mean vertical jump",
            font_size=21, color=YELLOW_3B1B,
        )
        interp2 = Text(
            "for all students at this school is 15 inches,",
            font_size=21, color=YELLOW_3B1B,
        )
        interp3 = Text(
            "there is a 0.1412 probability of getting",
            font_size=21, color=WHITE,
        )
        interp4 = Text(
            "a sample mean at least as far from 15 as",
            font_size=21, color=WHITE,
        )
        interp5 = Text(
            "15.8 inches, by chance alone.",
            font_size=21, color=WHITE,
        )

        interp = VGroup(interp1, interp2, interp3, interp4, interp5)
        interp.arrange(DOWN, buff=0.1, aligned_edge=LEFT)
        interp.next_to(ex_label, DOWN, buff=0.25).align_to(LEFT * 5, LEFT)

        for line in interp:
            self.play(Write(line), run_time=0.4)
        self.wait(0.8)

        interp_box = SurroundingRectangle(
            interp, color=GREEN_3B1B, buff=0.15, corner_radius=0.1,
        )
        self.play(Create(interp_box), run_time=0.3)
        self.wait(0.5)

        # ========== COMMON MISTAKES ==========
        self.play(FadeOut(VGroup(ex_label, interp, interp_box)), run_time=0.4)

        mistakes_label = Text(
            "Common Mistakes",
            font_size=26, color=RED_3B1B, weight=BOLD,
        )
        mistakes_label.next_to(title, DOWN, buff=0.25)
        self.play(Write(mistakes_label), run_time=0.3)

        wrong1 = Text(
            "\u2718  \"The probability that H\u2080 is true is 0.1412\"",
            font_size=20, color=RED_3B1B,
        )
        fix1 = Text(
            "   p-value assumes H\u2080 is true \u2014 it is not the probability of H\u2080",
            font_size=17, color=GREY_B,
        )

        wrong2 = Text(
            "\u2718  \"There is a 14% chance the mean is 15 inches\"",
            font_size=20, color=RED_3B1B,
        )
        fix2 = Text(
            "   \u03bc is a fixed value, not random \u2014 the p-value is about the data",
            font_size=17, color=GREY_B,
        )

        wrong3 = Text(
            "\u2718  Forgetting to mention context and direction",
            font_size=20, color=RED_3B1B,
        )
        fix3 = Text(
            "   Always include the specific parameter and \"as extreme or more extreme\"",
            font_size=17, color=GREY_B,
        )

        mistakes = VGroup(wrong1, fix1, wrong2, fix2, wrong3, fix3)
        mistakes.arrange(DOWN, buff=0.12, aligned_edge=LEFT)
        mistakes.next_to(mistakes_label, DOWN, buff=0.25).align_to(LEFT * 5.5, LEFT)

        for item in mistakes:
            self.play(Write(item), run_time=0.4)
        self.wait(1.5)
