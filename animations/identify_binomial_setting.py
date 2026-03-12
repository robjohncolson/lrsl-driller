"""
Identify a Binomial Setting (AP Stats Unit 4, Topic 4.10b)

Given a scenario, check if all four BINS conditions are met.

Run with: manim -qm --format=mp4 identify_binomial_setting.py IdentifyBinomialSetting
"""
from manim import *

BLUE_3B1B = "#3B82F6"
YELLOW_3B1B = "#FACC15"
TEAL_3B1B = "#2DD4BF"
GREEN_3B1B = "#22C55E"
RED_3B1B = "#EF4444"
ORANGE_3B1B = "#F97316"


class IdentifyBinomialSetting(Scene):
    def construct(self):
        self.camera.background_color = "#1C1C1C"

        title = Text("Identify a Binomial Setting", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.3)

        # ========== SCENARIO ==========
        scenario = Text(
            "A basketball player shoots 15 free throws. She makes 70% historically.",
            font_size=20, color=GREY_B,
        )
        scenario.next_to(title, DOWN, buff=0.3)
        self.play(Write(scenario), run_time=0.4)
        self.wait(0.3)

        # ========== BINS CHECKLIST ==========
        checks = [
            ("B — Binary?", "Make or miss", GREEN_3B1B, True),
            ("I — Independent?", "Each shot independent", GREEN_3B1B, True),
            ("N — Fixed number?", "n = 15 shots", GREEN_3B1B, True),
            ("S — Same probability?", "p = 0.70 each shot", GREEN_3B1B, True),
        ]

        prev = scenario
        for label, detail, color, passes in checks:
            check_mark = Text("Yes", font_size=16, color=ManimColor(color)) if passes else Text("No", font_size=16, color=ManimColor(RED_3B1B))
            row = VGroup(
                Text(label, font_size=20, color=ManimColor(TEAL_3B1B), weight=BOLD),
                Text(detail, font_size=17, color=GREY_B),
                check_mark,
            ).arrange(RIGHT, buff=0.3)
            row.next_to(prev, DOWN, buff=0.25).align_to(LEFT * 5.5, LEFT)
            self.play(Write(row), run_time=0.35)
            prev = row

        self.wait(0.5)

        verdict = Text(
            "All four BINS met — this IS a binomial setting!",
            font_size=22, color=ManimColor(GREEN_3B1B), weight=BOLD,
        )
        verdict.next_to(prev, DOWN, buff=0.4)
        self.play(Write(verdict), run_time=0.4)
        self.wait(0.5)

        # ========== COUNTER-EXAMPLE ==========
        self.play(*[FadeOut(m) for m in self.mobjects if m is not title], run_time=0.5)

        counter = Text(
            "Counter: Deal 5 cards from a deck. Count aces.",
            font_size=20, color=GREY_B,
        )
        counter.next_to(title, DOWN, buff=0.4)
        self.play(Write(counter), run_time=0.3)

        fail_checks = [
            ("B — Binary?", "Ace or not", GREEN_3B1B),
            ("I — Independent?", "NO — cards dealt without replacement", RED_3B1B),
            ("N — Fixed number?", "n = 5", GREEN_3B1B),
            ("S — Same probability?", "NO — changes after each card", RED_3B1B),
        ]

        prev = counter
        for label, detail, color in fail_checks:
            row = VGroup(
                Text(label, font_size=20, color=ManimColor(TEAL_3B1B), weight=BOLD),
                Text(detail, font_size=17, color=ManimColor(color)),
            ).arrange(RIGHT, buff=0.3)
            row.next_to(prev, DOWN, buff=0.2).align_to(LEFT * 5.5, LEFT)
            self.play(Write(row), run_time=0.3)
            prev = row

        closing = Text(
            "Without replacement breaks Independence and Same-p.",
            font_size=20, color=YELLOW_3B1B,
        )
        closing.to_edge(DOWN, buff=0.4)
        closing_box = SurroundingRectangle(closing, color=ManimColor(YELLOW_3B1B), buff=0.12, corner_radius=0.1)
        self.play(Write(closing), Create(closing_box), run_time=0.5)
        self.wait(1.5)
