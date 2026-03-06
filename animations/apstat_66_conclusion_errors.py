"""
Conclusion Errors (AP Stats Unit 6, Topic 6.6)

Shows common errors students make when writing conclusions for
significance tests: accepting H0, saying "proven," missing explicit
comparison, and concluding about H0 instead of Ha.

Run with: manim -qm --format=mp4 apstat_66_conclusion_errors.py ConclusionErrors
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


class ConclusionErrors(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        # ========== TITLE ==========
        title = Text("Common Conclusion Errors", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        subtitle = Text(
            "Mistakes to avoid on the AP Exam",
            font_size=24, color=ORANGE_3B1B,
        )
        subtitle.next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(subtitle))
        self.wait(0.5)
        self.play(FadeOut(subtitle), run_time=0.3)

        # ========== ERROR 1: Accept H0 ==========
        err1_wrong = Text(
            '\u2717 "We accept the null hypothesis."',
            font_size=22, color=RED_3B1B,
        )
        err1_wrong.next_to(title, DOWN, buff=0.5).align_to(LEFT * 5.5, LEFT)

        err1_right = Text(
            '\u2713 "We fail to reject H\u2080."',
            font_size=22, color=GREEN_3B1B,
        )
        err1_right.next_to(err1_wrong, DOWN, buff=0.12, aligned_edge=LEFT)

        err1_why = Text(
            "Lack of evidence against H\u2080 \u2260 proof H\u2080 is true",
            font_size=16, color=YELLOW_3B1B,
        )
        err1_why.next_to(err1_right, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(err1_wrong), run_time=0.4)
        self.play(Write(err1_right), run_time=0.4)
        self.play(Write(err1_why), run_time=0.3)
        self.wait(0.8)

        # ========== ERROR 2: Proven ==========
        err2_wrong = Text(
            '\u2717 "We have proven H\u2090 is true."',
            font_size=22, color=RED_3B1B,
        )
        err2_wrong.next_to(err1_why, DOWN, buff=0.3, aligned_edge=LEFT)

        err2_right = Text(
            '\u2713 "There is convincing statistical evidence..."',
            font_size=22, color=GREEN_3B1B,
        )
        err2_right.next_to(err2_wrong, DOWN, buff=0.12, aligned_edge=LEFT)

        err2_why = Text(
            "Statistics provides evidence, not proof",
            font_size=16, color=YELLOW_3B1B,
        )
        err2_why.next_to(err2_right, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(err2_wrong), run_time=0.4)
        self.play(Write(err2_right), run_time=0.4)
        self.play(Write(err2_why), run_time=0.3)
        self.wait(0.8)

        # ========== ERROR 3: No explicit comparison ==========
        err3_wrong = Text(
            '\u2717 "We reject H\u2080." (no comparison)',
            font_size=22, color=RED_3B1B,
        )
        err3_wrong.next_to(err2_why, DOWN, buff=0.3, aligned_edge=LEFT)

        err3_right = Text(
            '\u2713 "Because the p-value of ___ < \u03b1 = ___,\n     we reject H\u2080."',
            font_size=22, color=GREEN_3B1B,
        )
        err3_right.next_to(err3_wrong, DOWN, buff=0.12, aligned_edge=LEFT)

        err3_why = Text(
            "Must explicitly compare p-value to \u03b1",
            font_size=16, color=YELLOW_3B1B,
        )
        err3_why.next_to(err3_right, DOWN, buff=0.08, aligned_edge=LEFT)

        self.play(Write(err3_wrong), run_time=0.4)
        self.play(Write(err3_right), run_time=0.4)
        self.play(Write(err3_why), run_time=0.3)
        self.wait(2.0)
